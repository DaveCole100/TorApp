import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db, appointments, services, staff, tenantMembers } from "@/lib/db";
import { eq, and, gte, lte, ne, asc } from "drizzle-orm";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice, STATUS_LABELS } from "@/lib/utils/format";
import { Calendar } from "lucide-react";

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
      id:           appointments.id,
      customerName: appointments.customerName,
      customerPhone:appointments.customerPhone,
      startAt:      appointments.startAt,
      endAt:        appointments.endAt,
      status:       appointments.status,
      price:        appointments.price,
      serviceName:  services.name,
      staffName:    staff.name,
      staffColor:   staff.calendarColor,
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

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">תורים</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {format(weekStart, "d MMM", { locale: he })} – {format(weekEnd, "d MMM yyyy", { locale: he })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`?week=${weekOffset - 1}`}
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center transition-colors">
            ← שבוע קודם
          </a>
          <a href="?week=0"
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center transition-colors">
            היום
          </a>
          <a href={`?week=${weekOffset + 1}`}
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center transition-colors">
            שבוע הבא →
          </a>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {[
          { value: "",          label: "הכל" },
          { value: "confirmed", label: "מאושר" },
          { value: "completed", label: "הושלם" },
          { value: "cancelled", label: "בוטל" },
          { value: "no_show",   label: "לא הגיע" },
        ].map(f => (
          <a key={f.value} href={`?week=${weekOffset}&status=${f.value}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all ${
              searchParams.status === f.value || (!searchParams.status && !f.value)
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}>
            {f.label}
          </a>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
            <Calendar size={24} className="text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-600 mb-1">אין תורים בשבוע זה</h3>
          <p className="text-sm text-gray-400">תורים חדשים יופיעו כאן</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(grouped).map(([day, appts]) => (
            <div key={day}>
              <p className="text-sm font-bold text-gray-500 mb-2 capitalize">
                {format(new Date(day + "T12:00:00"), "EEEE, d MMMM", { locale: he })}
              </p>
              <div className="flex flex-col gap-2">
                {appts.map(a => (
                  <Card key={a.id} padding="md" className="flex items-center gap-4">
                    <div className="w-1 self-stretch rounded-full shrink-0"
                      style={{ background: a.staffColor ?? "#4F46E5" }} />
                    <div className="text-center w-12 shrink-0">
                      <p className="font-bold text-sm text-gray-900">{format(a.startAt, "HH:mm")}</p>
                      <p className="text-[10px] text-gray-400">{format(a.endAt, "HH:mm")}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{a.customerName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {a.serviceName}
                        {a.staffName ? ` · ${a.staffName}` : ""}
                        {a.customerPhone ? ` · ${a.customerPhone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {a.price && <span className="font-bold text-sm text-gray-700">{formatPrice(parseFloat(a.price))}</span>}
                      <Badge variant={
                        a.status === "confirmed" ? "info" :
                        a.status === "completed" ? "success" :
                        a.status === "cancelled" ? "danger" : "warning"
                      } size="sm">{STATUS_LABELS[a.status]}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
