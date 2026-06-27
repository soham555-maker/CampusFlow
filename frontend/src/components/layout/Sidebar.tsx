"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  CalendarDays,
  ScanLine,
  Map,
  LogOut,
  Layers,
  Library,
  CalendarRange,
  School,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Role = "admin" | "teacher" | "student";

const navItems: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
    { href: "/admin/classes", label: "Classes", icon: BookOpen },
    { href: "/admin/classrooms", label: "Classrooms", icon: Building2 },
    { href: "/admin/subjects", label: "Subjects", icon: Library },
    { href: "/admin/terms", label: "Terms", icon: CalendarRange },
    { href: "/timetable", label: "Timetable", icon: CalendarDays },
    { href: "/ocr", label: "OCR Engine", icon: ScanLine },
    { href: "/map", label: "Campus Map", icon: Map },
  ],
  teacher: [
    { href: "/teacher", label: "Dashboard", icon: Layers },
    { href: "/timetable", label: "Timetable", icon: CalendarDays },
    { href: "/class", label: "My Classes", icon: School },
  ],
  student: [
    { href: "/student", label: "Dashboard", icon: Layers },
    { href: "/timetable", label: "Timetable", icon: CalendarDays },
    { href: "/class", label: "My Classes", icon: School },
  ],
};

interface SidebarProps {
  role: Role;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const items = navItems[role] ?? navItems.student;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 glass-panel border-r border-white/5 flex flex-col">
      <div className="px-6 py-5 border-b border-white/5">
        <span className="text-lg font-semibold accent-gradient-text tracking-tight">
          CampusFlow
        </span>
        <p className="text-xs text-gray-400 mt-0.5 capitalize">{role}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/timetable" && pathname.startsWith(href + "/")) ||
            (href === "/class" && pathname.startsWith("/class"));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-white/[0.06] text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
              )}
            >
              <Icon
                size={16}
                className={active ? "text-purple-400" : "text-current"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/[0.03] transition-all w-full cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
