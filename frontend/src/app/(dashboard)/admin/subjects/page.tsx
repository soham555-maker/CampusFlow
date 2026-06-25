"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Library } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SearchBar from "@/components/ui/SearchBar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/store/toastStore";
import { mockSubjects, type Subject } from "@/lib/mockData";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Subject code is required"),
  credits: z.coerce.number().min(1).max(6),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SubjectsPage() {
  const toast = useToast();
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Subject | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return subjects.filter(
      (s) =>
        !search ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false)
    );
  }, [subjects, search]);

  const totalCredits = subjects.reduce((acc, s) => acc + s.credits, 0);

  const columns: Column<Subject>[] = [
    { key: "name", label: "Subject Name" },
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <span className="font-mono text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
          {row.code}
        </span>
      ),
    },
    {
      key: "credits",
      label: "Credits",
      render: (row) => <Badge variant="cyan">{row.credits} cr</Badge>,
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="text-gray-400 truncate max-w-xs block">
          {row.description ?? "—"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); setDeleteOpen(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  function openEdit(subject: Subject) {
    setSelected(subject);
    setValue("name", subject.name);
    setValue("code", subject.code);
    setValue("credits", subject.credits);
    setValue("description", subject.description ?? "");
    setEditOpen(true);
  }

  function onAdd(data: FormData) {
    setSaving(true);
    setTimeout(() => {
      const newSubject: Subject = {
        id: `sub-${Date.now()}`,
        name: data.name,
        code: data.code,
        credits: data.credits,
        description: data.description ?? null,
        created_at: new Date().toISOString(),
      };
      setSubjects((prev) => [newSubject, ...prev]);
      setAddOpen(false);
      reset();
      setSaving(false);
      toast.success("Subject added", `${data.name} has been added.`);
    }, 600);
  }

  function onEdit(data: FormData) {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setSubjects((prev) =>
        prev.map((s) => (s.id === selected.id ? { ...s, ...data, description: data.description ?? null } : s))
      );
      setEditOpen(false);
      reset();
      setSaving(false);
      toast.success("Subject updated");
    }, 600);
  }

  function onDelete() {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setSubjects((prev) => prev.filter((s) => s.id !== selected.id));
      setDeleteOpen(false);
      setSaving(false);
      toast.success("Subject removed");
      setSelected(null);
    }, 500);
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Subject Name</label>
          <input {...register("name")} className="input-glass" placeholder="Data Structures & Algorithms" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Subject Code</label>
          <input {...register("code")} className="input-glass font-mono" placeholder="CE301" />
          {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Credits</label>
        <input {...register("credits")} type="number" min={1} max={6} className="input-glass w-24" />
        {errors.credits && <p className="text-red-400 text-xs mt-1">{errors.credits.message}</p>}
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Description (optional)</label>
        <textarea
          {...register("description")}
          rows={3}
          className="input-glass resize-none"
          placeholder="Brief description of the subject…"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Subjects</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage course subjects and credits</p>
        </div>
        <Button onClick={() => { reset(); setAddOpen(true); }}>
          <span className="flex items-center gap-2"><Plus size={15} /> Add Subject</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Subjects" value={subjects.length} icon={Library} color="purple" delay={0.05} />
        <StatCard label="Total Credits" value={totalCredits} icon={Library} color="cyan" delay={0.1} />
        <StatCard label="Avg Credits" value={(totalCredits / subjects.length || 0).toFixed(1)} icon={Library} color="blue" delay={0.15} />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or subject code…" className="w-full max-w-md" />

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-xl">
          <EmptyState
            icon={Library}
            title="No subjects found"
            description="Try adjusting your search or add a new subject."
            action={{ label: "Add Subject", onClick: () => setAddOpen(true) }}
          />
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Add Subject">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Add Subject</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); reset(); }} title="Edit Subject">
        <form onSubmit={handleSubmit(onEdit)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        title="Delete Subject"
        description={`Are you sure you want to delete "${selected?.name}"? Classes using this subject will be affected.`}
        confirmLabel="Delete Subject"
        loading={saving}
      />
    </div>
  );
}
