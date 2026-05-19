"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, Check, Clock, MapPin, Phone, MessageCircle, Instagram, Scissors, Star, ChevronLeft } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDuration } from "@/lib/utils/format";
import type { Tenant, Service, Staff, BusinessHours } from "@/lib/db/schema";

type Step = "home" | "service" | "staff" | "datetime" | "details" | "success";

interface BookingState {
  service: Service | null;
  staff:   Staff | null;
  date:    string;
  time:    string;
  name:    string;
  phone:   string;
  notes:   string;
}

function Avatar({ name, size = 48, color }: { name: string; size?: number; color?: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: color ?? "#0284C7", fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function ProgressBar({ step, p }: { step: Step; p: string }) {
  const steps: Step[] = ["service", "staff", "datetime", "details"];
  const idx = steps.indexOf(step);
  if (idx < 0) return null;
  return (
    <div className="flex gap-1 px-5 pt-1 pb-3">
      {steps.map((_, i) => (
        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
          style={{ background: i <= idx ? p : "#E5E7EB" }} />
      ))}
    </div>
  );
}

export function BookingShell({
  tenant, services, staff, businessHours,
}: {
  tenant:        Tenant;
  services:      Service[];
  staff:         Staff[];
  businessHours: BusinessHours[];
}) {
  const p = tenant.primaryColor;

  const [step,        setStep]        = useState<Step>("home");
  const [loading,     setLoading]     = useState(false);
  const [booking,     setBooking]     = useState<BookingState>({
    service: null, staff: null, date: "", time: "", name: "", phone: "", notes: "",
  });
  const [slots,        setSlots]        = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = startOfDay(new Date());
  const days = Array.from({ length: 60 }, (_, i) => addDays(today, i))
    .filter(d => {
      const bh = businessHours.find(h => h.dayOfWeek === d.getDay());
      return bh?.isOpen !== false;
    })
    .slice(0, 30);

  const loadSlots = async (date: string, staffId: string | null) => {
    if (!booking.service) return;
    setLoadingSlots(true);
    const params = new URLSearchParams({ tenantId: tenant.id, serviceId: booking.service.id, date });
    if (staffId) params.set("staffId", staffId);
    const data = await fetch(`/api/booking/slots?${params}`).then(r => r.json());
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
  };

  const handleConfirm = async () => {
    if (!booking.service || !booking.date || !booking.time || !booking.name.trim() || !booking.phone.trim()) {
      toast.error("נא למלא את כל השדות");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/booking/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId:        tenant.id,
        serviceId:       booking.service.id,
        staffId:         booking.staff?.id ?? null,
        customerName:    booking.name.trim(),
        customerPhone:   booking.phone.trim(),
        notes:           booking.notes.trim() || null,
        date:            booking.date,
        time:            booking.time,
        durationMinutes: booking.service.durationMinutes,
        price:           booking.service.price,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) { toast.error("שגיאה בקביעת התור. נסה שוב."); return; }
    setStep("success");
  };

  const goBack = () => {
    const flow: Step[] = ["home", "service", "staff", "datetime", "details"];
    const idx = flow.indexOf(step);
    if (idx > 0) setStep(flow[idx - 1]);
  };

  const isInFlow = !["home", "success"].includes(step);
  const STEP_LABELS: Record<Step, string> = {
    home: "", service: "בחירת שירות", staff: "בחירת מטפל",
    datetime: "בחירת מועד", details: "פרטים", success: "",
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#F8F9FC]">

      {/* In-flow header */}
      {isInFlow && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={goBack}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">{STEP_LABELS[step]}</p>
              <p className="text-xs text-gray-400">{tenant.name}</p>
            </div>
            <button onClick={() => setStep("home")}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X size={16} className="text-gray-600" />
            </button>
          </div>
          <ProgressBar step={step} p={p} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="flex-1">

          {/* ── HOME ── */}
          {step === "home" && (
            <div className="pb-32">

              {/* Hero */}
              <div className="relative h-48 overflow-hidden">
                {tenant.coverUrl
                  ? <img src={tenant.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${p} 0%, ${p}BB 100%)` }}>
                      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 15% 85%, rgba(255,255,255,0.12) 0%, transparent 55%)" }} />
                    </div>
                }
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 55%)" }} />
              </div>

              {/* Business card */}
              <div className="bg-white px-5 pb-5">
                <div className="flex items-end justify-between -mt-12 mb-4">
                  <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-card-lg flex items-center justify-center font-black text-3xl text-white overflow-hidden"
                    style={{ background: tenant.logoUrl ? "transparent" : p }}>
                    {tenant.logoUrl
                      ? <img src={tenant.logoUrl} alt="" className="w-full h-full object-cover" />
                      : tenant.name[0]
                    }
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    {tenant.instagram && (
                      <a href={`https://instagram.com/${tenant.instagram}`} target="_blank" rel="noreferrer"
                        className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <Instagram size={15} className="text-pink-500" />
                      </a>
                    )}
                  </div>
                </div>

                <h1 className="text-xl font-black text-gray-900">{tenant.name}</h1>
                <p className="text-sm mt-0.5" style={{ color: p }}>{tenant.category}</p>
                {tenant.description && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{tenant.description}</p>
                )}
                {tenant.address && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                    <MapPin size={11} className="shrink-0" />{tenant.address}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {tenant.whatsapp && (
                    <a href={`https://wa.me/${tenant.whatsapp}`}
                      className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all active:scale-95"
                      style={{ background: "#22C55E" }}>
                      <MessageCircle size={15} />ווטסאפ
                    </a>
                  )}
                  {tenant.phone && (
                    <a href={`tel:${tenant.phone}`}
                      className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold border border-gray-200 text-gray-700 bg-gray-50 transition-all active:scale-95">
                      <Phone size={14} />{tenant.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className="px-4 pt-5">
                <h2 className="font-bold text-gray-900 mb-3 text-base">שירותים</h2>
                <div className="flex flex-col gap-2.5">
                  {services.map(s => (
                    <div key={s.id}
                      onClick={() => { setBooking(b => ({ ...b, service: s })); setStep("staff"); }}
                      className="flex gap-4 bg-white rounded-2xl border border-gray-100 shadow-card p-4 cursor-pointer hover:shadow-card-md hover:border-gray-200 transition-all active:scale-[0.99]">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: p + "18" }}>
                        <Scissors size={20} style={{ color: p }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{s.name}</span>
                          {s.isPopular && <Badge variant="warning" size="sm">🔥</Badge>}
                        </div>
                        {s.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">{s.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                          <Clock size={10} />{formatDuration(s.durationMinutes)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-between shrink-0">
                        <p className="font-black text-lg" style={{ color: p }}>{formatPrice(parseFloat(s.price))}</p>
                        <div className="h-8 px-3 rounded-lg text-white text-xs font-bold flex items-center"
                          style={{ background: p }}>
                          הזמן
                        </div>
                      </div>
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
              <p className="text-sm text-gray-400 mb-4">בחר מטפל או קבע עם הראשון שפנוי</p>

              {booking.service && (
                <div className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-xl border text-xs font-semibold"
                  style={{ background: p + "10", borderColor: p + "30", color: p }}>
                  {booking.service.name} · {formatDuration(booking.service.durationMinutes)} · {formatPrice(parseFloat(booking.service.price))}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <div onClick={() => { setBooking(b => ({ ...b, staff: null })); loadSlots(booking.date || format(today, "yyyy-MM-dd"), null); setStep("datetime"); }}
                  className="flex items-center gap-4 bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all active:scale-[0.99]"
                  style={{ borderColor: !booking.staff ? p : "#E5E7EB" }}>
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">👥</div>
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
                    className="flex items-center gap-4 bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all active:scale-[0.99]"
                    style={{ borderColor: booking.staff?.id === s.id ? p : "#E5E7EB" }}>
                    <Avatar name={s.name} size={56} color={s.calendarColor} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900">{s.name}</p>
                      {s.role && <p className="text-xs mt-0.5 font-medium" style={{ color: p }}>{s.role}</p>}
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

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
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

              {booking.date && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">שעות פנויות</p>
                  {loadingSlots ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(8)].map((_, i) => <div key={i} className="h-11 skeleton rounded-xl" />)}
                    </div>
                  ) : slots.filter(s => s.available).length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                      <p className="text-gray-500 font-semibold">אין שעות פנויות ביום זה</p>
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
                            : { background: "#fff", borderColor: "#E5E7EB", color: "#374151" }}>
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
              <p className="text-sm text-gray-400 mb-5">נשלח אליך אישור לטלפון</p>

              {/* Summary */}
              <div className="bg-white rounded-2xl border p-4 mb-5 flex flex-col gap-2.5"
                style={{ borderColor: p + "30" }}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">שירות</span>
                  <span className="font-semibold text-gray-900">{booking.service?.name}</span>
                </div>
                {booking.staff && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">מטפל</span>
                    <span className="font-semibold text-gray-900">{booking.staff.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">מועד</span>
                  <span className="font-semibold text-gray-900">
                    {booking.date && format(new Date(booking.date + "T12:00:00"), "EEEE d MMMM", { locale: he })} · {booking.time}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-0.5">
                  <span className="font-bold text-gray-700">סה"כ</span>
                  <span className="font-black text-xl" style={{ color: p }}>
                    {formatPrice(parseFloat(booking.service?.price ?? "0"))}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Input label="שם מלא" placeholder="ישראל ישראלי" required
                  value={booking.name} onChange={e => setBooking(b => ({ ...b, name: e.target.value }))} />
                <Input label="טלפון" type="tel" placeholder="050-0000000" required dir="ltr"
                  value={booking.phone} onChange={e => setBooking(b => ({ ...b, phone: e.target.value }))} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">הערה (אופציונלי)</label>
                  <textarea placeholder="בקשה מיוחדת..." rows={3}
                    value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none transition-all" />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full mt-6 h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: p }}>
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : <><Check size={20} />אישור קביעת תור</>}
              </button>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: "#DCFCE7" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
                  <Check size={36} color="#fff" strokeWidth={2.5} />
                </div>
              </motion.div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">התור נקבע!</h2>
              <p className="font-semibold text-gray-700 mb-0.5">{booking.service?.name}</p>
              {booking.date && (
                <p className="text-sm text-gray-400 mb-0.5">
                  {format(new Date(booking.date + "T12:00:00"), "EEEE, d MMMM", { locale: he })} · {booking.time}
                </p>
              )}
              {booking.staff && <p className="text-sm text-gray-400 mb-6">עם {booking.staff.name}</p>}

              <div className="w-full max-w-xs bg-green-50 rounded-2xl p-4 mb-6 border border-green-100">
                <p className="text-sm font-semibold text-green-700">📱 אישור ישלח ל-{booking.phone}</p>
              </div>

              {tenant.whatsapp && (
                <a href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(`שלום! קבעתי תור ל${booking.service?.name} ב${booking.date} בשעה ${booking.time}`)}`}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white mb-3 transition-all active:scale-95"
                  style={{ background: "#22C55E" }}>
                  <MessageCircle size={18} />שתף בווטסאפ
                </a>
              )}
              <button
                onClick={() => { setStep("home"); setBooking({ service: null, staff: null, date: "", time: "", name: "", phone: "", notes: "" }); }}
                className="text-sm text-gray-400 hover:text-gray-600 hover:underline mt-2 transition-colors">
                חזרה לעמוד העסק
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky CTA on home */}
      {step === "home" && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-safe-or-6 pb-6 pt-6 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-20">
          <button onClick={() => setStep("service")}
            className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg pointer-events-auto transition-all active:scale-[0.98]"
            style={{ background: p }}>
            קבע תור עכשיו ←
          </button>
        </div>
      )}
    </div>
  );
}
