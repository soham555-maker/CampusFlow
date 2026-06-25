"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp, UserPlus, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SearchBar from "@/components/ui/SearchBar";
import FilterDropdown from "@/components/ui/FilterDropdown";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/store/toastStore";
import {
  mockClasses,
  mockSubjects,
  mockTeachers,
  mockTerms,
  mockStudents,
  type Class,
} from "@/lib/mockData";

const schema = z.object({
  subject_id: z.string().min(1, "Select a subject"),
  teacher_id: z.string().min(1, "Select a teacher"),
  term_id: z.string().min(1, "Select a term"),
  semester: z.coerce.number().min(1).max(8),
  division: z.string().min(1, "Division is required"),
});

type FormData = z.infer<typeof schema>;

const divisionOptions = ["A", "B", "C"].map((d) => ({ label: `Division ${d}`, value: d }));

export default function ClassesPage() {
  const toast = useToast();
  const [classes, setClasses] = useState<Class[]>(mockClasses);
  const [search, setSearch] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Class | null>(null);
  const [enrollStudentId, setEnrollStudentId] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return classes.filter((c) => {
      const matchSearch =
        !search ||
        c.subject_name.toLowerCase().includes(q) ||
        c.teacher_name.toLowerCase().includes(q);
      const matchTerm = !filterTerm || c.term_id === filterTerm;
      return matchSearch && matchTerm;
    });
  }, [classes, search, filterTerm]);

  const termOptions = mockTerms.map((t) => ({ label: t.name, value: t.id }));

  const columns: Column<Class>[] = [
    { key: "subject_name", label: "Subject" },
    { key: "teacher_name", label: "Teacher" },
    {
      key: "term_id",
      label: "Term",
      render: (row) => {
        const term = mockTerms.find((t) => t.id === row.term_id);
        return <span className="text-gray-400 text-xs">{term?.name ?? "—"}</span>;
      },
    },
    {
      key: "semester",
      label: "Semester",
      render: (row) => <Badge variant="purple">Sem {row.semester}</Badge>,
    },
    { key: "division", label: "Division" },
    {
      key: "student_count",
      label: "Students",
      render: (row) => (
        <span className="flex items-center gap-1.5 text-gray-300">
          <Users size={13} className="text-gray-500" />
          {row.student_count}
        </span>
      ),
    },
    {
      key: "join_code",
      label: "Join Code",
      render: (row) => (
        <span className="font-mono text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
          {row.join_code}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(expanded === row.id ? null : row.id); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="View students"
          >
            {expanded === row.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); setEnrollOpen(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/5 transition-colors cursor-pointer"
            title="Enroll student"
          >
            <UserPlus size={14} />
          </button>
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

  function openEdit(cls: Class) {
    setSelected(cls);
    setValue("subject_id", cls.subject_id);
    setValue("teacher_id", cls.teacher_id);
    setValue("term_id", cls.term_id);
    setValue("semester", cls.semester);
    setValue("division", cls.division);
    setEditOpen(true);
  }

  function onAdd(data: FormData) {
    setSaving(true);
    setTimeout(() => {
      const subject = mockSubjects.find((s) => s.id === data.subject_id);
      const teacher = mockTeachers.find((t) => t.id === data.teacher_id);
      const code = Math.random().toString(36).slice(2, 9).toUpperCase();
      const newClass: Class = {
        id: `cls-${Date.now()}`,
        subject_id: data.subject_id,
        teacher_id: data.teacher_id,
        term_id: data.term_id,
        semester: data.semester,
        division: data.division,
        join_code: code,
        subject_name: subject?.name ?? "Unknown",
        teacher_name: teacher?.full_name ?? "Unknown",
        student_count: 0,
        created_at: new Date().toISOString(),
      };
      setClasses((prev) => [newClass, ...prev]);
      setAddOpen(false);
      reset();
      setSaving(false);
      toast.success("Class created", `${subject?.name} created with code ${code}`);
    }, 600);
  }

  function onEdit(data: FormData) {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      const subject = mockSubjects.find((s) => s.id === data.subject_id);
      const teacher = mockTeachers.find((t) => t.id === data.teacher_id);
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? {
                ...c,
                ...data,
                subject_name: subject?.name ?? c.subject_name,
                teacher_name: teacher?.full_name ?? c.teacher_name,
              }
            : c
        )
      );
      setEditOpen(false);
      reset();
      setSaving(false);
      toast.success("Class updated");
    }, 600);
  }

  function onDelete() {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setClasses((prev) => prev.filter((c) => c.id !== selected.id));
      setDeleteOpen(false);
      setSaving(false);
      toast.success("Class deleted");
      setSelected(null);
    }, 500);
  }

  function onEnroll() {
    if (!selected || !enrollStudentId) return;
    setSaving(true);
    const student = mockStudents.find((s) => s.id === enrollStudentId);
    setTimeout(() => {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selected.id ? { ...c, student_count: c.student_count + 1 } : c
        )
      );
      setEnrollOpen(false);
      setEnrollStudentId("");
      setSaving(false);
      toast.success("Student enrolled", `${student?.full_name} enrolled successfully.`);
    }, 500);
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Subject</label>
        <select {...register("subject_id")} className="input-glass">
          <option value="">Select subject…</option>
          {mockSubjects.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#0a0a0f]">{s.name} ({s.code})</option>
          ))}
        </select>
        {errors.subject_id && <p className="text-red-400 text-xs mt-1">{errors.subject_id.message}</p>}
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Teacher</label>
        <select {...register("teacher_id")} className="input-glass">
          <option value="">Select teacher…</option>
          {mockTeachers.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#0a0a0f]">{t.full_name}</option>
          ))}
        </select>
        {errors.teacher_id && <p className="text-red-400 text-xs mt-1">{errors.teacher_id.message}</p>}
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Term</label>
        <select {...register("term_id")} className="input-glass">
          <option value="">Select term…</option>
          {mockTerms.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#0a0a0f]">{t.name}</option>
          ))}
        </select>
        {errors.term_id && <p className="text-red-400 text-xs mt-1">{errors.term_id.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Semester</label>
          <input {...register("semester")} type="number" min={1} max={8} className="input-glass" />
          {errors.semester && <p className="text-red-400 text-xs mt-1">{errors.semester.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Division</label>
          <input {...register("division")} className="input-glass" placeholder="A" />
          {errors.division && <p className="text-red-400 text-xs mt-1">{errors.division.message}</p>}
        </div>
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">Classes</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage classes and student enrollment</p>
        </div>
        <Button onClick={() => { reset(); setAddOpen(true); }}>
          <span className="flex items-center gap-2"><Plus size={15} /> Add Class</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Classes" value={classes.length} icon={BookOpen} color="purple" delay={0.05} />
        <StatCard label="Total Students" value={classes.reduce((a, c) => a + c.student_count, 0)} icon={Users} color="cyan" delay={0.1} />
        <StatCard label="Active Terms" value={mockTerms.filter((t) => t.is_active).length} icon={BookOpen} color="blue" delay={0.15} />
      </div>

      <div className="flex items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by subject or teacher…" className="flex-1" />
        <FilterDropdown value={filterTerm} onChange={setFilterTerm} options={termOptions} placeholder="All Terms" className="w-52" />
      </div>

      {/* Table with expandable rows */}
      <div className="space-y-0">
        {filtered.length === 0 ? (
          <div className="glass-panel rounded-xl">
            <EmptyState
              icon={BookOpen}
              title="No classes found"
              description="Try adjusting your filters or create a new class."
              action={{ label: "Add Class", onClick: () => setAddOpen(true) }}
            />
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )}

        {/* Expanded enrollment view */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-panel rounded-xl mt-2 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Enrolled Students — {classes.find((c) => c.id === expanded)?.subject_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {classes.find((c) => c.id === expanded)?.student_count} students
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelected(classes.find((c) => c.id === expanded) ?? null);
                    setEnrollOpen(true);
                  }}
                >
                  <span className="flex items-center gap-1.5"><UserPlus size={13} /> Enroll Student</span>
                </Button>
              </div>
              <div className="divide-y divide-white/5">
                {mockStudents.slice(0, 3).map((s) => (
                  <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{s.full_name}</p>
                      <p className="text-xs text-gray-400">{s.roll_number} · {s.email}</p>
                    </div>
                    <Badge variant="purple">Sem {s.semester}</Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Create Class">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Create Class</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); reset(); }} title="Edit Class">
        <form onSubmit={handleSubmit(onEdit)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Enroll Modal */}
      <Modal open={enrollOpen} onClose={() => { setEnrollOpen(false); setEnrollStudentId(""); }} title="Enroll Student">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Enrolling into <span className="text-white font-medium">{selected?.subject_name}</span>
          </p>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Select Student</label>
            <select
              value={enrollStudentId}
              onChange={(e) => setEnrollStudentId(e.target.value)}
              className="input-glass"
            >
              <option value="">Choose a student…</option>
              {mockStudents.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0a0a0f]">
                  {s.full_name} ({s.roll_number})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setEnrollOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={onEnroll} loading={saving} disabled={!enrollStudentId} className="flex-1">
              Enroll
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        title="Delete Class"
        description={`Delete "${selected?.subject_name}"? All timetable slots and enrollments will be removed.`}
        confirmLabel="Delete Class"
        loading={saving}
      />
    </div>
  );
}
