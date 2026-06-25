import GlassCard from "@/components/ui/GlassCard";
import { ScanLine, Construction } from "lucide-react";

export default function OcrPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">OCR Engine</h1>
        <p className="text-gray-400 text-sm mt-1">Upload timetable images or PDFs to auto-create DB records</p>
      </div>
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <ScanLine size={24} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-medium flex items-center gap-2 justify-center">
            <Construction size={14} className="text-yellow-400" /> Coming Soon
          </h3>
          <p className="text-gray-400 text-sm mt-1 max-w-xs">
            OCR-based timetable ingestion from images and PDFs is under development.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
