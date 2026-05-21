import { NextRequest, NextResponse } from "next/server";
import { db, appointments, tenants } from "@/lib/db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ todayCount: 0 });

  try {
    const [tenant] = await db.select({ id: tenants.id })
      .from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) return NextResponse.json({ todayCount: 0 });

    const now   = new Date();
    const start = startOfDay(now);
    const end   = endOfDay(now);

    const rows = await db.select({ id: appointments.id })
      .from(appointments)
      .where(and(
        eq(appointments.tenantId, tenant.id),
        gte(appointments.createdAt, start),
        lte(appointments.createdAt, end),
        ne(appointments.status, "cancelled"),
      ));

    return NextResponse.json({ todayCount: rows.length });
  } catch {
    return NextResponse.json({ todayCount: 0 });
  }
}
