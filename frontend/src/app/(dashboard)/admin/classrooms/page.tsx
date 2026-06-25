"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Building2, Monitor } from "lucide-react";
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
import { mockClassrooms, type Classroom } from "@/lib/mockData";

const schema = z.object({
  room_number: z.string().min(1, "Room number is required"),
  building: z.string().min(1, "Building is required"),
  floor: z.coerce.number().min(0),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  type: z.enum(["Lecture Hall", "Lab", "Seminar Room", "Tutorial Room"]),
  amenities: z.string(),
});

type FormData = z.infer<typeof schema>;

const typeOptions = [
  { label: "Lecture Hall", value: "Lecture Hall" },
  { label: "Lab", value: "Lab" },
  { label: "Seminar Room", value: "Seminar Room" },
  { label: "Tutorial Room", value: "Tutorial Room" },
];

const typeBadge: Record<string, "purple" | "cyan" | "info" | "default"> = {
  "Lecture Hall": "purple",
  Lab: "cyan",
  "Seminar Room": "info",
  "Tutorial Room": "default",
};

export default function ClassroomsPage() {
  const toast = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>(mockClassrooms);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Classroom | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return classrooms.filter((c) => {
      const matchSearch =
        !search ||
        c.room_number.toLowerCase().includes(q) ||
        c.building.toLowerCase().includes(q);
      const matchType = !filterType || c.type === filterType;
      return matchSearch && matchType;
    });
  }, [classrooms, search, filterType]);

  const totalCapacity = classrooms.reduce((a, c) => a + c.capacity, 0);

  const columns: Column<Classroom>[] = [
    { key: "room_number", label: "Room No." },
    { key: "building", label: "Building" },
    { key: "floor", label: "Floor" },
    { key: "capacity", label: "Capacity" },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <Badge variant={typeBadge[row.type] ?? "default"}>{row.type}</Badge>
      ),
    },
    {
      key: "amenities",
      label: "Amenities",
      render: (row) => (
        <span className="text-xs text-gray-400">
          {row.amenities.slice(0, 2).join(", ")}
          {row.amenities.length > 2 && ` +${row.amenities.length - 2}`}
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

  function openEdit(room: Classroom) {
    setSelected(room);
    setValue("room_number", room.room_number);
    setValue("building", room.building);
    setValue("floor", room.floor);
    setValue("capacity", room.capacity);
    setValue("type", room.type);
    setValue("amenities", room.amenities.join(", "));
    setEditOpen(true);
  }

  function onAdd(data: FormData) {
    setSaving(true);
    setTimeout(() => {
      const amenities = data.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      const newRoom: Classroom = {
        id: `room-${Date.now()}`,
        room_number: data.room_number,
        building: data.building,
        floor: data.floor,
        capacity: data.capacity,
        type: data.type,
        amenities,
        created_at: new Date().toISOString(),
      };
      setClassrooms((prev) => [newRoom, ...prev]);
      setAddOpen(false);
      reset();
      setSaving(false);
      toast.success("Classroom added", `${data.room_number} has been added.`);
    }, 600);
  }

  function onEdit(data: FormData) {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      const amenities = data.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      setClassrooms((prev) =>
        prev.map((c) =>
          c.id === selected.id ? { ...c, ...data, amenities } : c
        )
      );
      setEditOpen(false);
      reset();
      setSaving(false);
      toast.success("Classroom updated");
    }, 600);
  }

  function onDelete() {
    if (!selected) return;
    setSaving(true);
    setTimeout(() => {
      setClassrooms((prev) => prev.filter((c) => c.id !== selected.id));
      setDeleteOpen(false);
      setSaving(false);
      toast.success("Classroom removed");
      setSelected(null);
    }, 500);
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Room Number</label>
          <input {...register("room_number")} className="input-glass" placeholder="A-101" />
          {errors.room_number && <p className="text-red-400 text-xs mt-1">{errors.room_number.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Floor</label>
          <input {...register("floor")} type="number" min={0} className="input-glass" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Building</label>
        <input {...register("building")} className="input-glass" placeholder="Academic Block A" />
        {errors.building && <p className="text-red-400 text-xs mt-1">{errors.building.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Capacity</label>
          <input {...register("capacity")} type="number" min={1} className="input-glass" />
          {errors.capacity && <p className="text-red-400 text-xs mt-1">{errors.capacity.message}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Type</label>
          <select {...register("type")} className="input-glass">
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0a0a0f]">{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Amenities (comma-separated)</label>
        <input
          {...register("amenities")}
          className="input-glass"
          placeholder="Projector, AC, Whiteboard"
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">Classrooms</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage rooms, labs, and seminar halls</p>
        </div>
        <Button onClick={() => { reset(); setAddOpen(true); }}>
          <span className="flex items-center gap-2"><Plus size={15} /> Add Classroom</span>
        </Button>
      </motion.div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Rooms" value={classrooms.length} icon={Building2} color="purple" delay={0.05} />
        <StatCard label="Total Capacity" value={totalCapacity} icon={Building2} color="cyan" delay={0.1} />
        <StatCard label="Labs" value={classrooms.filter(c => c.type === "Lab").length} icon={Monitor} color="blue" delay={0.15} />
        <StatCard label="Lecture Halls" value={classrooms.filter(c => c.type === "Lecture Hall").length} icon={Building2} color="emerald" delay={0.2} />
      </div>

      <div className="flex items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by room or building…" className="flex-1" />
        <FilterDropdown value={filterType} onChange={setFilterType} options={typeOptions} placeholder="All Types" className="w-44" />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-xl">
          <EmptyState
            icon={Building2}
            title="No classrooms found"
            description="Try adjusting your filters or add a new classroom."
            action={{ label: "Add Classroom", onClick: () => setAddOpen(true) }}
          />
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      <Modal open={addOpen} onClose={() => { setAddOpen(false); reset(); }} title="Add Classroom">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-5">
          <FormFields />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">Add Classroom</Button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); reset(); }} title="Edit Classroom">
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
        title="Remove Classroom"
        description={`Remove ${selected?.room_number}? Timetable slots using this room will be affected.`}
        confirmLabel="Remove Classroom"
        loading={saving}
      />
    </div>
  );
}
