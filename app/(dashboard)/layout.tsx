import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db, tenants, tenantMembers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!session) redirect("/login");

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);

  if (!member) redirect("/onboarding");

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, member.tenantId))
    .limit(1);

  if (!tenant || !tenant.onboardingCompleted) redirect("/onboarding");

  return (
    <div className="flex h-dvh overflow-hidden bg-[#F8F9FC]">
      <Sidebar tenant={tenant} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
