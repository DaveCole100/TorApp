"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Check, Clock, MapPin, Phone, MessageCircle, Instagram, Star } from "lucide-react";
import { format, addDays, isSunday, isBefore, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDuration } from "@/lib/utils/format";
import { getAvailableSlots } from "@/lib/booking/engine";
import { createClient } from "@/lib/supabase/client";
import type { Tenant, Service, Staff, BusinessHours } from "@/types/database";

type Step = "home" | "service" | "staff" | "datetime" | "details" | "success";

interface BookingState {
  service: Service | null;
  staff: Staff | null;
  date: string;
  time: string;
  name: string;
  phone: string;
  notes: string;
}

const STEP_TITLES: Record<Step, string> = {
  home:     "עמוד העסק",
  service:  "בחירת שירות",
  staff:    "בחירת מטפל",
  datetime: "בחירת מועד",
  details:  "פרטים",
  success:  "תור נקבע!",
};

const CAT_GRADIENTS = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
];

function categoryGradient(name: string): string {
  let hash = 0;
  for (const c of name) hash = ((hash << 5) - hash) + c.charCodeAt(0);
  return CAT_GRADIENTS[Math.abs(hash) % CAT_GRADIENTS.length];
}

function Avatar({ name, size = 48, color }: { name: string; size?: number; color?: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: color ?? "#4F46E5", fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const steps: Step[] = ["service", "staff", "datetime", "details"];
  const idx = steps.indexOf(step);
  if (idx < 0) return null;
  return (
    <div className="flex gap-1 px-4 pt-1 pb-2">
      {steps.map((_, i) => (
        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
          style={{ background: i <= idx ? "var(--p)" : "#E5E7EB" }} />
      ))}
    </div>
  );
}

export function BookingShell({
  tenant, services, staff, businessHours,
}: {
  tenant: Tenant;
  services: Service[];
  staff: Staff[];
  businessHours: BusinessHours[];
}) {
  const p = tenant.primary_color;

  const [step,    setStep]    = useState<Step>("home");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingState>({
    service: null, staff: null, date: "", time: "", name: "", phone: "", notes: "",
  });
  const [slots,    setSlots]    = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Group services by category
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services) {
      const cat = (s as any).category ?? "שירותים";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return map;
  }, [services]);

  // Days for calendar (next 60 days, excluding Sundays)
  const today = startOfDay(new Date());
  const days = Array.from({ length: 60 }, (_, i) => addDays(today, i))
    .filter(d => {
      const dow = d.getDay();
      const bh = businessHours.find(h => h.day_of_week === dow);
      return bh?.is_open !== false && !isSunday(d);
    })
    .slice(0, 30);

  const loadSlots = async (date: string, staffId: string | null) => {
    if (!booking.service) return;
    setLoadingSlots(true);
    const supabase = createClient();
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    const bh = businessHours.find(h => h.day_of_week === dayOfWeek);

    let staffSchedule = null;
    if (staffId) {
      const { data } = await supabase
        .from("staff_schedules")
        .select("*")
        .eq("staff_id", staffId)
        .eq("day_of_week", dayOfWeek)
        .single();
      staffSchedule = data;
    }

    const { data: existingAppts } = await supabase
      .from("appointments")
      .select("start_at, end_at, staff_id, status")
      .eq("tenant_id", tenant.id)
      .gte("start_at", date + "T00:00:00")
      .lte("start_at", date + "T23:59:59")
      .not("status", "eq", "cancelled");

    const computed = getAvailableSlots({
      date,
      serviceDurationMinutes: booking.service.duration_minutes,
      bufferMinutes: booking.service.buffer_minutes,
      slotIntervalMinutes: 30,
      staffSchedule: staffSchedule ?? null,
      businessHours: bh ? { is_open: bh.is_open, open_time: bh.open_time, close_time: bh.close_time } : null,
      existingAppointments: existingAppts ?? [],
      staffId,
    });
    setSlots(computed);
    setLoadingSlots(false);
  };

  const handleConfirm = async () => {
    if (!booking.service || !booking.date || !booking.time || !booking.name.trim() || !booking.phone.trim()) {
      toast.error("נא למלא את כל השדות");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const start = new Date(`${booking.date}T${booking.time}:00`);
    const end   = new Date(start.getTime() + booking.service.duration_minutes * 60000);

    const { error } = await supabase.from("appointments").insert({
      tenant_id:      tenant.id,
      service_id:     booking.service.id,
      staff_id:       booking.staff?.id ?? null,
      customer_name:  booking.name.trim(),
      customer_phone: booking.phone.trim(),
      notes:          booking.notes.trim() || null,
      start_at:       start.toISOString(),
      end_at:         end.toISOString(),
      price:          booking.service.price,
      status:         "confirmed",
      source:         "online",
    });

    setLoading(false);
    if (error) { toast.error("שגיאה בקביעת התור. נסה שוב."); return; }
    setStep("success");
  };

  const goBack = () => {
    const flow: Step[] = ["home", "service", "staff", "datetime", "details"];
    const idx = flow.indexOf(step);
    if (idx > 0) setStep(flow[idx - 1]);
  };

  const isInFlow = !["home", "success"].includes(step);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#F8F9FC" }}>

      {/* Dynamic color vars */}
      <style>{`:root { --p: ${p}; }`}</style>

      {/* Header (booking flow only) */}
      {isInFlow && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={goBack}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">{STEP_TITLES[step]}</p>
              <p className="text-xs text-gray-400">{tenant.name}</p>
            </div>
            <button onClick={() => setStep("home")}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X size={16} className="text-gray-600" />
            </button>
          </div>
          <ProgressBar step={step} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex-1">

          {/* ── HOME ── */}
          {step === "home" && (
            <div className="pb-32">
              {/* Cover */}
              <div className="relative h-52 overflow-hidden" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                {tenant.cover_url && <img src={tenant.cover_url} alt="" className="w-full h-full object-cover" />}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(255,255,255,0.9) 0%,transparent 60%)" }} />
              </div>

              {/* Business info */}
              <div className="bg-white px-5 pb-5 shadow-sm">
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-card-md flex items-center justify-center font-black text-3xl text-white"
                    style={{ background: tenant.logo_url ? "transparent" : p }}>
                    {tenant.logo_url ? <img src={tenant.logo_url} alt="" className="w-full h-full object-cover rounded-xl" /> : tenant.name[0]}
                  </div>
                  {tenant.instagram && (
                    <a href={`https://instagram.com/${tenant.instagram}`} target="_blank" rel="noreferrer"
                      className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                      <Instagram size={16} className="text-pink-600" />
                    </a>
                  )}
                </div>
                <h1 className="text-xl font-black text-gray-900">{tenant.name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{tenant.category}</p>
                {tenant.description && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{tenant.description}</p>}

                {/* Address + Hours */}
                {(tenant.address || tenant.phone) && (
                  <div className="flex flex-col gap-1.5 mt-3">
                    {tenant.address && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={12} className="shrink-0" />{tenant.address}
                      </div>
                    )}
                  </div>
                )}

                {/* CTA buttons */}
                <div className="flex gap-2 mt-4">
                  {tenant.whatsapp && (
                    <a href={`https://wa.me/${tenant.whatsapp}`}
                      className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all active:scale-95"
                      style={{ background: "#22C55E" }}>
                      <MessageCircle size={16} />ווטסאפ
                    </a>
                  )}
                  {tenant.phone && (
                    <a href={`tel:${tenant.phone}`}
                      className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border-2 border-gray-200 text-gray-700 transition-all active:scale-95">
                      <Phone size={15} />{tenant.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="px-4 pt-5">
                <h2 className="font-bold text-gray-900 mb-3">שירותים</h2>
                <div className="flex flex-col gap-3">
                  {Array.from(grouped.entries()).map(([cat, svcs]) => (
                    <div key={cat}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
                      {svcs.map(s => (
                        <div key={s.id} onClick={() => { setBooking(b => ({ ...b, service: s })); setStep("staff"); }}
                          className="flex gap-3 bg-white rounded-2xl border border-gray-100 shadow-card p-4 mb-2 cursor-pointer hover:shadow-card-md transition-all active:scale-[0.99]">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
                            style={{ background: categoryGradient(cat) }}>
                            ✂️
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900">{s.name}</span>
                              {s.is_popular && <Badge variant="warning" size="sm">🔥</Badge>}
                            </div>
                            {s.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.description}</p>}
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Clock size={10} />{formatDuration(s.duration_minutes)}
                            </p>
                          </div>
                          <div className="shrink-0 text-left">
                            <p className="font-black text-base" style={{ color: p }}>{formatPrice(s.price)}</p>
                            <button className="mt-1 text-[11px] font-bold px-2 py-1 rounded-lg border-2 transition-all active:scale-95"
                              style={{ borderColor: p, color: p }}>הזמן</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STAFF ── */}
          {step === "staff" && (
            <div className="px-4 py-5">
              <h2 className="font-bold text-lg text-gray-900 mb-1">עם מי תרצה?</h2>
              <p className="text-sm text-gray-400 mb-5">בחר מטפל או קבע עם הראשון שפנוי</p>

              {/* Summary strip */}
              {booking.service && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl border"
                  style={{ background: p + "10", borderColor: p + "30" }}>
                  <span className="text-xs font-semibold" style={{ color: p }}>
                    {booking.service.name} · {formatDuration(booking.service.duration_minutes)} · {formatPrice(booking.service.price)}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {/* Any staff option */}
                <div onClick={() => { setBooking(b => ({ ...b, staff: null })); setStep("datetime"); }}
                  className="flex items-center gap-4 bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all active:scale-[0.99] hover:border-brand-200"
                  style={{ borderColor: !booking.staff ? p : "#E5E7EB" }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 bg-brand-50">
                    👥
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">כל מטפל פנוי</p>
                    <p className="text-xs text-gray-400">הזמן הכי מוקדם שפנוי</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: !booking.staff ? p : "#D1D5DB", background: !booking.staff ? p : "transparent" }}>
                    {!booking.staff && <Check size={11} color="#fff" />}
                  </div>
                </div>

                {staff.map(s => (
                  <div key={s.id}
                    onClick={() => { setBooking(b => ({ ...b, staff: s })); setStep("datetime"); }}
                    className="flex items-center gap-4 bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all active:scale-[0.99] hover:border-brand-200"
                    style={{ borderColor: booking.staff?.id === s.id ? p : "#E5E7EB" }}>
                    <Avatar name={s.name} size={56} color={s.calendar_color} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900">{s.name}</p>
                      {s.role && <p className="text-xs mt-0.5" style={{ color: p }}>{s.role}</p>}
                      {s.bio && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.bio}</p>}
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: booking.staff?.id === s.id ? p : "#D1D5DB", background: booking.staff?.id === s.id ? p : "transparent" }}>
                      {booking.staff?.id === s.id && <Check size={11} color="#fff" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DATETIME ── */}
          {step === "datetime" && (
            <div className="px-4 py-5">
              <h2 className="font-bold text-lg text-gray-900 mb-1">בחר תאריך ושעה</h2>
              <p className="text-sm text-gray-400 mb-4">מתי יתאים לך?</p>

              {/* Date scroll */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
                {days.map(d => {
                  const iso = format(d, "yyyy-MM-dd");
                  const sel = iso === booking.date;
                  return (
                    <button key={iso}
                      onClick={() => { setBooking(b => ({ ...b, date: iso, time: "" })); loadSlots(iso, booking.staff?.id ?? null); }}
                      className="flex flex-col items-center justify-center w-14 h-16 rounded-2xl border-2 shrink-0 transition-all active:scale-95"
                      style={{ background: sel ? p : "#fff", borderColor: sel ? p : "#E5E7EB", color: sel ? "#fff" : "#374151" }}>
                      <span className="text-[10px] font-semibold uppercase">{format(d, "EEE", { locale: he })}</span>
                      <span className="text-lg font-black">{format(d, "d")}</span>
                      <span className="text-[9px]">{format(d, "MMM", { locale: he })}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time slots */}
              {booking.date && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-3">שעות פנויות</p>
                  {loadingSlots ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(8)].map((_, i) => <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse" />)}
                    </div>
                  ) : slots.filter(s => s.available).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 font-medium">אין שעות פנויות ביום זה</p>
                      <p className="text-sm text-gray-400 mt-1">בחר תאריך אחר</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.filter(s => s.available).map(s => (
                        <button key={s.time}
                          onClick={() => { setBooking(b => ({ ...b, time: s.time })); setStep("details"); }}
                          className="h-11 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95"
                          style={booking.time === s.time
                            ? { background: p, borderColor: p, color: "#fff" }
                            : { background: "#fff", borderColor: "#E5E7EB", color: "#374151" }
                          }>
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── DETAILS ── */}
          {step === "details" && (
            <div className="px-4 py-5">
              <h2 className="font-bold text-lg text-gray-900 mb-1">הפרטים שלך</h2>
              <p className="text-sm text-gray-400 mb-5">נשלח אליך אישור בSMS</p>

              {/* Booking summary */}
              <div className="bg-white rounded-2xl border p-4 mb-5 flex flex-col gap-2"
                style={{ borderColor: p + "30", background: p + "08" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">שירות</span>
                  <span className="font-semibold text-gray-900">{booking.service?.name}</span>
                </div>
                {booking.staff && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">מטפל</span>
                    <span className="font-semibold text-gray-900">{booking.staff.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">מועד</span>
                  <span className="font-semibold text-gray-900">
                    {booking.date && format(new Date(booking.date + "T12:00:00"), "EEEE d MMMM", { locale: he })} {booking.time}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-1">
                  <span className="font-bold text-gray-700">סה"כ</span>
                  <span className="font-black text-lg" style={{ color: p }}>{formatPrice(booking.service?.price ?? 0)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Input label="שם מלא" placeholder="ישראל ישראלי" required
                  value={booking.name} onChange={e => setBooking(b => ({ ...b, name: e.target.value }))} />
                <Input label="טלפון" type="tel" placeholder="050-0000000" required dir="ltr"
                  value={booking.phone} onChange={e => setBooking(b => ({ ...b, phone: e.target.value }))} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">הערה (אופציונלי)</label>
                  <textarea
                    placeholder="בקשה מיוחדת..."
                    value={booking.notes}
                    onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none transition-all"
                  />
                </div>
              </div>

              <Button onClick={handleConfirm} loading={loading} size="xl"
                className="w-full mt-6 shadow-brand-glow"
                style={{ background: `linear-gradient(135deg, ${p} 0%, #7C3AED 100%)`, border: "none" }}>
                <Check size={20} />
                אישור קביעת תור
              </Button>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: "#DCFCE7" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
                  <Check size={36} color="#fff" strokeWidth={2.5} />
                </div>
              </motion.div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">התור נקבע!</h2>
              <p className="text-base text-gray-600 mb-1">{booking.service?.name}</p>
              {booking.date && (
                <p className="text-sm text-gray-400 mb-1">
                  {format(new Date(booking.date + "T12:00:00"), "EEEE d MMMM", { locale: he })} בשעה {booking.time}
                </p>
              )}
              {booking.staff && (
                <p className="text-sm text-gray-400 mb-6">עם {booking.staff.name}</p>
              )}
              <div className="w-full max-w-xs bg-green-50 rounded-2xl p-4 mb-8 border border-green-100">
                <p className="text-sm font-semibold text-green-700">📱 אישור ישלח ל-{booking.phone}</p>
              </div>
              {tenant.whatsapp && (
                <a href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(`שלום! קבעתי תור ל${booking.service?.name} ב${booking.date} בשעה ${booking.time}`)}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white mb-3 transition-all active:scale-95"
                  style={{ background: "#22C55E" }}>
                  <MessageCircle size={18} /> שלח לווטסאפ
                </a>
              )}
              <button onClick={() => { setStep("home"); setBooking({ service: null, staff: null, date: "", time: "", name: "", phone: "", notes: "" }); }}
                className="text-sm text-gray-500 hover:underline mt-2">
                חזרה לעמוד העסק
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky book button (home only) */}
      {step === "home" && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-white to-transparent pointer-events-none z-20">
          <button onClick={() => setStep("service")}
            className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-brand-glow pointer-events-auto transition-all active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${p} 0%, #7C3AED 100%)` }}>
            קבע תור עכשיו ←
          </button>
        </div>
      )}
    </div>
  );
}
