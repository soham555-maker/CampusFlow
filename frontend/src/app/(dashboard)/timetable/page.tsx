"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Plus,
  Filter,
  Clock,
  Building2,
  GraduationCap,
  X,
  CheckCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FilterDropdown from "@/components/ui/FilterDropdown";
import GlassCard from "@/components/ui/GlassCard";
import Tabs from "@/components/ui/Tabs";
import { useToast } from "@/store/toastStore";
import {
  mockTimetableSlots,
  mockTeachers,
  mockClassrooms,
  mockClasses,
  mockTerms,
  type TimetableSlot,
} from "@/lib/mockData";
import { cn } from "@/utils/cn";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const HOUR_START = 8;
const HOUR_END = 18;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const SLOT_HEIGHT = 64;

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesFromStart(t: string) {
  return timeToMinutes(t) - HOUR_START * 60;
}

const SLOT_PALETTE = [
  { bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-200", dot: "bg-purple-400" },
  { bg: "bg-cyan-500/20", border: "border-cyan-500/30", text: "text-cyan-200", dot: "bg-cyan-400" },
  { bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-200", dot: "bg-blue-400" },
  { bg: "bg-pink-500/20", border: "border-pink-500/30", text: "text-pink-200", dot: "bg-pink-400" },
  { bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-200", dot: "bg-amber-400" },
];

const tabConfig = [
  { id: "grid", label: "Timetable", icon: CalendarDays },
  { id: "rooms", label: "Free Rooms", icon: Building2 },
  { id: "teachers", label: "Teacher Availability", icon: GraduationCap },
];

const teacherOptions = mockTeachers.map((t) => ({ label: t.full_name, value: t.id }));
const roomOptions = mockClassrooms.map((r) => ({ label: `${r.room_number} — ${r.building}`, value: r.id }));
const classOptions = mockClasses.map((c) => ({ label: c.subject_name, value: c.id }));
const termOptions = mockTerms.map((t) => ({ label: t.name, value: t.id }));
const dayOptions = DAYS.map((d) => ({ label: d, value: d }));

function SlotCard({
  slot,
  idx,
  onEdit,
  onDelete,
}: {
  slot: TimetableSlot;
  idx: number;
  onEdit?: (s: TimetableSlot) => void;
  onDelete?: (s: TimetableSlot) => void;
}) {
  const topMinutes = minutesFromStart(slot.start_time);
  const duration = timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time);
  const top = (topMinutes / 60) * SLOT_HEIGHT;
  const height = (duration / 60) * SLOT_HEIGHT;
  const p = SLOT_PALETTE[idx % SLOT_PALETTE.length];

  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-lg border px-2 py-1.5 overflow-hidden group cursor-pointer transition-all",
        "glass-frost",
        p.border
      )}
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      {/* Grain overlay for matte effect */}
      <div
        className="absolute inset-0 rounded-lg opacity-[0.07] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "120px 120px",
        }}
      />
      <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg", p.dot)} />
      <div className="pl-1.5">
        <p className={cn("text-[11px] font-semibold truncate leading-tight", p.text)}>
          {slot.subject_name}
        </p>
        {height > 36 && (
          <p className="text-[10px] text-white/50 truncate mt-0.5">{slot.room_number}</p>
        )}
        {height > 52 && (
          <p className="text-[10px] text-white/40 truncate">{slot.teacher_name}</p>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(slot); }}
              className="w-5 h-5 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <span className="text-[9px] text-white">✎</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(slot); }}
              className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors"
            >
              <X size={9} className="text-red-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TimetableGrid({
  slots,
  role,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
}: {
  slots: TimetableSlot[];
  role: "admin" | "teacher" | "student";
  onAddSlot?: (day: string, hour: number) => void;
  onEditSlot?: (s: TimetableSlot) => void;
  onDeleteSlot?: (s: TimetableSlot) => void;
}) {
  const slotsByDay = useMemo(() => {
    const map: Record<string, TimetableSlot[]> = {};
    DAYS.forEach((d) => (map[d] = []));
    slots.forEach((s) => { if (map[s.day]) map[s.day].push(s); });
    return map;
  }, [slots]);

  const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
    const h = HOUR_START + i;
    return `${h.toString().padStart(2, "0")}:00`;
  });

  const canEdit = role === "admin" || role === "teacher";

  return (
    <div className="glass-panel rounded-2xl overflow-auto">
      <div className="flex min-w-[760px]">
        {/* Time column */}
        <div className="w-14 shrink-0 pt-11 border-r border-white/[0.04]">
          {hourLabels.map((label) => (
            <div
              key={label}
              className="text-[9px] text-gray-600 text-right pr-2 leading-none select-none"
              style={{ height: `${SLOT_HEIGHT}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => (
          <div key={day} className="flex-1 min-w-0 border-r border-white/[0.04] last:border-0">
            <div className="h-11 flex items-center justify-center border-b border-white/[0.04]">
              <span className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">
                {day.slice(0, 3)}
              </span>
            </div>
            <div className="relative" style={{ height: `${TOTAL_HOURS * SLOT_HEIGHT}px` }}>
              {/* Hour lines */}
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-white/[0.025]"
                  style={{ top: `${i * SLOT_HEIGHT}px` }}
                />
              ))}
              {/* Half-hour lines */}
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute left-0 right-0 border-t border-white/[0.012]"
                  style={{ top: `${i * SLOT_HEIGHT + SLOT_HEIGHT / 2}px` }}
                />
              ))}
              {/* Click zones for adding */}
              {canEdit &&
                Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                  <div
                    key={`z-${i}`}
                    className="absolute left-0 right-0 hover:bg-purple-500/5 cursor-pointer transition-colors group"
                    style={{ top: `${i * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
                    onClick={() => onAddSlot?.(day, HOUR_START + i)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={12} className="text-purple-400/50" />
                    </div>
                  </div>
                ))}
              {/* Slots */}
              {slotsByDay[day].map((slot, idx) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  idx={idx}
                  onEdit={canEdit ? onEditSlot : undefined}
                  onDelete={canEdit ? onDeleteSlot : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FreeRoomsView() {
  const [filterDay, setFilterDay] = useState("Monday");
  const [filterFrom, setFilterFrom] = useState("09:00");
  const [filterTo, setFilterTo] = useState("10:00");

  const busyRoomIds = useMemo(() => {
    return new Set(
      mockTimetableSlots
        .filter((s) => {
          if (s.day !== filterDay) return false;
          const slotStart = timeToMinutes(s.start_time);
          const slotEnd = timeToMinutes(s.end_time);
          const qStart = timeToMinutes(filterFrom);
          const qEnd = timeToMinutes(filterTo);
          return Math.max(slotStart, qStart) < Math.min(slotEnd, qEnd);
        })
        .map((s) => s.classroom_id)
    );
  }, [filterDay, filterFrom, filterTo]);

  const freeRooms = mockClassrooms.filter((r) => !busyRoomIds.has(r.id));
  const busyRooms = mockClassrooms.filter((r) => busyRoomIds.has(r.id));

  return (
    <div className="space-y-5">
      <GlassCard className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Day</p>
          <FilterDropdown value={filterDay} onChange={setFilterDay} options={dayOptions} className="w-36" />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">From</p>
          <input
            type="time"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="input-glass h-9 text-sm w-28"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1.5">To</p>
          <input
            type="time"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="input-glass h-9 text-sm w-28"
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-emerald-400" />
            <h3 className="text-sm font-medium text-white">Free Rooms ({freeRooms.length})</h3>
          </div>
          <div className="space-y-2">
            {freeRooms.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">{r.room_number}</p>
                  <p className="text-xs text-gray-400">{r.building} · Floor {r.floor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Cap {r.capacity}</Badge>
                  <Badge variant="success">{r.type}</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <X size={14} className="text-red-400" />
            <h3 className="text-sm font-medium text-white">Occupied Rooms ({busyRooms.length})</h3>
          </div>
          <div className="space-y-2">
            {busyRooms.map((r) => {
              const slot = mockTimetableSlots.find((s) => s.classroom_id === r.id && s.day === filterDay);
              return (
                <div key={r.id} className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between opacity-50">
                  <div>
                    <p className="text-sm font-medium text-white">{r.room_number}</p>
                    <p className="text-xs text-gray-400">{slot?.subject_name ?? r.building}</p>
                  </div>
                  <Badge variant="error">Occupied</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherAvailabilityView() {
  const [filterDay, setFilterDay] = useState("Monday");

  const teacherSchedule = useMemo(() => {
    return mockTeachers.map((t) => {
      const daySlots = mockTimetableSlots.filter(
        (s) => s.teacher_id === t.id && s.day === filterDay
      );
      const freeWindows: string[] = [];
      let prev = HOUR_START;
      const sorted = [...daySlots].sort(
        (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
      );
      for (const slot of sorted) {
        const start = Math.floor(timeToMinutes(slot.start_time) / 60);
        if (start > prev) {
          freeWindows.push(`${prev}:00–${start}:00`);
        }
        prev = Math.ceil(timeToMinutes(slot.end_time) / 60);
      }
      if (prev < HOUR_END) freeWindows.push(`${prev}:00–${HOUR_END}:00`);
      return { teacher: t, slots: daySlots, freeWindows };
    });
  }, [filterDay]);

  return (
    <div className="space-y-5">
      <GlassCard className="flex items-end gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Day</p>
          <FilterDropdown value={filterDay} onChange={setFilterDay} options={dayOptions} className="w-44" />
        </div>
      </GlassCard>

      <div className="space-y-3">
        {teacherSchedule.map(({ teacher, slots, freeWindows }) => (
          <GlassCard key={teacher.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white">{teacher.full_name}</p>
                <p className="text-xs text-gray-400">{teacher.department} · {teacher.designation}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={slots.length === 0 ? "success" : "warning"}>
                  {slots.length} class{slots.length !== 1 ? "es" : ""}
                </Badge>
              </div>
            </div>

            {slots.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {slots.map((s) => (
                  <span
                    key={s.id}
                    className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded px-2 py-0.5"
                  >
                    {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)} · {s.subject_name}
                  </span>
                ))}
              </div>
            )}

            {freeWindows.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide">Free windows</p>
                <div className="flex flex-wrap gap-1.5">
                  {freeWindows.map((w) => (
                    <span
                      key={w}
                      className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded px-2 py-0.5"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function TimetablePage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("grid");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Mock role (in real app this comes from auth context)
  const role = "admin" as "admin" | "teacher" | "student";

  const [addOpen, setAddOpen] = useState(false);
  const [addDay, setAddDay] = useState("Monday");
  const [addHour, setAddHour] = useState(9);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<TimetableSlot[]>(mockTimetableSlots);

  const [addForm, setAddForm] = useState({
    class_id: "",
    classroom_id: "",
    day: "Monday",
    start_time: "09:00",
    end_time: "10:00",
  });

  const filtered = useMemo(() => {
    return slots.filter((s) => {
      const matchTeacher = !filterTeacher || s.teacher_id === filterTeacher;
      const matchRoom = !filterRoom || s.classroom_id === filterRoom;
      const matchClass = !filterClass || s.class_id === filterClass;
      const matchTerm = !filterTerm || s.term_id === filterTerm;
      return matchTeacher && matchRoom && matchClass && matchTerm;
    });
  }, [slots, filterTeacher, filterRoom, filterClass, filterTerm]);

  const activeFiltersCount = [filterTeacher, filterRoom, filterClass, filterTerm].filter(Boolean).length;

  function handleAddSlot(day: string, hour: number) {
    setAddDay(day);
    setAddHour(hour);
    setAddForm((f) => ({
      ...f,
      day,
      start_time: `${String(hour).padStart(2, "0")}:00`,
      end_time: `${String(hour + 1).padStart(2, "0")}:00`,
    }));
    setAddOpen(true);
  }

  function handleSaveSlot() {
    if (!addForm.class_id || !addForm.classroom_id) {
      toast.error("Missing fields", "Please fill in all required fields.");
      return;
    }
    setSaving(true);
    const cls = mockClasses.find((c) => c.id === addForm.class_id);
    const room = mockClassrooms.find((r) => r.id === addForm.classroom_id);
    setTimeout(() => {
      const newSlot: TimetableSlot = {
        id: `slot-${Date.now()}`,
        class_id: addForm.class_id,
        classroom_id: addForm.classroom_id,
        teacher_id: cls?.teacher_id ?? "tch-001",
        term_id: cls?.term_id ?? "term-001",
        day: addForm.day,
        start_time: `${addForm.start_time}:00`,
        end_time: `${addForm.end_time}:00`,
        subject_name: cls?.subject_name ?? "Class",
        teacher_name: cls?.teacher_name ?? "Teacher",
        room_number: room?.room_number ?? "Room",
        building: room?.building ?? "",
      };
      setSlots((prev) => [...prev, newSlot]);
      setAddOpen(false);
      setSaving(false);
      toast.success("Slot added", `${cls?.subject_name} on ${addForm.day}`);
    }, 600);
  }

  function handleDeleteSlot(slot: TimetableSlot) {
    setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    toast.success("Slot removed");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Timetable</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Manage schedules, check room availability, and view teacher free windows
          </p>
        </div>
        {role !== "student" && (
          <Button onClick={() => handleAddSlot("Monday", 9)}>
            <span className="flex items-center gap-2"><Plus size={15} /> Add Slot</span>
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs tabs={tabConfig} activeTab={activeTab} onChange={setActiveTab} />

      {/* Grid view filters */}
      {activeTab === "grid" && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 h-9 px-3 rounded-lg text-sm border transition-all cursor-pointer",
              showFilters || activeFiltersCount > 0
                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                : "glass-panel border-white/5 text-gray-400 hover:text-white"
            )}
          >
            <Filter size={14} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="text-xs bg-purple-500/20 text-purple-300 rounded-full w-4 h-4 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setFilterTeacher(""); setFilterRoom(""); setFilterClass(""); setFilterTerm(""); }}
              className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {activeTab === "grid" && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="grid grid-cols-4 gap-3">
              <FilterDropdown value={filterTeacher} onChange={setFilterTeacher} options={teacherOptions} placeholder="All Teachers" />
              <FilterDropdown value={filterRoom} onChange={setFilterRoom} options={roomOptions} placeholder="All Rooms" />
              <FilterDropdown value={filterClass} onChange={setFilterClass} options={classOptions} placeholder="All Classes" />
              <FilterDropdown value={filterTerm} onChange={setFilterTerm} options={termOptions} placeholder="All Terms" />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "grid" && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TimetableGrid
              slots={filtered}
              role={role}
              onAddSlot={handleAddSlot}
              onEditSlot={() => {}}
              onDeleteSlot={handleDeleteSlot}
            />
            <p className="text-xs text-gray-600 mt-3 text-center">
              {role !== "student" ? "Click any empty cell to add a slot. Hover a slot to edit or delete." : "Your weekly timetable."}
            </p>
          </motion.div>
        )}

        {activeTab === "rooms" && (
          <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FreeRoomsView />
          </motion.div>
        )}

        {activeTab === "teachers" && (
          <motion.div key="teachers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TeacherAvailabilityView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Slot Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Timetable Slot">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Class / Subject</label>
            <select
              value={addForm.class_id}
              onChange={(e) => setAddForm((f) => ({ ...f, class_id: e.target.value }))}
              className="input-glass"
            >
              <option value="">Select class…</option>
              {mockClasses.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0f]">
                  {c.subject_name} — {c.teacher_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Classroom</label>
            <select
              value={addForm.classroom_id}
              onChange={(e) => setAddForm((f) => ({ ...f, classroom_id: e.target.value }))}
              className="input-glass"
            >
              <option value="">Select room…</option>
              {mockClassrooms.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#0a0a0f]">
                  {r.room_number} — {r.building} (Cap {r.capacity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Day</label>
            <select
              value={addForm.day}
              onChange={(e) => setAddForm((f) => ({ ...f, day: e.target.value }))}
              className="input-glass"
            >
              {DAYS.map((d) => (
                <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Start Time</label>
              <input
                type="time"
                value={addForm.start_time}
                onChange={(e) => setAddForm((f) => ({ ...f, start_time: e.target.value }))}
                className="input-glass"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">End Time</label>
              <input
                type="time"
                value={addForm.end_time}
                onChange={(e) => setAddForm((f) => ({ ...f, end_time: e.target.value }))}
                className="input-glass"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
            <Clock size={13} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300/80">
              Conflict detection will run automatically when connected to the backend.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSaveSlot} loading={saving} className="flex-1">Save Slot</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
