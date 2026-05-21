import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db, appointments, services, staff, tenants, tenantMembers, businessHours } from "@/lib/db";
import { eq, and, gte, lte, ne, gt, asc, count } from "drizzle-orm";
import { format, startOfDay, endOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, Clock, TrendingUp, CheckCircle2, ChevronLeft, Rocket } from "lucide-react";
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
    .select({ name: tenants.name, primaryColor: tenants.primaryColor, slug: tenants.slug, instagram: tenants.instagram, whatsapp: tenants.whatsapp })
    .from(tenants)
    .where(eq(tenants.id, member.tenantId))
    .limit(1);

  // Onboarding checklist data
  const [[svcCount], [staffCount], [hoursCount]] = await Promise.all([
    db.select({ n: count() }).from(services).where(and(eq(services.tenantId, member.tenantId), eq(services.isActive, true))),
    db.select({ n: count() }).from(staff).where(and(eq(staff.tenantId, member.tenantId), eq(staff.isActive, true))),
    db.select({ n: count() }).from(businessHours).where(eq(businessHours.tenantId, member.tenantId)),
  ]);
  const checklist = [
    { label: "הוסף שירות ראשון",      done: (svcCount?.n ?? 0) > 0,   href: "/services"  },
    { label: "הוסף איש צוות",          done: (staffCount?.n ?? 0) > 0,  href: "/staff"     },
    { label: "הגדר שעות פעילות",       done: (hoursCount?.n ?? 0) > 0,  href: "/settings"  },
    { label: "הגדר ווטסאפ לעסק",       done: !!tenant?.whatsapp,         href: "/settings"  },
    { label: "שתף קישור הזמנות",       done: false,                      href: `/book/${tenant?.slug}` },
  ];
  const doneCount  = checklist.filter(c => c.done).length;
  const allDone    = doneCount === checklist.length;

  const today      = new Date();
  const todayStart = startOfDay(today);
  const todayEnd   = endOfDay(today);

  const [todayAppts, upcomingAppts] = await Promise.all([
    db.select({
      id:           appointments.id,
      customerName: appointments.customerName,
      startAt:      appointments.startAt,
      endAt:        appointments.endAt,
      status:       appointments.status,
      price:        appointments.price,
      serviceName:  services.name,
      staffName:    staff.name,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff,    eq(appointments.staffId,   staff.id))
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
      serviceName:  services.name,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(and(
      eq(appointments.tenantId, member.tenantId),
      gt(appointments.startAt, todayEnd),
      ne(appointments.status, "cancelled"),
    ))
    .orderBy(asc(appointments.startAt))
    .limit(5),
  ]);

  const todayRevenue    = todayAppts
    .filter(a => a.status === "completed" || a.status === "confirmed")
    .reduce((sum, a) => sum + parseFloat(a.price ?? "0"), 0);
  const completedToday  = todayAppts.filter(a => a.status === "completed").length;
  const pendingToday    = todayAppts.filter(a => a.status === "confirmed").length;
  const todayFormatted  = format(today, "EEEE, d MMMM", { locale: he });
  const p = tenant?.primaryColor ?? "#0284C7";

  const STATS = [
    { label: "תורים היום",  value: String(todayAppts.length), icon: Calendar,     color: p,         bg: p + "15" },
    { label: "הכנסה היום",  value: formatPrice(todayRevenue), icon: TrendingUp,   color: "#059669",  bg: "#05966915" },
    { label: "הושלמו",      value: String(completedToday),    icon: CheckCircle2, color: "#059669",  bg: "#05966915" },
    { label: "ממתינים",     value: String(pendingToday),       icon: Clock,        color: "#F59E0B",  bg: "#F59E0B15" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden px-6 pt-8 pb-10"
        style={{ background: `linear-gradient(135deg, ${p} 0%, ${p}CC 100%)` }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }} />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-20"
          style={{ background: "rgba(255,255,255,0.6)", filter: "blur(48px)" }} />

        <div className="relative z-10 max-w-5xl mx-auto">
          <p className="text-white/60 text-sm font-medium mb-1 capitalize">{todayFormatted}</p>
          <h1 className="text-4xl font-black text-white tracking-tight">
            שלום, {tenant?.name ?? "עסק"}
          </h1>
          <p className="text-white/70 mt-1 text-base">
            {todayAppts.length === 0 ? "אין תורים היום" : `${todayAppts.length} תורים מתוכננים היום`}
          </p>

          <div className="mt-5 flex gap-3 flex-wrap">
            <Link href="/appointments"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", color: "white" }}>
              <Calendar size={15} />
              כל התורים
            </Link>
            {tenant?.slug && (
              <Link href={`/book/${tenant.slug}`} target="_blank"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)", color: "white" }}>
                עמוד ההזמנות ↗
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-5 pb-10">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {STATS.map(s => (
            <div key={s.label}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: s.bg }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none tabular-nums">{s.value}</p>
              <p className="text-sm text-gray-400 mt-1.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Onboarding checklist ── */}
        {!allDone && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-7">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket size={16} style={{ color: p }} />
                <h2 className="font-black text-gray-900 text-base">התחל עם TorApp</h2>
              </div>
              <span className="text-xs font-bold text-gray-400">{doneCount}/{checklist.length} הושלמו</span>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div className="h-full transition-all duration-700 rounded-full"
                style={{ width: `${(doneCount / checklist.length) * 100}%`, background: p }} />
            </div>
            <div className="divide-y divide-gray-50">
              {checklist.map((item) => (
                <Link key={item.label} href={item.href}
                  target={item.href.startsWith("/book") ? "_blank" : undefined}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={{ background: item.done ? "#22C55E" : "#F3F4F6", border: item.done ? "none" : "2px solid #E5E7EB" }}>
                    {item.done && <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />}
                  </div>
                  <p className={`flex-1 text-sm font-semibold ${item.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {item.label}
                  </p>
                  {!item.done && <ChevronLeft size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Content grid ── */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">

          {/* Today's appointments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <h2 className="font-black text-gray-900 text-base">תורים היום</h2>
                <p className="text-xs text-gray-400 mt-0.5">{todayAppts.length} תורים</p>
              </div>
              <Link href="/appointments" className="text-xs font-bold hover:underline transition-colors"
                style={{ color: p }}>הכל</Link>
            </div>

            {todayAppts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: p + "12" }}>
                  <Calendar size={24} style={{ color: p }} />
                </div>
                <p className="font-bold text-gray-700 mb-1">אין תורים היום</p>
                <p className="text-sm text-gray-400">תורים חדשים יופיעו כאן</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {todayAppts.map(appt => (
                  <div key={appt.id}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="w-0.5 h-9 rounded-full shrink-0" style={{ background: p }} />
                    <div className="text-center w-12 shrink-0">
                      <p className="font-black text-sm text-gray-900">{format(appt.startAt, "HH:mm")}</p>
                      <p className="text-[10px] text-gray-400">{format(appt.endAt, "HH:mm")}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{appt.customerName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {appt.serviceName}{appt.staffName ? ` · ${appt.staffName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {appt.price && (
                        <span className="text-sm font-black" style={{ color: p }}>
                          {formatPrice(parseFloat(appt.price))}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        appt.status === "confirmed" ? "bg-blue-50 text-blue-700 border-blue-100" :
                        appt.status === "completed" ? "bg-green-50 text-green-700 border-green-100" :
                        "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {STATUS_LABELS[appt.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-black text-gray-900 text-base">קרובים</h2>
            </div>
            {upcomingAppts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <CheckCircle2 size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">אין תורים קרובים</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingAppts.map(appt => (
                  <div key={appt.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: p + "12" }}>
                      <Calendar size={14} style={{ color: p }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{appt.customerName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {appt.serviceName ? `${appt.serviceName} · ` : ""}{formatAppointmentDate(appt.startAt)}
                      </p>
                    </div>
                    {appt.price && (
                      <span className="text-sm font-black shrink-0" style={{ color: p }}>
                        {formatPrice(parseFloat(appt.price))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
