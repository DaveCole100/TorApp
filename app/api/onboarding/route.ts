import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db, tenants, tenantMembers, businessHours } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, slug, category, phone, whatsapp, primaryColor, schedule } = await req.json();

  if (!name || !slug || !category) {
    return NextResponse.json({ error: "שדות חסרים" }, { status: 400 });
  }

  try {
    const [tenant] = await db
      .insert(tenants)
      .values({
        name,
        slug,
        category,
        phone:               phone || null,
        whatsapp:            whatsapp || null,
        primaryColor:        primaryColor ?? "#0284C7",
        onboardingCompleted: true,
      })
      .returning();

    await db.insert(tenantMembers).values({
      tenantId: tenant.id,
      userId:   session.userId,
      role:     "owner",
    });

    if (schedule) {
      const hours = Object.entries(schedule as Record<string, { is_open: boolean; open: string; close: string }>).map(
        ([day, h]) => ({
          tenantId:  tenant.id,
          dayOfWeek: parseInt(day),
          isOpen:    h.is_open,
          openTime:  h.open,
          closeTime: h.close,
        })
      );
      await db.insert(businessHours).values(hours);
    }

    return NextResponse.json({ ok: true, tenantId: tenant.id });
  } catch (err: any) {
    if (err.message?.includes("unique")) {
      return NextResponse.json({ error: "שם העסק כבר תפוס, נסה שם אחר" }, { status: 409 });
    }
    console.error("onboarding error", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
