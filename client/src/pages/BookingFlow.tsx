import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Input, Textarea, Avatar, Card, Spinner, Toast } from "@/components/ui";
import {
  ChevronRight, ChevronLeft, Check, Clock, Star,
  User, Phone, FileText, Calendar, Scissors, X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service { id: number; name: string; description?: string; durationMinutes: number; price: number; isPopular?: boolean; }
interface Staff   { id: number; name: string; role: string; avatarUrl?: string; rating?: number; }

type Step = "service" | "staff" | "datetime" | "details" | "confirm";

interface BookingState {
  service: Service | null;
  staff:   Staff | null;
  date:    string;
  time:    string;
  name:    string;
  phone:   string;
  notes:   string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SERVICES: Service[] = [
  { id: 1, name: "תספורת גברים",   description: "תספורת מקצועית + סידור קצוות",  durationMinutes: 30, price: 80,  isPopular: true },
  { id: 2, name: "תספורת + זקן",   description: "תספורת מלאה עם עיצוב זקן",      durationMinutes: 50, price: 120, isPopular: true },
  { id: 3, name: "עיצוב זקן",      description: "עיצוב וגילוח מקצועי",           durationMinutes: 25, price: 60  },
  { id: 4, name: "תספורת ילדים",   description: "עד גיל 12",                     durationMinutes: 20, price: 55  },
  { id: 5, name: "פיד + עיצוב",    description: "פיד מקצועי עם עיצוב גבולות",   durationMinutes: 40, price: 90  },
  { id: 6, name: "טיפול פנים",     description: "ניקוי עמוק + לחות",             durationMinutes: 60, price: 160 },
];

const MOCK_STAFF: Staff[] = [
  { id: 0,  name: "כל ספר פנוי",  role: "ממיר לזמן הכי מוקדם",  rating: undefined },
  { id: 1,  name: "אדן כהן",      role: "בעל המספרה",            rating: 5.0 },
  { id: 2,  name: "יוסי לוי",     role: "ספר בכיר",              rating: 4.8 },
  { id: 3,  name: "מיכל שפירא",   role: "קוסמטיקאית",            rating: 4.9 },
];

const MOCK_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","15:00","15:30","16:00","17:00","17:30"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HE_DAYS   = ["א'","ב'","ג'","ד'","ה'","ו'","ש'"];
const HE_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

function durationLabel(m: number) {
  if (m < 60) return `${m} דק'`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h}ש' ${r}דק'` : `${h} שעות`;
}

function formatDateHe(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return `${HE_DAYS[d.getDay()]} ${d.getDate()} ${HE_MONTHS[d.getMonth()]}`;
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month - 1, 1).getDay();
  const total = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
  { id: "service",  label: "שירות"  },
  { id: "staff",    label: "ספר"    },
  { id: "datetime", label: "מועד"   },
  { id: "details",  label: "פרטים"  },
  { id: "confirm",  label: "אישור"  },
];

function ProgressBar({ step }: { step: Step }) {
  const idx = STEPS.findIndex(s => s.id === step);
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1 flex-1 last:flex-none">
          <div
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
            style={
              i < idx
                ? { background: "var(--success)", color: "#fff" }
                : i === idx
                ? { background: "var(--p)", color: "#fff" }
                : { background: "var(--border)", color: "var(--text-muted)" }
            }
          >
            {i < idx ? <Check size={12} /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="flex-1 h-0.5 rounded-full transition-all duration-300"
              style={{ background: i < idx ? "var(--success)" : "var(--border)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step: Service ────────────────────────────────────────────────────────────

function StepService({ selected, onSelect }: {
  selected: Service | null;
  onSelect: (s: Service) => void;
}) {
  return (
    <div className="px-4 py-2 page-enter">
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>בחר שירות</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>איזה שירות תרצה לקבוע?</p>
      <div className="flex flex-col gap-2">
        {MOCK_SERVICES.map(s => {
          const isSelected = selected?.id === s.id;
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s)}
              className="flex items-center gap-3 p-4 rounded-[var(--r-lg)] border-2 transition-all cursor-pointer active:scale-[0.99]"
              style={{
                background:   isSelected ? "var(--p-soft)"   : "var(--bg-card)",
                borderColor:  isSelected ? "var(--p)"        : "var(--border)",
                boxShadow:    isSelected ? "0 0 0 1px var(--p)" : "var(--shadow-xs)",
              }}
            >
              <div
                className="w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center flex-shrink-0"
                style={{ background: isSelected ? "var(--p)" : "var(--p-soft)" }}
              >
                <Scissors size={16} style={{ color: isSelected ? "#fff" : "var(--p)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{s.name}</span>
                  {s.isPopular && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
                      🔥 פופולרי
                    </span>
                  )}
                </div>
                {s.description && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{s.description}</p>}
                <span className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                  <Clock size={10} />
                  {durationLabel(s.durationMinutes)}
                </span>
              </div>
              <div className="text-left flex-shrink-0 flex items-center gap-2">
                <span className="font-bold text-base" style={{ color: "var(--p)" }}>₪{s.price}</span>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: isSelected ? "var(--p)" : "var(--border-strong)",
                    background:  isSelected ? "var(--p)" : "transparent",
                  }}
                >
                  {isSelected && <Check size={10} color="#fff" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step: Staff ──────────────────────────────────────────────────────────────

function StepStaff({ selected, onSelect }: {
  selected: Staff | null;
  onSelect: (s: Staff) => void;
}) {
  return (
    <div className="px-4 py-2 page-enter">
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>בחר ספר</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>עם מי תרצה לקבוע את התור?</p>
      <div className="flex flex-col gap-2">
        {MOCK_STAFF.map(s => {
          const isSelected = selected?.id === s.id;
          const isAny = s.id === 0;
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s)}
              className="flex items-center gap-3 p-4 rounded-[var(--r-lg)] border-2 transition-all cursor-pointer active:scale-[0.99]"
              style={{
                background:  isSelected ? "var(--p-soft)" : "var(--bg-card)",
                borderColor: isSelected ? "var(--p)"      : "var(--border)",
                boxShadow:   isSelected ? "0 0 0 1px var(--p)" : "var(--shadow-xs)",
              }}
            >
              {isAny
                ? <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--p-soft)" }}>
                    <Users size={20} style={{ color: "var(--p)" }} />
                  </div>
                : <Avatar name={s.name} src={s.avatarUrl} size={48} />
              }
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm block" style={{ color: "var(--text)" }}>{s.name}</span>
                <span className="text-xs" style={{ color: "var(--p)" }}>{s.role}</span>
                {s.rating && (
                  <span className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Star size={10} fill="currentColor" style={{ color: "#F59E0B" }} />
                    {s.rating}
                  </span>
                )}
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: isSelected ? "var(--p)"            : "var(--border-strong)",
                  background:  isSelected ? "var(--p)"            : "transparent",
                }}
              >
                {isSelected && <Check size={10} color="#fff" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step: DateTime ───────────────────────────────────────────────────────────

function StepDateTime({ selectedDate, selectedTime, onDateSelect, onTimeSelect }: {
  selectedDate: string;
  selectedTime: string;
  onDateSelect: (d: string) => void;
  onTimeSelect: (t: string) => void;
}) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const cells = getCalendarDays(year, month);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y+1); } else setMonth(m => m+1); };

  const toISO = (day: number) =>
    `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const isPast = (day: number) => toISO(day) < todayStr;
  const isSunday = (day: number) => new Date(toISO(day)).getDay() === 0;

  return (
    <div className="px-4 py-2 page-enter">
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>בחר מועד</h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>מתי יתאים לך?</p>

      {/* Calendar */}
      <div className="rounded-[var(--r-xl)] border overflow-hidden mb-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>

        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--border)]">
            <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
          <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
            {HE_MONTHS[month-1]} {year}
          </span>
          <button
            onClick={prevMonth}
            disabled={year === today.getFullYear() && month === today.getMonth() + 1}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--border)] disabled:opacity-30"
          >
            <ChevronLeft size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {HE_DAYS.map(d => (
            <div key={d} className="text-center py-1 text-xs font-bold" style={{ color: "var(--text-muted)" }}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 px-2 pb-3 gap-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const iso = toISO(day);
            const disabled = isPast(day) || isSunday(day);
            const isSelected = iso === selectedDate;
            const isToday = iso === todayStr;
            return (
              <button
                key={day}
                onClick={() => !disabled && onDateSelect(iso)}
                disabled={disabled}
                className="h-9 w-full rounded-[var(--r-sm)] flex items-center justify-center text-sm font-medium transition-all"
                style={
                  isSelected
                    ? { background: "var(--p)", color: "#fff", fontWeight: 700 }
                    : isToday
                    ? { background: "var(--p-soft)", color: "var(--p)", fontWeight: 700 }
                    : disabled
                    ? { color: "var(--text-placeholder)", cursor: "not-allowed" }
                    : { color: "var(--text)" }
                }
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="page-enter">
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
            שעות פנויות — {formatDateHe(selectedDate)}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {MOCK_SLOTS.map(t => (
              <button
                key={t}
                onClick={() => onTimeSelect(t)}
                className="h-10 rounded-[var(--r-md)] text-sm font-semibold border-2 transition-all active:scale-[0.96]"
                style={{
                  background:  selectedTime === t ? "var(--p)"      : "var(--bg-card)",
                  borderColor: selectedTime === t ? "var(--p)"      : "var(--border)",
                  color:       selectedTime === t ? "#fff"          : "var(--text)",
                  boxShadow:   selectedTime === t ? "0 0 0 1px var(--p)" : "var(--shadow-xs)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step: Details ────────────────────────────────────────────────────────────

function StepDetails({ name, phone, notes, onChange }: {
  name: string; phone: string; notes: string;
  onChange: (f: "name"|"phone"|"notes", v: string) => void;
}) {
  return (
    <div className="px-4 py-2 page-enter">
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>הפרטים שלך</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>נשלח אליך אישור ב-SMS</p>
      <div className="flex flex-col gap-4">
        <Input
          label="שם מלא"
          placeholder="ישראל ישראלי"
          value={name}
          onChange={e => onChange("name", e.target.value)}
          prefix={<User size={15} />}
          autoComplete="name"
        />
        <Input
          label="טלפון"
          placeholder="050-0000000"
          value={phone}
          onChange={e => onChange("phone", e.target.value)}
          prefix={<Phone size={15} />}
          type="tel"
          dir="ltr"
          autoComplete="tel"
        />
        <Textarea
          label="הערה (אופציונלי)"
          placeholder="בקשה מיוחדת, מידע רלוונטי..."
          value={notes}
          onChange={e => onChange("notes", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Step: Confirm ────────────────────────────────────────────────────────────

function StepConfirm({ booking, onSubmit, loading, error }: {
  booking: BookingState;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
}) {
  const rows = [
    { icon: <Scissors size={14} />, label: "שירות",  value: `${booking.service!.name} · ${durationLabel(booking.service!.durationMinutes)}` },
    { icon: <User size={14} />,     label: "ספר",    value: booking.staff?.id === 0 ? "כל ספר פנוי" : booking.staff?.name || "—" },
    { icon: <Calendar size={14} />, label: "תאריך",  value: formatDateHe(booking.date) },
    { icon: <Clock size={14} />,    label: "שעה",    value: booking.time },
    { icon: <Phone size={14} />,    label: "טלפון",  value: booking.phone },
  ];

  return (
    <div className="px-4 py-2 page-enter">
      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>אישור הזמנה</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>בדוק את הפרטים ואשר</p>

      <Card className="mb-4" padding={false}>
        {/* Price header */}
        <div className="px-4 py-3 rounded-t-[var(--r-xl)] border-b" style={{ background: "var(--p-soft)", borderColor: "var(--border)" }}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold" style={{ color: "var(--p)" }}>סה"כ לתשלום</span>
            <span className="text-2xl font-black" style={{ color: "var(--p)" }}>₪{booking.service!.price}</span>
          </div>
        </div>
        {/* Rows */}
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.map(r => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-3.5">
              <span style={{ color: "var(--text-muted)" }}>{r.icon}</span>
              <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{r.label}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {booking.notes && (
        <div className="flex gap-2 mb-4 p-3 rounded-[var(--r-md)]" style={{ background: "var(--border)" }}>
          <FileText size={14} style={{ color: "var(--text-muted)" }} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{booking.notes}</p>
        </div>
      )}

      <p className="text-xs text-center mb-4" style={{ color: "var(--text-muted)" }}>
        לאחר האישור ישלח SMS לנייד שלך עם פרטי התור
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--r-md)]" style={{ background: "var(--error-soft)" }}>
          <p className="text-sm text-center" style={{ color: "var(--error)" }}>{error}</p>
        </div>
      )}

      <Button fullWidth size="lg" onClick={onSubmit} loading={loading}>
        <Check size={18} />
        אשר תור
      </Button>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ booking, onDone }: { booking: BookingState; onDone: () => void }) {
  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-6 text-center page-enter">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: "var(--success-soft)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "var(--success)" }}
        >
          <Check size={32} color="#fff" strokeWidth={2.5} />
        </div>
      </div>
      <h2 className="text-2xl font-black mb-2" style={{ color: "var(--text)" }}>התור נקבע!</h2>
      <p className="text-base leading-relaxed mb-1" style={{ color: "var(--text-secondary)" }}>
        {booking.service?.name}
      </p>
      <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
        {formatDateHe(booking.date)} בשעה {booking.time}
      </p>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        {booking.staff?.id !== 0 ? `עם ${booking.staff?.name}` : ""}
      </p>
      <div className="w-full max-w-xs p-4 rounded-[var(--r-lg)] mb-8" style={{ background: "var(--success-soft)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--success)" }}>
          📱 אישור נשלח ל-{booking.phone}
        </p>
      </div>
      <Button onClick={onDone} variant="secondary">
        חזרה לעמוד העסק
      </Button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BookingFlow() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();

  const [step,   setStep]  = useState<Step>("service");
  const [done,   setDone]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string>();
  const [toast,   setToast]   = useState<{ msg: string; type: "success"|"error" } | null>(null);

  const [booking, setBooking] = useState<BookingState>({
    service: null, staff: null,
    date: "", time: "",
    name: "", phone: "", notes: "",
  });

  const stepOrder: Step[] = ["service", "staff", "datetime", "details", "confirm"];
  const stepIdx  = stepOrder.indexOf(step);

  const canNext = useMemo(() => {
    if (step === "service")  return !!booking.service;
    if (step === "staff")    return !!booking.staff;
    if (step === "datetime") return !!booking.date && !!booking.time;
    if (step === "details")  return !!booking.name.trim() && booking.phone.trim().length >= 9;
    return true;
  }, [step, booking]);

  const goNext = () => {
    if (stepIdx < stepOrder.length - 1) setStep(stepOrder[stepIdx + 1]);
  };
  const goBack = () => {
    if (stepIdx > 0) setStep(stepOrder[stepIdx - 1]);
    else setLocation(`/business/${params.id}`);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(undefined);
    try {
      await new Promise(r => setTimeout(r, 1200)); // Mock API call
      setDone(true);
    } catch {
      setError("שגיאה בקביעת התור, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
        <SuccessScreen booking={booking} onDone={() => setLocation(`/business/${params.id}`)} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg)" }}>
      {toast && <Toast message={toast.msg} type={toast.type} visible />}

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-20"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}
      >
        <button
          onClick={goBack}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "var(--border)" }}
        >
          <ChevronRight size={18} style={{ color: "var(--text-secondary)" }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-sm" style={{ color: "var(--text)" }}>קביעת תור</h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Studio Eden
          </p>
        </div>
        <button onClick={() => setLocation(`/business/${params.id}`)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "var(--border)" }}>
          <X size={16} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      {/* Progress */}
      <ProgressBar step={step} />

      {/* Summary strip (steps 2+) */}
      {stepIdx > 0 && booking.service && (
        <div className="mx-4 mb-2 px-4 py-2.5 rounded-[var(--r-md)] flex items-center gap-2 page-enter"
          style={{ background: "var(--p-soft)", border: "1px solid var(--border)" }}>
          <Scissors size={13} style={{ color: "var(--p)" }} />
          <span className="text-xs font-semibold flex-1" style={{ color: "var(--p)" }}>{booking.service.name}</span>
          <span className="text-xs font-bold" style={{ color: "var(--p)" }}>₪{booking.service.price}</span>
          {booking.time && (
            <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>
              · {formatDateHe(booking.date)} {booking.time}
            </span>
          )}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {step === "service"  && <StepService  selected={booking.service} onSelect={s => { setBooking(b => ({ ...b, service: s })); }} />}
        {step === "staff"    && <StepStaff    selected={booking.staff}   onSelect={s => { setBooking(b => ({ ...b, staff: s }));   }} />}
        {step === "datetime" && (
          <StepDateTime
            selectedDate={booking.date} selectedTime={booking.time}
            onDateSelect={d => setBooking(b => ({ ...b, date: d, time: "" }))}
            onTimeSelect={t => setBooking(b => ({ ...b, time: t }))}
          />
        )}
        {step === "details" && (
          <StepDetails
            name={booking.name} phone={booking.phone} notes={booking.notes}
            onChange={(f, v) => setBooking(b => ({ ...b, [f]: v }))}
          />
        )}
        {step === "confirm" && (
          <StepConfirm booking={booking} onSubmit={handleSubmit} loading={loading} error={error} />
        )}
      </div>

      {/* Bottom CTA */}
      {step !== "confirm" && (
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 z-20"
          style={{
            background: "linear-gradient(to top, var(--bg) 80%, transparent)",
            paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))",
          }}
        >
          <Button fullWidth size="lg" onClick={goNext} disabled={!canNext}>
            המשך
            <ChevronLeft size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}

// Missing import
function Users({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
