"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, BookOpen, Clock, Bell, FileText } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import {
  useMyTimetable,
  useMyClasses,
  useAssignments,
  useAnnouncements,
  useMyStudentProfile,
} from "@/lib/api/hooks";
import type { TimetableSlot } from "@/lib/api/types";

function toGridSlot(s: TimetableSlot) {
  return {
    id: s.id,
    day: s.day,
    start_time: s.start_time,
    end_time: s.end_time,
    label: s.subject_name,
    sublabel: s.room_number,
  };
}

function todayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function formatRelativeDate(dateStr: string | null) {
  if (!dateStr) return "No due date";
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff < 0) return "Overdue";
  return `Due in ${diff} days`;
}

function formatAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

export default function StudentDashboard() {
  const { data: profile } = useMyStudentProfile();
  const { data: slots = [], isLoading: slotsLoading } = useMyTimetable();
  const { data: myClasses = [] } = useMyClasses();
  const { data: allAssignments = [] } = useAssignments();
  const { data: allAnnouncements = [] } = useAnnouncements();

  const classIds = useMemo(() => new Set(myClasses.map((c) => c.id)), [myClasses]);

  const todaySlots = useMemo(() => {
    const t = todayName();
    return slots
      .filter((s) => s.day === t)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [slots]);

  const assignments = useMemo(
    () => allAssignments.filter((a) => classIds.has(a.class_id)).slice(0, 4),
    [allAssignments, classIds]
  );
  const announcements = useMemo(
    () =>
      [...allAnnouncements.filter((a) => classIds.has(a.class_id))]
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .slice(0, 4),
    [allAnnouncements, classIds]
  );

  const firstName = (profile?.full_name ?? "there").split(" ")[0];
  const gridSlots = slots.map(toGridSlot);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Good morning, {firstName}
        </h1>
        <p className="text-gray-400 text-sm mt-1">Here&apos;s your academic overview for today.</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Classes Today" value={todaySlots.length} icon={CalendarDays} color="purple" delay={0.05} />
        <StatCard label="Enrolled Subjects" value={myClasses.length} icon={BookOpen} color="cyan" delay={0.1} />
        <StatCard label="Next Class" value={todaySlots[0]?.start_time.slice(0, 5) ?? "—"} icon={Clock} color="blue" delay={0.15} />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h2 className="text-base font-medium text-white mb-3">Today&apos;s Classes</h2>
        <div className="space-y-2">
          {todaySlots.length === 0 ? (
            <GlassCard className="text-center py-8">
              <p className="text-gray-400 text-sm">No classes scheduled for today.</p>
            </GlassCard>
          ) : (
            todaySlots.map((slot, i) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="glass-panel rounded-xl px-5 py-3.5 flex items-center gap-4"
              >
                <div className="w-1 h-10 rounded-full bg-gradient-to-b from-purple-500 to-cyan-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{slot.subject_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{slot.teacher_name} · {slot.room_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{slot.start_time.slice(0, 5)}</p>
                  <p className="text-xs text-gray-500">– {slot.end_time.slice(0, 5)}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} className="text-gray-400" />
            <h2 className="text-base font-medium text-white">Upcoming Assignments</h2>
          </div>
          <div className="space-y-2">
            {assignments.length === 0 ? (
              <GlassCard className="text-center py-6"><p className="text-gray-500 text-sm">No assignments yet.</p></GlassCard>
            ) : (
              assignments.map((a) => (
                <GlassCard key={a.id} className="p-4 hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.subject_name}</p>
                    </div>
                    <Badge variant={a.status === "Closed" ? "default" : "warning"}>{a.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={11} />
                      {formatRelativeDate(a.due_date)}
                    </div>
                    <span className="text-xs text-gray-500">{a.max_marks ?? "—"} marks</span>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={15} className="text-gray-400" />
            <h2 className="text-base font-medium text-white">Recent Announcements</h2>
          </div>
          <div className="space-y-2">
            {announcements.length === 0 ? (
              <GlassCard className="text-center py-6"><p className="text-gray-500 text-sm">No announcements yet.</p></GlassCard>
            ) : (
              announcements.map((a) => (
                <GlassCard key={a.id} className="p-4 hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <p className="text-sm font-medium text-white">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{a.body}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <p className="text-xs text-gray-500">{a.subject_name}</p>
                    <p className="text-xs text-gray-500">{formatAgo(a.created_at)}</p>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h2 className="text-base font-medium text-white mb-4">Weekly Timetable</h2>
        {slotsLoading ? <CardSkeleton /> : <TimetableGrid slots={gridSlots} />}
      </motion.div>
    </div>
  );
}
