import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db, customers, tenantMembers, tenants } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Users, Phone, Calendar, TrendingUp, Star } from "lucide-react";
import { formatPrice, formatRelative } from "@/lib/utils/format";

function Initials({ name, color = "#0284C7" }: { name: string; color?: string }) {
  const i = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0"
      style={{ background: color }}>
      {i}
    </div>
  );
}

const AVATAR_COLORS = ["#4F46E5","#7C3AED","#DB2777","#0284C7","#16A34A","#EA580C","#374151"];

export default async function CustomersPage() {
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

  const list = await db
    .select()
    .from(customers)
    .where(eq(customers.tenantId, member.tenantId))
    .orderBy(desc(customers.totalSpent));

  const totalRevenue = list.reduce((sum, c) => sum + parseFloat(c.totalSpent ?? "0"), 0);
  const totalVisits  = list.reduce((sum, c) => sum + (c.visitCount ?? 0), 0);
  const vipCount     = list.filter(c => (c.visitCount ?? 0) >= 5).length;

  return (
    <div className="flex-1 overflow-y-auto">

      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-gray-900">לקוחות</h1>
          <p className="text-sm text-gray-400 mt-0.5">{list.length} לקוחות במערכת</p>

          {/* Stats row */}
          {list.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: p + "15" }}>
                  <Users size={16} style={{ color: p }} />
                </div>
                <p className="text-2xl font-black text-gray-900">{list.length}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">לקוחות</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-emerald-50">
                  <TrendingUp size={16} className="text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-gray-900">{formatPrice(totalRevenue)}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">סה"כ הכנסות</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-amber-50">
                  <Star size={16} className="text-amber-500" />
                </div>
                <p className="text-2xl font-black text-gray-900">{vipCount}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">לקוחות VIP</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-10">
        <div className="max-w-4xl mx-auto">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: p + "12" }}>
                <Users size={32} style={{ color: p }} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">אין לקוחות עדיין</h3>
              <p className="text-sm text-gray-400 max-w-xs">לקוחות יתווספו אוטומטית בכל פעם שיבוצע תור חדש דרך עמוד ההזמנות</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((c, i) => {
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const isVip = (c.visitCount ?? 0) >= 5;
                return (
                  <div key={c.id}
                    className="bg-white rounded-3xl border border-gray-100 p-5 transition-all hover:shadow-md"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-4">
                      <Initials name={c.name} color={color} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-black text-gray-900">{c.name}</span>
                          {isVip && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                              <Star size={8} fill="currentColor" />VIP
                            </span>
                          )}
                          {(c.noShowCount ?? 0) > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                              {c.noShowCount} החמצות
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone size={10} />{c.phone}
                          </span>
                          {c.lastVisitAt && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar size={10} />ביקור אחרון: {formatRelative(c.lastVisitAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <p className="text-xl font-black" style={{ color: p }}>{formatPrice(parseFloat(c.totalSpent ?? "0"))}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.visitCount ?? 0} ביקורים</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
