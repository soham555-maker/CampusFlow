"use client";

import { useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  FileText,
  BarChart3,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";
import { useToast } from "@/store/toastStore";
import {
  useRole,
  useMyClasses,
  useAnnouncements,
  useAssignments,
  useClassRoster,
  useMarksForAssignments,
  useMyStudentProfile,
  useStudentMarks,
  useAnnouncementMutations,
  useAssignmentMutations,
} from "@/lib/api/hooks";
import type { Announcement, Assignment } from "@/lib/api/types";

const tabConfig = [
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "assignments", label: "Assignments", icon: FileText },
  { id: "grades", label: "Grades", icon: BarChart3 },
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatRelative(dateStr: string | null) {
  if (!dateStr) return "No due date";
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff}d`;
}

function AnnouncementCard({ ann }: { ann: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{ann.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ann.teacher_name} · {formatDate(ann.created_at)}</p>
          </div>
          {expanded ? <ChevronUp size={15} className="text-gray-500 shrink-0 mt-0.5" /> : <ChevronDown size={15} className="text-gray-500 shrink-0 mt-0.5" />}
        </div>
        {!expanded && ann.body && <p className="text-xs text-gray-500 mt-2 truncate">{ann.body}</p>}
      </div>
      <AnimatePresence>
        {expanded && ann.body && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-0 border-t border-white/5">
              <p className="text-sm text-gray-300 leading-relaxed mt-4 whitespace-pre-wrap">{ann.body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AssignmentCard({ asgn }: { asgn: Assignment }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{asgn.title}</p>
          {asgn.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{asgn.description}</p>}
        </div>
        <Badge variant={asgn.status === "Closed" ? "default" : "warning"}>{asgn.status}</Badge>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={11} />
          {formatRelative(asgn.due_date)} · {formatDate(asgn.due_date)}
        </div>
        <div className="h-3 w-px bg-white/10" />
        <span className="text-xs text-gray-400">{asgn.max_marks ?? "—"} marks</span>
      </div>
    </motion.div>
  );
}

export default function ClassHubPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { role } = useRole();
  const isTeacher = role === "teacher" || role === "admin";

  const { data: classes = [], isLoading: clsLoading } = useMyClasses();
  const cls = classes.find((c) => c.id === classId);

  const { data: announcements = [] } = useAnnouncements(classId);
  const { data: assignments = [] } = useAssignments(classId);
  const assignmentIds = useMemo(() => assignments.map((a) => a.id), [assignments]);

  // Grades — teacher sees the full grid; student sees their own marks.
  const { data: roster = [] } = useClassRoster(classId, isTeacher);
  const { data: gridMarks = [] } = useMarksForAssignments(assignmentIds, isTeacher);
  const { data: myProfile } = useMyStudentProfile(!isTeacher);
  const { data: myMarks = [] } = useStudentMarks(isTeacher ? null : myProfile?.id ?? null);
  const myClassMarks = useMemo(
    () => myMarks.filter((m) => assignmentIds.includes(m.assignment_id)),
    [myMarks, assignmentIds]
  );

  const [activeTab, setActiveTab] = useState("announcements");
  const [annOpen, setAnnOpen] = useState(false);
  const [asgOpen, setAsgOpen] = useState(false);
  const [ann, setAnn] = useState({ title: "", body: "" });
  const [asg, setAsg] = useState({ title: "", description: "", due_date: "", max_marks: "" });

  const { create: createAnnouncement } = useAnnouncementMutations(classId);
  const { create: createAssignment } = useAssignmentMutations(classId);

  const studentsWithMarks = useMemo(() => {
    return roster.map((student) => {
      const studentMarks = gridMarks.filter((m) => m.student_id === student.id);
      const total = studentMarks.reduce((a, m) => a + (m.marks_obtained ?? 0), 0);
      const maxTotal = assignments.reduce((a, x) => a + (x.max_marks ?? 0), 0);
      return { student, marks: studentMarks, total, maxTotal };
    });
  }, [roster, gridMarks, assignments]);

  const tabsWithCount = tabConfig.map((t) => ({
    ...t,
    count: t.id === "announcements" ? announcements.length : t.id === "assignments" ? assignments.length : undefined,
  }));

  if (clsLoading) return <div className="max-w-4xl"><CardSkeleton /></div>;

  if (!cls) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-white text-lg font-medium">Class not found</p>
          <Button variant="ghost" className="mt-4" onClick={() => router.push("/class")}>Back to Classes</Button>
        </div>
      </div>
    );
  }

  function postAnn() {
    if (!ann.title) { toast.error("Title required"); return; }
    createAnnouncement.mutate(
      { class_id: classId, title: ann.title, body: ann.body || null },
      { onSuccess: () => { setAnnOpen(false); setAnn({ title: "", body: "" }); } }
    );
  }
  function createAsg() {
    if (!asg.title) { toast.error("Title required"); return; }
    createAssignment.mutate(
      {
        class_id: classId,
        title: asg.title,
        description: asg.description || null,
        due_date: asg.due_date || null,
        max_marks: asg.max_marks ? Number(asg.max_marks) : null,
      },
      { onSuccess: () => { setAsgOpen(false); setAsg({ title: "", description: "", due_date: "", max_marks: "" }); } }
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => router.push("/class")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to Classes
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl px-6 py-5 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border border-white/10"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white tracking-tight">{cls.subject_name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {cls.teacher_name} · Semester {cls.semester} · Division {cls.division}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="purple">Sem {cls.semester}</Badge>
              <Badge variant="default">Div {cls.division}</Badge>
              <span className="text-xs text-gray-500 font-mono">Code: {cls.join_code}</span>
            </div>
          </div>
          {isTeacher && (
            <div className="shrink-0 flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAnnOpen(true)}>
                <span className="flex items-center gap-1.5"><Bell size={13} /> Announce</span>
              </Button>
              <Button size="sm" onClick={() => setAsgOpen(true)}>
                <span className="flex items-center gap-1.5"><Plus size={13} /> Assignment</span>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="glass-panel rounded-xl px-4 py-3 text-center">
            <p className="text-xl font-semibold text-white">{cls.student_count ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Students</p>
          </div>
          <div className="glass-panel rounded-xl px-4 py-3 text-center">
            <p className="text-xl font-semibold text-white">{assignments.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Assignments</p>
          </div>
          <div className="glass-panel rounded-xl px-4 py-3 text-center">
            <p className="text-xl font-semibold text-white">{announcements.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Announcements</p>
          </div>
        </div>
      </motion.div>

      <Tabs tabs={tabsWithCount} activeTab={activeTab} onChange={setActiveTab} />

      <AnimatePresence mode="wait">
        {activeTab === "announcements" && (
          <motion.div key="ann" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {announcements.length === 0 ? (
              <div className="glass-panel rounded-2xl py-14 text-center">
                <Bell size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No announcements yet.</p>
                {isTeacher && <Button size="sm" variant="ghost" className="mt-4" onClick={() => setAnnOpen(true)}>Post First Announcement</Button>}
              </div>
            ) : (
              announcements.map((a) => <AnnouncementCard key={a.id} ann={a} />)
            )}
          </motion.div>
        )}

        {activeTab === "assignments" && (
          <motion.div key="asgn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            {assignments.length === 0 ? (
              <div className="glass-panel rounded-2xl py-14 text-center">
                <FileText size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No assignments yet.</p>
                {isTeacher && <Button size="sm" variant="ghost" className="mt-4" onClick={() => setAsgOpen(true)}>Create First Assignment</Button>}
              </div>
            ) : (
              assignments.map((a) => <AssignmentCard key={a.id} asgn={a} />)
            )}
          </motion.div>
        )}

        {activeTab === "grades" && (
          <motion.div key="grades" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {assignments.length === 0 ? (
              <div className="glass-panel rounded-2xl py-14 text-center">
                <BarChart3 size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No grades available yet.</p>
              </div>
            ) : isTeacher ? (
              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky left-0 bg-[#0a0a0f]">Student</th>
                        {assignments.map((a) => (
                          <th key={a.id} className="px-4 py-3.5 text-center text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                            <div>{a.title.slice(0, 18)}…</div>
                            <div className="text-gray-600 normal-case font-normal">/{a.max_marks ?? "—"}</div>
                          </th>
                        ))}
                        <th className="px-5 py-3.5 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsWithMarks.map(({ student, marks, total, maxTotal }) => (
                        <tr key={student.id} className="border-b border-white/5 last:border-0">
                          <td className="px-5 py-4 sticky left-0 bg-[#0a0a0f]">
                            <p className="text-white text-sm font-medium">{student.full_name}</p>
                            <p className="text-gray-500 text-xs">{student.roll_number ?? "—"}</p>
                          </td>
                          {assignments.map((a) => {
                            const mark = marks.find((m) => m.assignment_id === a.id);
                            const max = a.max_marks ?? 0;
                            const ratio = mark && max ? (mark.marks_obtained ?? 0) / max : 0;
                            return (
                              <td key={a.id} className="px-4 py-4 text-center">
                                {mark ? (
                                  <span className={`text-sm font-medium ${ratio >= 0.8 ? "text-emerald-400" : ratio >= 0.5 ? "text-amber-400" : "text-red-400"}`}>
                                    {mark.marks_obtained}
                                  </span>
                                ) : (
                                  <span className="text-gray-600 text-sm">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-5 py-4 text-center">
                            <div>
                              <span className="text-sm font-semibold text-white">{total}</span>
                              <span className="text-xs text-gray-500">/{maxTotal}</span>
                            </div>
                            {maxTotal > 0 && (
                              <div className="mt-1.5 h-1 w-16 mx-auto rounded-full bg-white/5">
                                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${(total / maxTotal) * 100}%` }} />
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {studentsWithMarks.length === 0 && (
                        <tr><td colSpan={assignments.length + 2} className="px-5 py-8 text-center text-sm text-gray-500">No students enrolled yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Student: own marks
              <div className="space-y-2">
                {myClassMarks.length === 0 ? (
                  <div className="glass-panel rounded-2xl py-14 text-center">
                    <BarChart3 size={28} className="text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No grades yet for this class.</p>
                  </div>
                ) : (
                  myClassMarks.map((m) => {
                    const ratio = m.max_marks ? (m.marks_obtained ?? 0) / m.max_marks : 0;
                    return (
                      <div key={m.id} className="glass-panel rounded-2xl px-5 py-4 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{m.assignment_title}</p>
                          {m.feedback && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{m.feedback}</p>}
                        </div>
                        <span className={`text-sm font-semibold shrink-0 ml-4 ${ratio >= 0.8 ? "text-emerald-400" : ratio >= 0.5 ? "text-amber-400" : "text-red-400"}`}>
                          {m.marks_obtained ?? "—"}<span className="text-gray-500 text-xs">/{m.max_marks ?? "—"}</span>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Announcement Modal */}
      <Modal open={annOpen} onClose={() => setAnnOpen(false)} title="Post Announcement">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Title</label>
            <input value={ann.title} onChange={(e) => setAnn((a) => ({ ...a, title: e.target.value }))} className="input-glass" placeholder="Announcement title…" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Message</label>
            <textarea value={ann.body} onChange={(e) => setAnn((a) => ({ ...a, body: e.target.value }))} rows={5} className="input-glass resize-none" placeholder="Your announcement…" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setAnnOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={postAnn} loading={createAnnouncement.isPending} className="flex-1">Post</Button>
          </div>
        </div>
      </Modal>

      {/* Create Assignment Modal */}
      <Modal open={asgOpen} onClose={() => setAsgOpen(false)} title="Create Assignment">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Title</label>
            <input value={asg.title} onChange={(e) => setAsg((a) => ({ ...a, title: e.target.value }))} className="input-glass" placeholder="Assignment title…" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <textarea value={asg.description} onChange={(e) => setAsg((a) => ({ ...a, description: e.target.value }))} rows={3} className="input-glass resize-none" placeholder="What should students do?…" />
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
            <Button variant="ghost" onClick={() => setAsgOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={createAsg} loading={createAssignment.isPending} className="flex-1">Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
