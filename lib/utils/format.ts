import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { he } from "date-fns/locale";

export function formatPrice(amount: number): string {
  return `₪${amount.toLocaleString("he-IL")}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} דק'`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}ש' ${m}דק'` : `${h} שעות`;
}

export function formatAppointmentDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return `היום, ${format(d, "HH:mm")}`;
  if (isTomorrow(d)) return `מחר, ${format(d, "HH:mm")}`;
  return format(d, "EEEE d MMMM, HH:mm", { locale: he });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: he });
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export const STATUS_LABELS: Record<string, string> = {
  confirmed: "מאושר",
  pending:   "ממתין",
  completed: "הושלם",
  cancelled: "בוטל",
  no_show:   "לא הגיע",
};

export const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show:   "bg-gray-50 text-gray-600 border-gray-200",
};
