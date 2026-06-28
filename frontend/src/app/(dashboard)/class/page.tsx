"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { School, Users, BookOpen, Key, ChevronRight } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import SearchBar from "@/components/ui/SearchBar";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/SkeletonLoader";
import { useMyClasses, useJoinClass } from "@/lib/api/hooks";

const CLASS_COLORS = [
  "from-purple-500/20 to-purple-500/5 border-purple-500/20",
  "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20",
  "from-blue-500/20 to-blue-500/5 border-blue-500/20",
  "from-pink-500/20 to-pink-500/5 border-pink-500/20",
];

export default function ClassesPage() {
  const router = useRouter();
  const { data: classes = [], isLoading } = useMyClasses();
  const join = useJoinClass();
  const [search, setSearch] = useState("");
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const filtered = classes.filter(
    (c) =>
      !search ||
      c.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher_name.toLowerCase().includes(search.toLowerCase())
  );

  function handleJoin() {
    if (!joinCode.trim()) return;
    join.mutate(joinCode.trim(), {
      onSuccess: () => { setJoinOpen(false); setJoinCode(""); },
    });
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
          <h1 className="text-2xl font-semibold text-white tracking-tight">My Classes</h1>
          <p className="text-gray-400 text-sm mt-1">
            Your enrolled classes — access announcements, assignments, and grades.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setJoinOpen(true)}>
          <span className="flex items-center gap-2"><Key size={15} /> Join with Code</span>
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Enrolled Classes" value={classes.length} icon={School} color="purple" delay={0.05} />
        <StatCard label="Total Students" value={classes.reduce((a, c) => a + (c.student_count ?? 0), 0)} icon={Users} color="cyan" delay={0.1} />
        <StatCard label="Subjects" value={new Set(classes.map(c => c.subject_id)).size} icon={BookOpen} color="blue" delay={0.15} />
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} placeholder="Search by subject or teacher…" className="max-w-md" />

      {/* Class Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div>
      ) : (
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((cls, i) => {
          const colorClass = CLASS_COLORS[i % CLASS_COLORS.length];
          return (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => router.push(`/class/${cls.id}`)}
              className={`
                relative glass-panel rounded-2xl p-6 cursor-pointer group
                border hover:border-white/15 transition-all duration-200
                hover:bg-white/[0.04] overflow-hidden
                bg-gradient-to-br ${colorClass}
              `}
            >
              {/* Background glow */}
              <div
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity"
                style={{ background: i % 2 === 0 ? "#8b5cf6" : "#06b6d4" }}
              />

              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl glass-panel border border-white/10 flex items-center justify-center">
                    <BookOpen size={18} className="text-gray-300" />
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                  />
                </div>

                <h3 className="text-base font-semibold text-white mb-1 leading-snug">
                  {cls.subject_name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{cls.teacher_name}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="purple">Sem {cls.semester}</Badge>
                    <Badge variant="default">Div {cls.division}</Badge>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users size={11} />
                    {cls.student_count ?? 0} students
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Code:{" "}
                    <span className="font-mono text-gray-300">{cls.join_code}</span>
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                    Enter class →
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="glass-panel rounded-2xl py-16 text-center">
          <School size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No classes found. Try joining with a code.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => setJoinOpen(true)}>
            Join with Code
          </Button>
        </div>
      )}

      {/* Join Modal */}
      <Modal open={joinOpen} onClose={() => { setJoinOpen(false); setJoinCode(""); }} title="Join Class">
        <div className="space-y-4">
          <div className="glass-panel rounded-xl px-4 py-3 text-sm text-gray-400 text-center">
            Ask your teacher for the class join code
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Join Code</label>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input-glass font-mono text-center text-lg tracking-[0.3em]"
              placeholder="DSA6A01"
              maxLength={8}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" onClick={() => setJoinOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleJoin} loading={join.isPending} disabled={!joinCode.trim()} className="flex-1">
              Join Class
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
