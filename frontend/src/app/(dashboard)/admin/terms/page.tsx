"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, CalendarRange, CheckCircle, Circle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DataTable, { Column } from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/SkeletonLoader";
import { useTerms, useTermMutations, useSetActiveTerm } from "@/lib/api/hooks";
import type { Term } from "@/lib/api/types";

const schema = z.object({
  name: z.string().min(2, "Term name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  is_active: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TermsPage() {
  const { data: terms = [], isLoading } = useTerms();
  const { create, update, remove } = useTermMutations();
  const setActiveMutation = useSetActiveTerm();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Term | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  function setActive(termId: string) {
    const otherActiveIds = terms.filter((t) => t.is_active && t.id !== termId).map((t) => t.id);
    setActiveMutation.mutate({ id: termId, otherActiveIds });
  }

  const columns: Column<Term>[] = [
    { key: "name", label: "Term Name" },
    {
      key: "start_date",
      label: "Start Date",
      render: (row) => <span className="text-gray-300">{formatDate(row.start_date)}</span>,
    },
    {
      key: "end_date",
      label: "End Date",
      render: (row) => <span className="text-gray-300">{formatDate(row.end_date)}</span>,
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
      key: "is_active",
      label: "Status",
      render: (row) =>
        row.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="default">Inactive</Badge>
        ),
    },
    {
      key: "id",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {!row.is_active && (
            <button
              onClick={(e) => { e.stopPropagation(); setActive(row.id); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <Circle size={11} /> Set Active
            </button>
          )}
          {row.is_active && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-emerald-400">
              <CheckCircle size={11} /> Active
            </span>
          )}
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

  function openEdit(term: Term) {
    setSelected(term);
    setValue("name", term.name);
    setValue("start_date", term.start_date ?? "");
    setValue("end_date", term.end_date ?? "");
    setValue("is_active", term.is_active);
    setEditOpen(true);
  }

  function onAdd(data: FormData) {
    create.mutate(
      {
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: false,
      },
      { onSuccess: () => { setAddOpen(false); reset(); } }
    );
  }

  function onEdit(data: FormData) {
    if (!selected) return;
    update.mutate(
      {
        id: selected.id,
        body: { name: data.name, start_date: data.start_date, end_date: data.end_date },
      },
      { onSuccess: () => { setEditOpen(false); reset(); } }
    );
  }

  function onDelete() {
    if (!selected) return;
    remove.mutate(selected.id, {
      onSuccess: () => { setDeleteOpen(false); setSelected(null); },
    });
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Term Name</label>
        <input {...register("name")} className="input-glass" placeholder="Semester VI — 2025-26" />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Start Date</label>
          <input {...register("start_date")} type="date" className="input-glass" />
          {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">End Date</label>
          <input {...register("end_date")} type="date" className="input-glass" />
          {errors.end_date && <p className="text-red-400 text-xs mt-1">{errors.end_date.message}</p>}
        </div>
      </div>
    </div>
  );

  const activeCount = terms.filter((t) => t.is_active).length;
  const inactiveCount = terms.length - activeCount;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Terms</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage academic terms and semesters</p>
        </div>
        <Button onClick={() => { reset(); setAddOpen(true); }}>
          <span className="flex items-center gap-2"><Plus size={15} /> Add Term</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Terms" value={terms.length} icon={CalendarRange} color="purple" delay={0.05} />
        <StatCard label="Active" value={activeCount} icon={CalendarRange} color="emerald" delay={0.1} />
        <StatCard label="Inactive" value={inactiveCount} icon={CalendarRange} color="blue" delay={0.15} />
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : terms.length === 0 ? (
        <div className="glass-panel rounded-xl">
          <EmptyState
            icon={CalendarRange}
            title="No terms yet"
            description="Create your first academic term to get started."
            action={{ label: "Add Term", onClick: () => setAddOpen(true) }}
          />
        </div>
      ) : (
        <DataTable columns={columns} data={terms} />
      )}

      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Create Term">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-5">
          <FormFields />
          <p className="text-xs text-gray-500">A unique join code will be auto-generated.</p>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={create.isPending} className="flex-1">Create Term</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); reset(); }} title="Edit Term">
        <form onSubmit={handleSubmit(onEdit)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={update.isPending} className="flex-1">Save Changes</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        title="Delete Term"
        description={`Delete "${selected?.name}"? All classes and timetable slots under this term will be affected.`}
        confirmLabel="Delete Term"
        loading={remove.isPending}
      />
    </div>
  );
}
