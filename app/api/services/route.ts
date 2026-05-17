import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { db, services, tenantMembers } from "@/lib/db";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const session = await requireSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [member] = await db
    .select({ tenantId: tenantMembers.tenantId })
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, session.userId))
    .limit(1);
  if (!member) return NextResponse.json({ services: [] });

  const list = await db
    .select()
    .from(services)
    .where(eq(services.tenantId, member.tenantId))
    .orderBy(asc(services.sortOrder));

  return NextResponse.json({ services: list });
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
    .insert(services)
    .values({
      tenantId:        member.tenantId,
      name:            body.name,
      description:     body.description || null,
      durationMinutes: body.durationMinutes ?? 30,
      price:           String(body.price ?? 0),
      bufferMinutes:   body.bufferMinutes ?? 0,
      isPopular:       body.isPopular ?? false,
      isActive:        true,
    })
    .returning();

  return NextResponse.json({ service: created });
}
