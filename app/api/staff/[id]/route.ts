import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db, staff, tenantMembers } from "@/lib/db";
import { eq, and } from "drizzle-orm";

async function getTenantId(userId: string) {
  const [m] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, userId))
    .limit(1);
  return m?.tenantId ?? null;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(session.userId);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  const body = await req.json();
  const update: Record<string, any> = {};
  if (body.name          !== undefined) update.name          = body.name;
  if (body.role          !== undefined) update.role          = body.role || null;
  if (body.bio           !== undefined) update.bio           = body.bio || null;
  if (body.email         !== undefined) update.email         = body.email || null;
  if (body.phone         !== undefined) update.phone         = body.phone || null;
  if (body.calendarColor !== undefined) update.calendarColor = body.calendarColor;
  if (body.isActive      !== undefined) update.isActive      = body.isActive;

  await db.update(staff).set(update).where(and(eq(staff.id, params.id), eq(staff.tenantId, tenantId)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(session.userId);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  await db.delete(staff).where(and(eq(staff.id, params.id), eq(staff.tenantId, tenantId)));
  return NextResponse.json({ ok: true });
}
