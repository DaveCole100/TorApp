import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice, STATUS_LABELS } from "@/lib/utils/format";
import { Calendar, Filter } from "lucide-react";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { week?: string; status?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
  if (!member) redirect("/onboarding");

  const weekOffset = parseInt(searchParams.week ?? "0");
  const baseDate   = new Date();
  const weekStart  = startOfWeek(addWeeks(baseDate, weekOffset), { weekStartsOn: 0 });
  const weekEnd    = endOfWeek(weekStart, { weekStartsOn: 0 });

  let query = supabase
    .from("appointments")
    .select("*, services(name, duration_minutes), staff(name, calendar_color)")
    .eq("tenant_id", member.tenant_id)
    .gte("start_at", weekStart.toISOString())
    .lte("start_at", weekEnd.toISOString())
    .order("start_at");

  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: appointments } = await query;

  const grouped = (appointments ?? []).reduce<Record<string, any[]>>((acc, a) => {
    const day = format(new Date(a.start_at), "yyyy-MM-dd");
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
          <a href={`?week=0`}
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center transition-colors">
            היום
          </a>
          <a href={`?week=${weekOffset + 1}`}
            className="h-9 px-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center transition-colors">
            שבוע הבא →
          </a>
        </div>
      </div>

      {/* Status filter */}
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
                {format(new Date(day), "EEEE, d MMMM", { locale: he })}
              </p>
              <div className="flex flex-col gap-2">
                {appts.map((a: any) => (
                  <Card key={a.id} padding="md" className="flex items-center gap-4">
                    <div
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ background: a.staff?.calendar_color ?? "#4F46E5" }}
                    />
                    <div className="text-center w-12 shrink-0">
                      <p className="font-bold text-sm text-gray-900">{format(new Date(a.start_at), "HH:mm")}</p>
                      <p className="text-[10px] text-gray-400">{format(new Date(a.end_at), "HH:mm")}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{a.customer_name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {a.services?.name}
                        {a.staff ? ` · ${a.staff.name}` : ""}
                        {a.customer_phone ? ` · ${a.customer_phone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {a.price && <span className="font-bold text-sm text-gray-700">{formatPrice(a.price)}</span>}
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
