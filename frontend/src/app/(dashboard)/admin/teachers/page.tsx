"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
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
import { mockTeachers, type Teacher } from "@/lib/mockData";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
});

type FormData = z.infer<typeof schema>;

const departmentOptions = [
  { label: "Computer Engineering", value: "Computer Engineering" },
  { label: "Mathematics", value: "Mathematics" },
  { label: "Electronics", value: "Electronics" },
  { label: "Mechanical", value: "Mechanical" },
];

const designationOptions = [
  { label: "Professor", value: "Professor" },
  { label: "Associate Professor", value: "Associate Professor" },
  { label: "Assistant Professor", value: "Assistant Professor" },
  { label: "Lecturer", value: "Lecturer" },
];

export default function TeachersPage() {
  const toast = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Teacher | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        t.full_name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q);
      const matchDept = !filterDept || t.department === filterDept;
      return matchSearch && matchDept;
    });
  }, [teachers, search, filterDept]);

  const columns: Column<Teacher>[] = [
    { key: "full_name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "department", label: "Department" },
    {
      key: "designation",
      label: "Designation",
      render: (row) => <Badge variant="cyan">{row.designation}</Badge>,
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

  function openEdit(teacher: Teacher) {
    setSelected(teacher);
    setValue("full_name", teacher.full_name);
    setValue("email", teacher.email);
    setValue("department", teacher.department);
    setValue("designation", teacher.designation);
    setEditOpen(true);
  }

  function onAdd(data: FormData) {
    setSaving(true);
    setTimeout(() => {
      const newTeacher: Teacher = {
        id: `tch-${Date.now()}`,
        user_id: null,
        full_name: data.full_name,
        email: data.email,
        department: data.department,
        designation: data.designation,
        created_at: new Date().toISOString(),
      };
      setTeachers((prev) => [newTeacher, ...prev]);
      setAddOpen(false);
      reset();
      setSaving(false);
      toast.success("Teacher added", `${data.full_name} has been added.`);
    }, 600);
  }

  function onEdit(data: FormData) {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setTeachers((prev) =>
        prev.map((t) => (t.id === selected.id ? { ...t, ...data } : t))
      );
      setEditOpen(false);
      reset();
      setSaving(false);
      toast.success("Teacher updated", `${data.full_name} has been updated.`);
    }, 600);
  }

  function onDelete() {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setTeachers((prev) => prev.filter((t) => t.id !== selected.id));
      setDeleteOpen(false);
      setSaving(false);
      toast.success("Teacher removed");
      setSelected(null);
    }, 500);
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Full Name</label>
        <input {...register("full_name")} className="input-glass" placeholder="Dr. Anita Desai" />
        {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Email</label>
        <input {...register("email")} type="email" className="input-glass" placeholder="name@vjti.ac.in" />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Department</label>
        <input {...register("department")} className="input-glass" placeholder="Computer Engineering" />
        {errors.department && <p className="text-red-400 text-xs mt-1">{errors.department.message}</p>}
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Designation</label>
        <input {...register("designation")} className="input-glass" placeholder="Assistant Professor" />
        {errors.designation && <p className="text-red-400 text-xs mt-1">{errors.designation.message}</p>}
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">Teachers</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage teaching staff</p>
        </div>
        <Button onClick={() => { reset(); setAddOpen(true); }}>
          <span className="flex items-center gap-2"><Plus size={15} /> Add Teacher</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Teachers" value={teachers.length} icon={GraduationCap} color="cyan" delay={0.05} />
        <StatCard label="Departments" value={new Set(teachers.map(t => t.department)).size} icon={GraduationCap} color="purple" delay={0.1} />
        <StatCard label="Professors" value={teachers.filter(t => t.designation.includes("Professor")).length} icon={GraduationCap} color="blue" delay={0.15} />
      </div>

      <div className="flex items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or department…" className="flex-1" />
        <FilterDropdown value={filterDept} onChange={setFilterDept} options={departmentOptions} placeholder="All Departments" className="w-48" />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-xl">
          <EmptyState
            icon={GraduationCap}
            title="No teachers found"
            description="Try adjusting your search or add a new teacher."
            action={{ label: "Add Teacher", onClick: () => setAddOpen(true) }}
          />
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Add Teacher">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Add Teacher</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); reset(); }} title="Edit Teacher">
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
        title="Remove Teacher"
        description={`Are you sure you want to remove ${selected?.full_name}? This cannot be undone.`}
        confirmLabel="Remove Teacher"
        loading={saving}
      />
    </div>
  );
}
