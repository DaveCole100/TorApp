import { NextResponse } from "next/server";
import { db, services, businessHours, staffSchedules, appointments } from "@/lib/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { getAvailableSlots } from "@/lib/booking/engine";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId  = searchParams.get("tenantId");
  const serviceId = searchParams.get("serviceId");
  const date      = searchParams.get("date");
  const staffId   = searchParams.get("staffId") || null;

  if (!tenantId || !serviceId || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const [service] = await db
    .select({ durationMinutes: services.durationMinutes, bufferMinutes: services.bufferMinutes })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service) return NextResponse.json({ slots: [] });

  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  const [bh] = await db
    .select()
    .from(businessHours)
    .where(and(eq(businessHours.tenantId, tenantId), eq(businessHours.dayOfWeek, dayOfWeek)))
    .limit(1);

  let staffSchedule = null;
  if (staffId) {
    const [ss] = await db
      .select()
      .from(staffSchedules)
      .where(and(eq(staffSchedules.staffId, staffId), eq(staffSchedules.dayOfWeek, dayOfWeek)))
      .limit(1);
    if (ss) {
      staffSchedule = {
        is_available: ss.isAvailable,
        start_time:   ss.startTime,
        end_time:     ss.endTime,
      };
    }
  }

  const existingAppts = await db
    .select({
      start_at: appointments.startAt,
      end_at:   appointments.endAt,
      staff_id: appointments.staffId,
      status:   appointments.status,
    })
    .from(appointments)
    .where(and(
      eq(appointments.tenantId, tenantId),
      gte(appointments.startAt, new Date(date + "T00:00:00")),
      lte(appointments.startAt, new Date(date + "T23:59:59")),
    ));

  const slots = getAvailableSlots({
    date,
    serviceDurationMinutes: service.durationMinutes,
    bufferMinutes:          service.bufferMinutes,
    slotIntervalMinutes:    30,
    staffSchedule,
    businessHours: bh ? { is_open: bh.isOpen, open_time: bh.openTime, close_time: bh.closeTime } : null,
    existingAppointments: existingAppts.map(a => ({
      start_at: a.start_at.toISOString(),
      end_at:   a.end_at.toISOString(),
      staff_id: a.staff_id,
      status:   a.status,
    })),
    staffId,
  });

  return NextResponse.json({ slots });
}
