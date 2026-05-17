import { format, addMinutes, isAfter, isBefore, parseISO, setHours, setMinutes } from "date-fns";

export interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
}

export interface ExistingAppointment {
  start_at: string;
  end_at: string;
  staff_id: string | null;
  status: string;
}

export interface StaffScheduleDay {
  is_available: boolean;
  start_time: string; // "HH:mm:ss"
  end_time: string;
}

export interface BusinessHoursDay {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface GetSlotsParams {
  date: string; // "YYYY-MM-DD"
  serviceDurationMinutes: number;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  staffSchedule: StaffScheduleDay | null;
  businessHours: BusinessHoursDay | null;
  existingAppointments: ExistingAppointment[];
  staffId: string | null;
}

function parseTime(dateStr: string, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(dateStr + "T00:00:00");
  d.setHours(h, m, 0, 0);
  return d;
}

export function getAvailableSlots(params: GetSlotsParams): TimeSlot[] {
  const {
    date,
    serviceDurationMinutes,
    bufferMinutes,
    slotIntervalMinutes = 30,
    staffSchedule,
    businessHours,
    existingAppointments,
    staffId,
  } = params;

  const totalBlock = serviceDurationMinutes + bufferMinutes;
  const now = new Date();

  // Determine working window
  let workStart: Date;
  let workEnd: Date;

  if (staffSchedule) {
    if (!staffSchedule.is_available) return [];
    workStart = parseTime(date, staffSchedule.start_time);
    workEnd   = parseTime(date, staffSchedule.end_time);
  } else if (businessHours) {
    if (!businessHours.is_open) return [];
    workStart = parseTime(date, businessHours.open_time);
    workEnd   = parseTime(date, businessHours.close_time);
  } else {
    return [];
  }

  // Collect busy intervals for this staff/date
  const busy: Array<{ start: Date; end: Date }> = existingAppointments
    .filter(a =>
      a.status !== "cancelled" &&
      (!staffId || a.staff_id === staffId) &&
      a.start_at.startsWith(date)
    )
    .map(a => ({ start: new Date(a.start_at), end: new Date(a.end_at) }));

  const slots: TimeSlot[] = [];
  let cursor = new Date(workStart);

  while (true) {
    const slotEnd = addMinutes(cursor, totalBlock);
    if (isAfter(slotEnd, workEnd)) break;

    const isInPast = isBefore(cursor, now);
    const isConflict = busy.some(b =>
      isBefore(cursor, b.end) && isAfter(slotEnd, b.start)
    );

    slots.push({
      time: format(cursor, "HH:mm"),
      available: !isInPast && !isConflict,
    });

    cursor = addMinutes(cursor, slotIntervalMinutes);
  }

  return slots;
}
