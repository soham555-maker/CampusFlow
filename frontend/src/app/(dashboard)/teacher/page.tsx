"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Users, Clock, Bell, FileText, Plus, BookOpen } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { useToast } from "@/store/toastStore";
import {
  mockClasses,
  mockTodaySlots,
  mockStudents,
  mockTimetableSlots,
  type TimetableSlot as MockSlot,
} from "@/lib/mockData";

const TEACHER_ID = "tch-001";
const TEACHER_NAME = "Dr. Anita Desai";

function toGridSlot(s: MockSlot) {
  return {
    id: s.id,
    day: s.day,
    start_time: s.start_time,
    end_time: s.end_time,
    label: s.subject_name,
    sublabel: s.room_number,
  };
}

function formatAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

export default function TeacherDashboard() {
  const toast = useToast();
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annClass, setAnnClass] = useState("");
  const [saving, setSaving] = useState(false);

  const myClasses = mockClasses.filter((c) => c.teacher_id === TEACHER_ID);
  const mySlots = mockTimetableSlots.filter((s) => s.teacher_id === TEACHER_ID);
  const todaySlots = mockTodaySlots.filter((s) => s.teacher_id === TEACHER_ID);
  const gridSlots = mySlots.map(toGridSlot);
  const totalStudents = myClasses.reduce((a, c) => a + c.student_count, 0);

  function handlePostAnnouncement() {
    if (!annTitle || !annClass) {
      toast.error("Missing fields");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setAnnouncementOpen(false);
      setAnnTitle("");
      setAnnBody("");
      setAnnClass("");
      setSaving(false);
      toast.success("Announcement posted", "Students will be notified.");
    }, 600);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Dashboard — {TEACHER_NAME}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your classes and schedule.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setAnnouncementOpen(true)}>
            <span className="flex items-center gap-2"><Bell size={14} /> Post Announcement</span>
          </Button>
          <Button size="sm" onClick={() => setAssignmentOpen(true)}>
            <span className="flex items-center gap-2"><Plus size={14} /> Create Assignment</span>
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="My Classes" value={myClasses.length} icon={BookOpen} color="purple" delay={0.05} />
        <StatCard label="Total Students" value={totalStudents} icon={Users} color="cyan" delay={0.1} />
        <StatCard label="Classes Today" value={todaySlots.length} icon={CalendarDays} color="blue" delay={0.15} />
        <StatCard
          label="Next Class"
          value={todaySlots[0]?.start_time.slice(0, 5) ?? "Free"}
          icon={Clock}
          color="emerald"
          delay={0.2}
        />
      </div>

      {/* My Classes + Today's Schedule */}
      <div className="grid grid-cols-2 gap-6">
        {/* My Classes */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={15} className="text-gray-400" />
            <h2 className="text-base font-medium text-white">My Classes</h2>
          </div>
          <div className="space-y-2">
            {myClasses.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="glass-panel rounded-xl px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-white">{cls.subject_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Sem {cls.semester} · Division {cls.division}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={11} /> {cls.student_count}
                  </span>
                  <Badge variant="purple">Sem {cls.semester}</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={15} className="text-gray-400" />
            <h2 className="text-base font-medium text-white">Today&apos;s Schedule</h2>
          </div>
          {todaySlots.length === 0 ? (
            <GlassCard className="py-10 text-center">
              <p className="text-gray-400 text-sm">No classes today. Enjoy your free day!</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {todaySlots.map((slot, i) => (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="glass-panel rounded-xl px-5 py-3.5 flex items-center gap-4"
                >
                  <div className="w-1 h-10 rounded-full bg-gradient-to-b from-cyan-500 to-purple-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{slot.subject_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{slot.room_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{slot.start_time.slice(0, 5)}</p>
                    <p className="text-xs text-gray-500">– {slot.end_time.slice(0, 5)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Weekly Timetable */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h2 className="text-base font-medium text-white mb-4">My Weekly Schedule</h2>
        <TimetableGrid slots={gridSlots} />
      </motion.div>

      {/* Post Announcement Modal */}
      <Modal open={announcementOpen} onClose={() => setAnnouncementOpen(false)} title="Post Announcement">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Class</label>
            <select
              value={annClass}
              onChange={(e) => setAnnClass(e.target.value)}
              className="input-glass"
            >
              <option value="">Select class…</option>
              {myClasses.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0f]">
                  {c.subject_name} — Sem {c.semester}{c.division}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Title</label>
            <input
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              className="input-glass"
              placeholder="Announcement title…"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Message</label>
            <textarea
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              rows={4}
              className="input-glass resize-none"
              placeholder="Type your announcement here…"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setAnnouncementOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handlePostAnnouncement} loading={saving} className="flex-1">Post</Button>
          </div>
        </div>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal open={assignmentOpen} onClose={() => setAssignmentOpen(false)} title="Create Assignment">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Class</label>
            <select className="input-glass">
              <option value="">Select class…</option>
              {myClasses.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0f]">
                  {c.subject_name} — Sem {c.semester}{c.division}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Title</label>
            <input className="input-glass" placeholder="Assignment title…" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <textarea rows={3} className="input-glass resize-none" placeholder="Describe the assignment…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Due Date</label>
              <input type="datetime-local" className="input-glass" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Marks</label>
              <input type="number" min={1} className="input-glass" placeholder="25" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setAssignmentOpen(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => {
                setAssignmentOpen(false);
                toast.success("Assignment created");
              }}
              className="flex-1"
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
