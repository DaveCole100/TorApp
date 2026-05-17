import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db, tenants, tenantMembers } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);
  if (!member) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, member.tenantId))
    .limit(1);

  return NextResponse.json({ tenant });
}

export async function PATCH(req: Request) {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);
  if (!member) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const allowed = ["name","phone","whatsapp","email","instagram","address","description","primaryColor","bookingAdvanceDays","cancellationHours"];
  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  await db.update(tenants).set(update).where(eq(tenants.id, member.tenantId));
  return NextResponse.json({ ok: true });
}
