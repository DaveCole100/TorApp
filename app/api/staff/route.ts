import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db, staff, tenantMembers } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);
  if (!member) return NextResponse.json({ staff: [] });

  const list = await db
    .select()
    .from(staff)
    .where(eq(staff.tenantId, member.tenantId))
    .orderBy(asc(staff.sortOrder));

  return NextResponse.json({ staff: list });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);
  if (!member) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  const body = await req.json();
  const [created] = await db
    .insert(staff)
    .values({
      tenantId:      member.tenantId,
      name:          body.name,
      role:          body.role || null,
      bio:           body.bio || null,
      email:         body.email || null,
      phone:         body.phone || null,
      calendarColor: body.calendarColor ?? "#4F46E5",
      isActive:      true,
      acceptsBookings: true,
    })
    .returning();

  return NextResponse.json({ staff: created });
}
