"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Users, Clock, Bell, Plus, BookOpen } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";
import TimetableGrid from "@/components/timetable/TimetableGrid";
import { useToast } from "@/store/toastStore";
import {
  useMyClasses,
  useMyTimetable,
  useAnnouncementMutations,
  useAssignmentMutations,
} from "@/lib/api/hooks";
import type { TimetableSlot } from "@/lib/api/types";

function toGridSlot(s: TimetableSlot) {
  return { id: s.id, day: s.day, start_time: s.start_time, end_time: s.end_time, label: s.subject_name, sublabel: s.room_number };
}
function todayName() {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

export default function TeacherDashboard() {
  const toast = useToast();
  const { data: myClasses = [], isLoading: classesLoading } = useMyClasses();
  const { data: slots = [], isLoading: slotsLoading } = useMyTimetable();
  const { create: createAnnouncement } = useAnnouncementMutations();
  const { create: createAssignment } = useAssignmentMutations();

  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [ann, setAnn] = useState({ class_id: "", title: "", body: "" });
  const [asg, setAsg] = useState({ class_id: "", title: "", description: "", due_date: "", max_marks: "" });

  const teacherName = myClasses[0]?.teacher_name ?? "Teacher";
  const todaySlots = useMemo(
    () => slots.filter((s) => s.day === todayName()).sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [slots]
  );
  const gridSlots = slots.map(toGridSlot);
  const totalStudents = myClasses.reduce((a, c) => a + (c.student_count ?? 0), 0);

  function postAnnouncement() {
    if (!ann.title || !ann.class_id) {
      toast.error("Missing fields", "Pick a class and enter a title.");
      return;
    }
    createAnnouncement.mutate(
      { class_id: ann.class_id, title: ann.title, body: ann.body || null },
      { onSuccess: () => { setAnnouncementOpen(false); setAnn({ class_id: "", title: "", body: "" }); } }
    );
  }

  function createAssignmentSubmit() {
    if (!asg.title || !asg.class_id) {
      toast.error("Missing fields", "Pick a class and enter a title.");
      return;
    }
    createAssignment.mutate(
      {
        class_id: asg.class_id,
        title: asg.title,
        description: asg.description || null,
        due_date: asg.due_date || null,
        max_marks: asg.max_marks ? Number(asg.max_marks) : null,
      },
      { onSuccess: () => { setAssignmentOpen(false); setAsg({ class_id: "", title: "", description: "", due_date: "", max_marks: "" }); } }
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard — {teacherName}</h1>
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

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="My Classes" value={myClasses.length} icon={BookOpen} color="purple" delay={0.05} />
        <StatCard label="Total Students" value={totalStudents} icon={Users} color="cyan" delay={0.1} />
        <StatCard label="Classes Today" value={todaySlots.length} icon={CalendarDays} color="blue" delay={0.15} />
        <StatCard label="Next Class" value={todaySlots[0]?.start_time.slice(0, 5) ?? "Free"} icon={Clock} color="emerald" delay={0.2} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={15} className="text-gray-400" />
            <h2 className="text-base font-medium text-white">My Classes</h2>
          </div>
          <div className="space-y-2">
            {classesLoading ? (
              <CardSkeleton />
            ) : myClasses.length === 0 ? (
              <GlassCard className="py-8 text-center"><p className="text-gray-500 text-sm">No classes assigned yet.</p></GlassCard>
            ) : (
              myClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="glass-panel rounded-xl px-4 py-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{cls.subject_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sem {cls.semester} · Division {cls.division}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={11} /> {cls.student_count ?? 0}</span>
                    <Badge variant="purple">Sem {cls.semester}</Badge>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={15} className="text-gray-400" />
            <h2 className="text-base font-medium text-white">Today&apos;s Schedule</h2>
          </div>
          {todaySlots.length === 0 ? (
            <GlassCard className="py-10 text-center"><p className="text-gray-400 text-sm">No classes today. Enjoy your free day!</p></GlassCard>
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h2 className="text-base font-medium text-white mb-4">My Weekly Schedule</h2>
        {slotsLoading ? <CardSkeleton /> : <TimetableGrid slots={gridSlots} />}
      </motion.div>

      {/* Post Announcement Modal */}
      <Modal open={announcementOpen} onClose={() => setAnnouncementOpen(false)} title="Post Announcement">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Class</label>
            <select value={ann.class_id} onChange={(e) => setAnn((a) => ({ ...a, class_id: e.target.value }))} className="input-glass">
              <option value="">Select class…</option>
              {myClasses.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0f]">{c.subject_name} — Sem {c.semester}{c.division}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Title</label>
            <input value={ann.title} onChange={(e) => setAnn((a) => ({ ...a, title: e.target.value }))} className="input-glass" placeholder="Announcement title…" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Message</label>
            <textarea value={ann.body} onChange={(e) => setAnn((a) => ({ ...a, body: e.target.value }))} rows={4} className="input-glass resize-none" placeholder="Type your announcement here…" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setAnnouncementOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={postAnnouncement} loading={createAnnouncement.isPending} className="flex-1">Post</Button>
          </div>
        </div>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal open={assignmentOpen} onClose={() => setAssignmentOpen(false)} title="Create Assignment">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Class</label>
            <select value={asg.class_id} onChange={(e) => setAsg((a) => ({ ...a, class_id: e.target.value }))} className="input-glass">
              <option value="">Select class…</option>
              {myClasses.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0f]">{c.subject_name} — Sem {c.semester}{c.division}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Title</label>
            <input value={asg.title} onChange={(e) => setAsg((a) => ({ ...a, title: e.target.value }))} className="input-glass" placeholder="Assignment title…" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <textarea value={asg.description} onChange={(e) => setAsg((a) => ({ ...a, description: e.target.value }))} rows={3} className="input-glass resize-none" placeholder="Describe the assignment…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Due Date</label>
              <input type="datetime-local" value={asg.due_date} onChange={(e) => setAsg((a) => ({ ...a, due_date: e.target.value }))} className="input-glass" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Marks</label>
              <input type="number" min={1} value={asg.max_marks} onChange={(e) => setAsg((a) => ({ ...a, max_marks: e.target.value }))} className="input-glass" placeholder="25" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setAssignmentOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={createAssignmentSubmit} loading={createAssignment.isPending} className="flex-1">Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
