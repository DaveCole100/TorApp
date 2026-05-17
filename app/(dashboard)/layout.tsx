import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get tenant
  const { data: member } = await supabase
    .from("tenant_members")
    .select("tenant_id, role, tenants(*)")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/onboarding");
  const tenant = member.tenants as any;
  if (!tenant?.onboarding_completed) redirect("/onboarding");

  return (
    <div className="flex h-dvh overflow-hidden bg-[#F8F9FC]">
      <Sidebar tenant={tenant} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
