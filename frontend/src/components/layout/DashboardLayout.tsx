import Sidebar from "./Sidebar";

type Role = "admin" | "teacher" | "student";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: Role;
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#0a0a0f" }}>
      <Sidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
