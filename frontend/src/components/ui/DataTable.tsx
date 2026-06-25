"use client";

import { cn } from "@/utils/cn";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-5 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-5 py-4">
                      <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-white/5 last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-white/[0.02]"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-5 py-4 text-gray-200">
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[String(col.key)] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
