"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
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
import { TableSkeleton } from "@/components/ui/SkeletonLoader";
import { useStudents, useStudentMutations } from "@/lib/api/hooks";
import type { Student } from "@/lib/api/types";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  roll_number: z.string().min(1, "Roll number is required"),
  semester: z.coerce.number().min(1).max(8),
  division: z.string().min(1, "Division is required"),
  year: z.coerce.number().min(1).max(4),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const divisionOptions = [
  { label: "Division A", value: "A" },
  { label: "Division B", value: "B" },
  { label: "Division C", value: "C" },
];

const yearOptions = [
  { label: "Year 1", value: "1" },
  { label: "Year 2", value: "2" },
  { label: "Year 3", value: "3" },
  { label: "Year 4", value: "4" },
];

export default function StudentsPage() {
  const { data: students = [], isLoading } = useStudents();
  const { create, update, remove } = useStudentMutations();
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDivision, setFilterDivision] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.roll_number ?? "").toLowerCase().includes(q);
      const matchYear = !filterYear || String(s.year) === filterYear;
      const matchDiv = !filterDivision || s.division === filterDivision;
      return matchSearch && matchYear && matchDiv;
    });
  }, [students, search, filterYear, filterDivision]);

  const columns: Column<Student>[] = [
    { key: "full_name", label: "Name" },
    { key: "roll_number", label: "Roll No." },
    { key: "email", label: "Email" },
    {
      key: "semester",
      label: "Semester",
      render: (row) => <Badge variant="purple">Sem {row.semester}</Badge>,
    },
    { key: "division", label: "Division" },
    { key: "year", label: "Year" },
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

  function openEdit(student: Student) {
    setSelected(student);
    setValue("full_name", student.full_name);
    setValue("email", student.email);
    setValue("roll_number", student.roll_number ?? "");
    setValue("semester", student.semester ?? 1);
    setValue("division", student.division ?? "");
    setValue("year", student.year ?? 1);
    setValue("phone", student.phone ?? "");
    setEditOpen(true);
  }

  function onAdd(data: FormData) {
    create.mutate(
      {
        full_name: data.full_name,
        email: data.email,
        roll_number: data.roll_number,
        semester: data.semester,
        division: data.division,
        year: data.year,
        phone: data.phone || null,
      },
      {
        onSuccess: () => {
          setAddOpen(false);
          reset();
        },
      }
    );
  }

  function onEdit(data: FormData) {
    if (!selected) return;
    update.mutate(
      {
        id: selected.id,
        body: {
          full_name: data.full_name,
          roll_number: data.roll_number,
          semester: data.semester,
          division: data.division,
          year: data.year,
          phone: data.phone || null,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          reset();
        },
      }
    );
  }

  function onDelete() {
    if (!selected) return;
    remove.mutate(selected.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelected(null);
      },
    });
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Full Name</label>
          <input {...register("full_name")} className="input-glass" placeholder="Arjun Sharma" />
          {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Roll Number</label>
          <input {...register("roll_number")} className="input-glass" placeholder="21103001" />
          {errors.roll_number && <p className="text-red-400 text-xs mt-1">{errors.roll_number.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Email</label>
        <input {...register("email")} type="email" className="input-glass" placeholder="name@vjti.ac.in" />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Phone (optional)</label>
        <input {...register("phone")} className="input-glass" placeholder="+91 98765 43210" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Year</label>
          <input {...register("year")} type="number" min={1} max={4} className="input-glass" />
          {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year.message}</p>}
        </div>
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Students</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage enrolled students</p>
        </div>
        <Button onClick={() => { reset(); setAddOpen(true); }}>
          <span className="flex items-center gap-2"><Plus size={15} /> Add Student</span>
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Students" value={students.length} icon={Users} color="purple" delay={0.05} />
        <StatCard label="Year 3" value={students.filter(s => s.year === 3).length} icon={Users} color="cyan" delay={0.1} />
        <StatCard label="Division A" value={students.filter(s => s.division === "A").length} icon={Users} color="blue" delay={0.15} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, or roll number…"
          className="flex-1"
        />
        <FilterDropdown
          value={filterYear}
          onChange={setFilterYear}
          options={yearOptions}
          placeholder="All Years"
          className="w-36"
        />
        <FilterDropdown
          value={filterDivision}
          onChange={setFilterDivision}
          options={divisionOptions}
          placeholder="All Divisions"
          className="w-40"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-xl">
          <EmptyState
            icon={Users}
            title="No students found"
            description="Try adjusting your search or filters, or add a new student."
            action={{ label: "Add Student", onClick: () => setAddOpen(true) }}
          />
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Add Student">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={create.isPending} className="flex-1">Add Student</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); reset(); }} title="Edit Student">
        <form onSubmit={handleSubmit(onEdit)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={update.isPending} className="flex-1">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        title="Remove Student"
        description={`Are you sure you want to remove ${selected?.full_name}? This action cannot be undone.`}
        confirmLabel="Remove Student"
        loading={remove.isPending}
      />
    </div>
  );
}
