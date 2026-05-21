import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db, appointments, services, staff, tenantMembers, tenants } from "@/lib/db";
import { eq, and, gte, lte, asc } from "drizzle-orm";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { he } from "date-fns/locale";
import { formatPrice, STATUS_LABELS } from "@/lib/utils/format";
import { Calendar, ChevronRight, ChevronLeft, Phone } from "lucide-react";

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  confirmed: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  completed: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
  cancelled:  { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  no_show:    { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { week?: string; status?: string };
}) {
  const session = await requireSession();
  if (!session) redirect("/login");

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);
  if (!member) redirect("/onboarding");

  const [tenant] = await db
    .select({ primaryColor: tenants.primaryColor })
    .from(tenants)
    .where(eq(tenants.id, member.tenantId))
    .limit(1);

  const p = tenant?.primaryColor ?? "#0284C7";

  const weekOffset = parseInt(searchParams.week ?? "0");
  const weekStart  = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 });
  const weekEnd    = endOfWeek(weekStart, { weekStartsOn: 0 });

  const conditions = [
    eq(appointments.tenantId, member.tenantId),
    gte(appointments.startAt, weekStart),
    lte(appointments.startAt, weekEnd),
  ];
  if (searchParams.status) conditions.push(eq(appointments.status, searchParams.status));

  const rows = await db
    .select({
      id:            appointments.id,
      customerName:  appointments.customerName,
      customerPhone: appointments.customerPhone,
      startAt:       appointments.startAt,
      endAt:         appointments.endAt,
      status:        appointments.status,
      price:         appointments.price,
      serviceName:   services.name,
      staffName:     staff.name,
      staffColor:    staff.calendarColor,
    })
    .from(appointments)
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(and(...conditions))
    .orderBy(asc(appointments.startAt));

  const grouped = rows.reduce<Record<string, typeof rows>>((acc, a) => {
    const day = format(a.startAt, "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(a);
    return acc;
  }, {});

  const statusFilters = [
    { value: "",          label: "הכל" },
    { value: "confirmed", label: "מאושר" },
    { value: "completed", label: "הושלם" },
    { value: "cancelled", label: "בוטל" },
    { value: "no_show",   label: "לא הגיע" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-black text-gray-900">תורים</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {format(weekStart, "d MMM", { locale: he })} – {format(weekEnd, "d MMM yyyy", { locale: he })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={`?week=${weekOffset - 1}${searchParams.status ? `&status=${searchParams.status}` : ""}`}
                className="w-10 h-10 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-200 transition-all">
                <ChevronRight size={17} />
              </a>
              <a href={`?week=0${searchParams.status ? `&status=${searchParams.status}` : ""}`}
                className="h-10 px-4 rounded-2xl border-2 border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-200 flex items-center transition-all">
                היום
              </a>
              <a href={`?week=${weekOffset + 1}${searchParams.status ? `&status=${searchParams.status}` : ""}`}
                className="w-10 h-10 rounded-2xl border-2 border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-200 transition-all">
                <ChevronLeft size={17} />
              </a>
            </div>
          </div>

          {/* Status filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {statusFilters.map(f => {
              const active = searchParams.status === f.value || (!searchParams.status && !f.value);
              return (
                <a key={f.value}
                  href={`?week=${weekOffset}&status=${f.value}`}
                  className="px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border-2 transition-all"
                  style={active
                    ? { background: p, color: "#fff", borderColor: p }
                    : { background: "#fff", color: "#6B7280", borderColor: "#F3F4F6" }}>
                  {f.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-10">
        <div className="max-w-4xl mx-auto">
          {Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: p + "12" }}>
                <Calendar size={32} style={{ color: p }} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">אין תורים בשבוע זה</h3>
              <p className="text-sm text-gray-400">תורים חדשים יופיעו כאן</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {Object.entries(grouped).map(([day, appts]) => (
                <div key={day}>
                  <p className="text-sm font-black text-gray-500 mb-3 capitalize">
                    {format(new Date(day + "T12:00:00"), "EEEE, d MMMM", { locale: he })}
                    <span className="mr-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{appts.length} תורים</span>
                  </p>
                  <div className="flex flex-col gap-2">
                    {appts.map(a => {
                      const st = STATUS_STYLE[a.status] ?? STATUS_STYLE.confirmed;
                      return (
                        <div key={a.id}
                          className="bg-white rounded-3xl border border-gray-100 p-4 flex items-center gap-4 transition-all hover:shadow-md"
                          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

                          {/* Staff color bar */}
                          <div className="w-1 self-stretch rounded-full shrink-0"
                            style={{ background: a.staffColor ?? p }} />

                          {/* Time */}
                          <div className="text-center w-14 shrink-0">
                            <p className="font-black text-sm text-gray-900">{format(a.startAt, "HH:mm")}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{format(a.endAt, "HH:mm")}</p>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm text-gray-900">{a.customerName}</p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {a.serviceName ?? ""}
                              {a.staffName ? ` · ${a.staffName}` : ""}
                            </p>
                            {a.customerPhone && (
                              <span className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                <Phone size={9} />{a.customerPhone}
                              </span>
                            )}
                          </div>

                          {/* Price + status */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {a.price && (
                              <span className="text-base font-black" style={{ color: p }}>
                                {formatPrice(parseFloat(a.price))}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                              style={{ background: st.bg, color: st.text, borderColor: st.border }}>
                              {STATUS_LABELS[a.status]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
