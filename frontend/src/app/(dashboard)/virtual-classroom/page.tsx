import GlassCard from "@/components/ui/GlassCard";
import { Monitor, Construction } from "lucide-react";

export default function VirtualClassroomPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Virtual Classroom</h1>
        <p className="text-gray-400 text-sm mt-1">Assignments, announcements, and grading</p>
      </div>
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Monitor size={24} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-medium flex items-center gap-2 justify-center">
            <Construction size={14} className="text-yellow-400" /> Coming Soon
          </h3>
          <p className="text-gray-400 text-sm mt-1 max-w-xs">
            Virtual classroom with assignments, announcements, and grading is under development.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
