import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfDay, endOfDay, isToday } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, Clock, Users, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, Skeleton } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatAppointmentDate, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils/format";
import Link from "next/link";

async function getDashboardData(tenantId: string) {
  const supabase = createClient();
  const today = new Date();
  const todayStart = startOfDay(today).toISOString();
  const todayEnd   = endOfDay(today).toISOString();

  const [todayAppts, upcomingAppts, allAppts] = await Promise.all([
    supabase.from("appointments")
      .select("*, services(name, price), staff(name)")
      .eq("tenant_id", tenantId)
      .gte("start_at", todayStart)
      .lte("start_at", todayEnd)
      .not("status", "eq", "cancelled")
      .order("start_at"),
    supabase.from("appointments")
      .select("*, services(name, price), staff(name)")
      .eq("tenant_id", tenantId)
      .gt("start_at", todayEnd)
      .not("status", "eq", "cancelled")
      .order("start_at")
      .limit(5),
    supabase.from("appointments")
      .select("price, status")
      .eq("tenant_id", tenantId)
      .gte("start_at", todayStart)
      .lte("start_at", todayEnd),
  ]);

  const todayRevenue = (allAppts.data ?? [])
    .filter(a => a.status === "completed" || a.status === "confirmed")
    .reduce((sum, a) => sum + (a.price ?? 0), 0);

  return {
    todayAppts:    todayAppts.data ?? [],
    upcomingAppts: upcomingAppts.data ?? [],
    todayRevenue,
    todayCount:    todayAppts.data?.length ?? 0,
  };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("tenant_members")
    .select("tenant_id, tenants(name, primary_color)")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/onboarding");

  const { todayAppts, upcomingAppts, todayRevenue, todayCount } = await getDashboardData(member.tenant_id);
  const tenant = member.tenants as any;
  const todayFormatted = format(new Date(), "EEEE, d MMMM", { locale: he });

  const STATS = [
    { label: "תורים היום",   value: todayCount,              icon: Calendar,    color: "bg-brand-50 text-brand-600"   },
    { label: "הכנסה היום",   value: formatPrice(todayRevenue), icon: TrendingUp, color: "bg-green-50 text-green-600"   },
    { label: "פנויים היום",  value: Math.max(0, 8 - todayCount), icon: Clock,   color: "bg-violet-50 text-violet-600" },
    { label: "לקוחות חדשים", value: "-",                     icon: Users,       color: "bg-amber-50 text-amber-600"   },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in">

      {/* Header */}
      <div className="mb-7">
        <p className="text-sm text-gray-400 capitalize">{todayFormatted}</p>
        <h1 className="text-2xl font-black text-gray-900 mt-0.5">
          שלום, {(tenant as any)?.name ?? "עסק"} 👋
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => (
          <Card key={s.label} padding="md">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">

        {/* Today's appointments */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div>
              <CardTitle>תורים היום</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">{todayCount} תורים מתוכננים</p>
            </div>
            <Link href="/appointments" className="text-xs text-brand-600 font-semibold hover:underline">
              כל התורים
            </Link>
          </div>

          {todayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Calendar size={20} className="text-gray-300" />
              </div>
              <p className="font-semibold text-gray-600">אין תורים היום</p>
              <p className="text-sm text-gray-400 mt-1">תורים חדשים יופיעו כאן</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayAppts.map((appt: any) => (
                <div key={appt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="text-center w-12 shrink-0">
                    <p className="font-bold text-sm text-gray-900">{format(new Date(appt.start_at), "HH:mm")}</p>
                    <p className="text-[10px] text-gray-400">{format(new Date(appt.end_at), "HH:mm")}</p>
                  </div>
                  <div
                    className="w-0.5 h-8 rounded-full shrink-0"
                    style={{ background: tenant?.primary_color ?? "#4F46E5" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{appt.customer_name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {appt.services?.name} {appt.staff?.name ? `· ${appt.staff.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {appt.price && <span className="text-sm font-bold text-gray-700">{formatPrice(appt.price)}</span>}
                    <Badge variant={
                      appt.status === "confirmed" ? "info" :
                      appt.status === "completed" ? "success" :
                      appt.status === "cancelled" ? "danger" : "warning"
                    } size="sm">
                      {STATUS_LABELS[appt.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <CardTitle>קרובים</CardTitle>
          </div>
          {upcomingAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <CheckCircle2 size={24} className="text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">אין תורים קרובים</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingAppts.map((appt: any) => (
                <div key={appt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{appt.customer_name}</p>
                    <p className="text-xs text-gray-400">{formatAppointmentDate(appt.start_at)}</p>
                  </div>
                  {appt.price && (
                    <span className="text-sm font-bold text-gray-700 shrink-0">{formatPrice(appt.price)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
