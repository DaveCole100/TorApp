import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db, appointments, services, staff, tenants, tenantMembers } from "@/lib/db";
import { eq, and, gte, lte, ne, gt, asc } from "drizzle-orm";
import { format, startOfDay, endOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, Clock, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatAppointmentDate, STATUS_LABELS } from "@/lib/utils/format";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await requireSession();
  if (!session) redirect("/login");

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);
  if (!member) redirect("/onboarding");

  const [tenant] = await db
    .select({ name: tenants.name, primaryColor: tenants.primaryColor })
    .from(tenants)
    .where(eq(tenants.id, member.tenantId))
    .limit(1);

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd   = endOfDay(today);

  const [todayAppts, upcomingAppts] = await Promise.all([
    db.select({
      id:            appointments.id,
      customerName:  appointments.customerName,
      startAt:       appointments.startAt,
      endAt:         appointments.endAt,
      status:        appointments.status,
      price:         appointments.price,
      serviceName:   services.name,
      staffName:     staff.name,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(and(
      eq(appointments.tenantId, member.tenantId),
      gte(appointments.startAt, todayStart),
      lte(appointments.startAt, todayEnd),
      ne(appointments.status, "cancelled"),
    ))
    .orderBy(asc(appointments.startAt)),

    db.select({
      id:           appointments.id,
      customerName: appointments.customerName,
      startAt:      appointments.startAt,
      price:        appointments.price,
    })
    .from(appointments)
    .where(and(
      eq(appointments.tenantId, member.tenantId),
      gt(appointments.startAt, todayEnd),
      ne(appointments.status, "cancelled"),
    ))
    .orderBy(asc(appointments.startAt))
    .limit(5),
  ]);

  const todayRevenue = todayAppts
    .filter(a => a.status === "completed" || a.status === "confirmed")
    .reduce((sum, a) => sum + parseFloat(a.price ?? "0"), 0);
  const todayCount    = todayAppts.length;
  const todayFormatted = format(today, "EEEE, d MMMM", { locale: he });

  const STATS = [
    { label: "תורים היום",   value: todayCount,                icon: Calendar,    color: "bg-brand-50 text-brand-600"   },
    { label: "הכנסה היום",   value: formatPrice(todayRevenue), icon: TrendingUp,  color: "bg-green-50 text-green-600"   },
    { label: "פנויים היום",  value: Math.max(0, 8 - todayCount), icon: Clock,     color: "bg-violet-50 text-violet-600" },
    { label: "לקוחות חדשים", value: "-",                       icon: Users,       color: "bg-amber-50 text-amber-600"   },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in">

      <div className="mb-7">
        <p className="text-sm text-gray-400 capitalize">{todayFormatted}</p>
        <h1 className="text-2xl font-black text-gray-900 mt-0.5">
          שלום, {tenant?.name ?? "עסק"} 👋
        </h1>
      </div>

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
              {todayAppts.map(appt => (
                <div key={appt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="text-center w-12 shrink-0">
                    <p className="font-bold text-sm text-gray-900">{format(appt.startAt, "HH:mm")}</p>
                    <p className="text-[10px] text-gray-400">{format(appt.endAt, "HH:mm")}</p>
                  </div>
                  <div className="w-0.5 h-8 rounded-full shrink-0"
                    style={{ background: tenant?.primaryColor ?? "#0284C7" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{appt.customerName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {appt.serviceName}{appt.staffName ? ` · ${appt.staffName}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {appt.price && <span className="text-sm font-bold text-gray-700">{formatPrice(parseFloat(appt.price))}</span>}
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
              {upcomingAppts.map(appt => (
                <div key={appt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{appt.customerName}</p>
                    <p className="text-xs text-gray-400">{formatAppointmentDate(appt.startAt)}</p>
                  </div>
                  {appt.price && (
                    <span className="text-sm font-bold text-gray-700 shrink-0">{formatPrice(parseFloat(appt.price))}</span>
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
