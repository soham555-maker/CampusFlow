import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/layout/DashboardLayout";

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === "true";

export default async function Layout({ children }: { children: React.ReactNode }) {
  if (DEV_BYPASS) {
    return <DashboardLayout role="admin">{children}</DashboardLayout>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: roleData } = await supabase.rpc("auth_role");

  const role = (roleData ?? "student") as "admin" | "teacher" | "student";

  return <DashboardLayout role={role}>{children}</DashboardLayout>;
}
