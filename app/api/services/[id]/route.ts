import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db, services, tenantMembers } from "@/lib/db";
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
  if (body.name            !== undefined) update.name            = body.name;
  if (body.description     !== undefined) update.description     = body.description;
  if (body.durationMinutes !== undefined) update.durationMinutes = body.durationMinutes;
  if (body.price           !== undefined) update.price           = String(body.price);
  if (body.bufferMinutes   !== undefined) update.bufferMinutes   = body.bufferMinutes;
  if (body.isPopular       !== undefined) update.isPopular       = body.isPopular;
  if (body.isActive        !== undefined) update.isActive        = body.isActive;

  await db.update(services).set(update).where(and(eq(services.id, params.id), eq(services.tenantId, tenantId)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getTenantId(session.userId);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  await db.delete(services).where(and(eq(services.id, params.id), eq(services.tenantId, tenantId)));
  return NextResponse.json({ ok: true });
}
