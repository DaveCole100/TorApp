import { NextResponse } from "next/server";
import { db, appointments, customers } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const {
    tenantId, serviceId, staffId, customerName, customerPhone,
    notes, date, time, durationMinutes, price,
  } = await req.json();

  if (!tenantId || !serviceId || !customerName || !customerPhone || !date || !time) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const start = new Date(`${date}T${time}:00`);
  const end   = new Date(start.getTime() + durationMinutes * 60000);

  // Upsert customer record
  let customerId: string | null = null;
  try {
    const [existing] = await db
      .select({ id: customers.id, visitCount: customers.visitCount })
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.phone, customerPhone)))
      .limit(1);

    if (existing) {
      customerId = existing.id;
      await db.update(customers)
        .set({ lastVisitAt: new Date(), visitCount: existing.visitCount + 1, name: customerName })
        .where(eq(customers.id, existing.id));
    } else {
      const [c] = await db.insert(customers).values({
        tenantId, name: customerName, phone: customerPhone, visitCount: 1, lastVisitAt: new Date(),
      }).returning({ id: customers.id });
      customerId = c.id;
    }
  } catch { /* customer upsert is best-effort */ }

  const [appt] = await db.insert(appointments).values({
    tenantId,
    serviceId,
    staffId:       staffId ?? null,
    customerId:    customerId ?? null,
    customerName,
    customerPhone,
    notes:         notes ?? null,
    startAt:       start,
    endAt:         end,
    price:         price != null ? String(price) : null,
    status:        "confirmed",
    source:        "online",
  }).returning({ id: appointments.id });

  return NextResponse.json({ ok: true, appointmentId: appt.id });
}
