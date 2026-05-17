import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db, customers, tenantMembers } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Users, Phone, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatRelative } from "@/lib/utils/format";

export default async function CustomersPage() {
  const session = await requireSession();
  if (!session) redirect("/login");

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);
  if (!member) redirect("/onboarding");

  const list = await db
    .select()
    .from(customers)
    .where(eq(customers.tenantId, member.tenantId))
    .orderBy(desc(customers.lastVisitAt));

  function Initials({ name }: { name: string }) {
    const i = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    return (
      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">{i}</div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">לקוחות</h1>
        <p className="text-sm text-gray-400 mt-0.5">{list.length} לקוחות</p>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-4">
            <Users size={24} className="text-gray-300" />
          </div>
          <h3 className="font-bold text-gray-600 mb-1">אין לקוחות עדיין</h3>
          <p className="text-sm text-gray-400">לקוחות יתווספו אוטומטית עם כל תור חדש</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map(c => (
            <Card key={c.id} padding="md" hover>
              <div className="flex items-center gap-4">
                <Initials name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{c.name}</span>
                    {c.noShowCount > 0 && (
                      <Badge variant="danger" size="sm">{c.noShowCount} no-show</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
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
                  <p className="font-black text-base text-brand-600">{formatPrice(parseFloat(c.totalSpent))}</p>
                  <p className="text-xs text-gray-400">{c.visitCount} ביקורים</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
