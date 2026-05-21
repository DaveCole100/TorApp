"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, X, Check, Clock, MapPin, Phone,
  MessageCircle, Instagram, ChevronLeft, Star, ArrowLeft,
} from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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

/* ── micro-animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

function Avatar({ name, size = 48, color }: { name: string; size?: number; color?: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, background: color ?? "#0284C7", fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

function ProgressDots({ step, p }: { step: Step; p: string }) {
  const steps: Step[] = ["staff", "datetime", "details"];
  const idx = steps.indexOf(step);
  if (idx < 0) return null;
  return (
    <div className="flex gap-1.5 px-5 pb-3">
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

  const [step,         setStep]         = useState<Step>("home");
  const [loading,      setLoading]      = useState(false);
  const [booking,      setBooking]      = useState<BookingState>({
    service: null, staff: null, date: "", time: "", name: "", phone: "", notes: "",
  });
  const [slots,        setSlots]        = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const today = startOfDay(new Date());
  const days  = Array.from({ length: 60 }, (_, i) => addDays(today, i))
    .filter(d => businessHours.find(h => h.dayOfWeek === d.getDay())?.isOpen !== false)
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
    const flow: Step[] = ["home", "staff", "datetime", "details"];
    const idx = flow.indexOf(step);
    if (idx > 0) setStep(flow[idx - 1]);
  };

  const STEP_LABELS: Record<Step, string> = {
    home: "", service: "בחירת שירות", staff: "בחירת מטפל",
    datetime: "בחירת מועד", details: "פרטים אישיים", success: "",
  };

  const isInFlow = !["home", "success"].includes(step);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#F5F7FA" }}>

      {/* ── In-flow top bar ── */}
      {isInFlow && (
        <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={goBack}
              className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">{STEP_LABELS[step]}</p>
              <p className="text-xs text-gray-400">{tenant.name}</p>
            </div>
            <button onClick={() => setStep("home")}
              className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
              <X size={16} className="text-gray-600" />
            </button>
          </div>
          <ProgressDots step={step} p={p} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col">

          {/* ════════════════════════════════════
              HOME
          ════════════════════════════════════ */}
          {step === "home" && (
            <div className="flex-1 pb-32">

              {/* ── Hero banner ── */}
              <div className="relative overflow-hidden" style={{ minHeight: 240 }}>
                {/* Cover image or brand gradient */}
                {tenant.coverUrl
                  ? <img src={tenant.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0"
                      style={{ background: `linear-gradient(145deg, ${p} 0%, ${p}AA 100%)` }}>
                      {/* Dot grid texture */}
                      <div className="absolute inset-0"
                        style={{
                          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)",
                          backgroundSize: "28px 28px",
                        }} />
                      {/* Glow blob */}
                      <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full opacity-20"
                        style={{ background: "rgba(255,255,255,0.6)", filter: "blur(48px)" }} />
                    </div>
                }
                {/* Dark bottom fade */}
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.38) 0%, transparent 55%)" }} />

                {/* Content inside hero */}
                <motion.div
                  variants={stagger} initial="hidden" animate="show"
                  className="relative z-10 px-5 pt-14 pb-7 flex flex-col">

                  {/* Logo */}
                  <motion.div variants={fadeUp} className="mb-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-white/30 flex items-center justify-center font-black text-2xl text-white overflow-hidden shadow-lg"
                      style={{ background: tenant.logoUrl ? "transparent" : "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                      {tenant.logoUrl
                        ? <img src={tenant.logoUrl} alt="" className="w-full h-full object-cover" />
                        : tenant.name[0]
                      }
                    </div>
                  </motion.div>

                  {/* Name */}
                  <motion.h1 variants={fadeUp}
                    className="text-3xl font-black text-white leading-tight tracking-tight">
                    {tenant.name}
                  </motion.h1>

                  {/* Category + address */}
                  <motion.div variants={fadeUp} className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-white/80">{tenant.category}</span>
                    {tenant.address && (
                      <span className="flex items-center gap-1 text-xs text-white/60">
                        <MapPin size={10} />{tenant.address}
                      </span>
                    )}
                  </motion.div>

                  {/* Action pills */}
                  <motion.div variants={fadeUp} className="flex gap-2 mt-4 flex-wrap">
                    {tenant.whatsapp && (
                      <a href={`https://wa.me/${tenant.whatsapp}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                        <MessageCircle size={13} />ווטסאפ
                      </a>
                    )}
                    {tenant.phone && (
                      <a href={`tel:${tenant.phone}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                        <Phone size={13} />{tenant.phone}
                      </a>
                    )}
                    {tenant.instagram && (
                      <a href={`https://instagram.com/${tenant.instagram}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                        <Instagram size={13} />
                      </a>
                    )}
                  </motion.div>
                </motion.div>
              </div>

              {/* ── Description ── */}
              {tenant.description && (
                <div className="px-5 py-4 bg-white border-b border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed">{tenant.description}</p>
                </div>
              )}

              {/* ── Services list ── */}
              <div id="services" className="px-4 pt-6">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-xl font-black text-gray-900">שירותים</h2>
                  <span className="text-sm text-gray-400">{services.length} זמינים</span>
                </div>

                <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
                  {services.map((s) => (
                    <motion.div key={s.id} variants={fadeUp}>
                      <div
                        onClick={() => { setBooking(b => ({ ...b, service: s })); setStep("staff"); }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 cursor-pointer hover:shadow-card-md hover:border-gray-200 transition-all duration-200 active:scale-[0.99]">

                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-base font-black text-gray-900">{s.name}</span>
                              {s.isPopular && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                  <Star size={9} fill="currentColor" />פופולרי
                                </span>
                              )}
                            </div>
                            {s.description && (
                              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{s.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2.5">
                              <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                                <Clock size={10} />{formatDuration(s.durationMinutes)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-2">
                            <span className="text-2xl font-black leading-none" style={{ color: p }}>
                              {formatPrice(parseFloat(s.price))}
                            </span>
                            <div className="flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-1"
                              style={{ color: p }}>
                              הזמן <ChevronLeft size={14} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              STAFF
          ════════════════════════════════════ */}
          {step === "staff" && (
            <div className="px-4 py-6 flex-1">
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">עם מי תרצה?</h2>
                  <p className="text-sm text-gray-400 mb-5">בחר מטפל או קבע עם הראשון שפנוי</p>
                </motion.div>

                {booking.service && (
                  <motion.div variants={fadeUp}
                    className="flex items-center gap-2 mb-5 px-4 py-3 rounded-2xl text-sm font-semibold"
                    style={{ background: p + "12", color: p, border: `1px solid ${p}25` }}>
                    {booking.service.name} · {formatDuration(booking.service.durationMinutes)} · {formatPrice(parseFloat(booking.service.price))}
                  </motion.div>
                )}

                <motion.div variants={stagger} className="flex flex-col gap-2.5">
                  <motion.div variants={fadeUp}
                    onClick={() => { setBooking(b => ({ ...b, staff: null })); setStep("datetime"); }}
                    className="flex items-center gap-4 bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all active:scale-[0.99]"
                    style={{ borderColor: !booking.staff ? p : "#E5E7EB" }}>
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl shrink-0">👥</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">כל מטפל פנוי</p>
                      <p className="text-xs text-gray-400 mt-0.5">הזמן הכי מוקדם שפנוי</p>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{ borderColor: !booking.staff ? p : "#D1D5DB", background: !booking.staff ? p : "transparent" }}>
                      {!booking.staff && <Check size={13} color="#fff" />}
                    </div>
                  </motion.div>

                  {staff.map(s => (
                    <motion.div key={s.id} variants={fadeUp}
                      onClick={() => { setBooking(b => ({ ...b, staff: s })); setStep("datetime"); }}
                      className="flex items-center gap-4 bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all active:scale-[0.99]"
                      style={{ borderColor: booking.staff?.id === s.id ? p : "#E5E7EB" }}>
                      <Avatar name={s.name} size={56} color={s.calendarColor} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900">{s.name}</p>
                        {s.role && <p className="text-xs font-semibold mt-0.5" style={{ color: p }}>{s.role}</p>}
                        {s.bio && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.bio}</p>}
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{ borderColor: booking.staff?.id === s.id ? p : "#D1D5DB", background: booking.staff?.id === s.id ? p : "transparent" }}>
                        {booking.staff?.id === s.id && <Check size={13} color="#fff" />}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* ════════════════════════════════════
              DATETIME
          ════════════════════════════════════ */}
          {step === "datetime" && (
            <div className="px-4 py-6 flex-1">
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">בחר מועד</h2>
                  <p className="text-sm text-gray-400 mb-5">מתי יתאים לך?</p>
                </motion.div>

                <motion.div variants={fadeUp}
                  className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 mb-6">
                  {days.map(d => {
                    const iso = format(d, "yyyy-MM-dd");
                    const sel = iso === booking.date;
                    return (
                      <button key={iso}
                        onClick={() => { setBooking(b => ({ ...b, date: iso, time: "" })); loadSlots(iso, booking.staff?.id ?? null); }}
                        className="flex flex-col items-center justify-center w-[60px] h-[72px] rounded-2xl border-2 shrink-0 transition-all duration-200 active:scale-95"
                        style={{ background: sel ? p : "#fff", borderColor: sel ? p : "#E5E7EB", color: sel ? "#fff" : "#374151" }}>
                        <span className="text-[10px] font-bold uppercase tracking-wide">{format(d, "EEE", { locale: he })}</span>
                        <span className="text-xl font-black mt-0.5">{format(d, "d")}</span>
                        <span className="text-[9px] opacity-70">{format(d, "MMM", { locale: he })}</span>
                      </button>
                    );
                  })}
                </motion.div>

                {booking.date && (
                  <motion.div variants={fadeUp}>
                    <p className="text-sm font-bold text-gray-700 mb-3">שעות פנויות</p>
                    {loadingSlots ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-11 skeleton rounded-xl" />)}
                      </div>
                    ) : slots.filter(s => s.available).length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                        <p className="font-bold text-gray-600">אין שעות פנויות</p>
                        <p className="text-sm text-gray-400 mt-1">בחר תאריך אחר</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.filter(s => s.available).map(s => (
                          <button key={s.time}
                            onClick={() => { setBooking(b => ({ ...b, time: s.time })); setStep("details"); }}
                            className="h-12 rounded-xl border-2 text-sm font-bold transition-all duration-150 active:scale-95"
                            style={booking.time === s.time
                              ? { background: p, borderColor: p, color: "#fff" }
                              : { background: "#fff", borderColor: "#E5E7EB", color: "#374151" }}>
                            {s.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* ════════════════════════════════════
              DETAILS
          ════════════════════════════════════ */}
          {step === "details" && (
            <div className="px-4 py-6 flex-1">
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <h2 className="text-2xl font-black text-gray-900 mb-1">הפרטים שלך</h2>
                  <p className="text-sm text-gray-400 mb-5">נשלח אליך אישור לטלפון</p>
                </motion.div>

                {/* Booking summary card */}
                <motion.div variants={fadeUp}
                  className="rounded-2xl border p-5 mb-6 space-y-3"
                  style={{ background: p + "08", borderColor: p + "25" }}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">סיכום</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">שירות</span>
                    <span className="font-bold text-gray-900 text-sm">{booking.service?.name}</span>
                  </div>
                  {booking.staff && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">מטפל</span>
                      <span className="font-bold text-gray-900 text-sm">{booking.staff.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">מועד</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {booking.date && format(new Date(booking.date + "T12:00:00"), "EEEE d MMMM", { locale: he })} · {booking.time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: p + "20" }}>
                    <span className="font-bold text-gray-700">סה"כ</span>
                    <span className="text-2xl font-black" style={{ color: p }}>
                      {formatPrice(parseFloat(booking.service?.price ?? "0"))}
                    </span>
                  </div>
                </motion.div>

                <motion.div variants={stagger} className="flex flex-col gap-4">
                  <motion.div variants={fadeUp}>
                    <Input label="שם מלא" placeholder="ישראל ישראלי" required
                      value={booking.name} onChange={e => setBooking(b => ({ ...b, name: e.target.value }))} />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <Input label="טלפון" type="tel" placeholder="050-0000000" required dir="ltr"
                      value={booking.phone} onChange={e => setBooking(b => ({ ...b, phone: e.target.value }))} />
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">הערה (אופציונלי)</label>
                    <textarea placeholder="בקשה מיוחדת..." rows={3}
                      value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none transition-all" />
                  </motion.div>
                </motion.div>

                <motion.div variants={fadeUp} className="mt-6">
                  <button onClick={handleConfirm} disabled={loading}
                    className="w-full h-14 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ background: p }}>
                    {loading
                      ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      : <><Check size={20} strokeWidth={2.5} />אישור קביעת תור</>
                    }
                  </button>
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* ════════════════════════════════════
              SUCCESS
          ════════════════════════════════════ */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center min-h-[85dvh] px-6 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="w-28 h-28 rounded-full flex items-center justify-center mb-6"
                style={{ background: "#DCFCE7" }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-green-glow"
                  style={{ background: "#22C55E" }}>
                  <Check size={40} color="#fff" strokeWidth={2.5} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-3xl font-black text-gray-900 mb-2">התור נקבע!</h2>
                <p className="text-lg font-bold text-gray-700 mb-1">{booking.service?.name}</p>
                {booking.date && (
                  <p className="text-sm text-gray-500 mb-0.5">
                    {format(new Date(booking.date + "T12:00:00"), "EEEE, d MMMM", { locale: he })} · {booking.time}
                  </p>
                )}
                {booking.staff && <p className="text-sm text-gray-400 mb-6">עם {booking.staff.name}</p>}

                <div className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-100 max-w-xs mx-auto">
                  <p className="text-sm font-semibold text-green-700">📱 אישור נשלח ל-{booking.phone}</p>
                </div>

                {tenant.whatsapp && (
                  <motion.a
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(`שלום! קבעתי תור ל${booking.service?.name} ב${booking.date} בשעה ${booking.time}`)}`}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white mb-3 transition-all"
                    style={{ background: "#22C55E" }}>
                    <MessageCircle size={18} />שלח לווטסאפ
                  </motion.a>
                )}

                <button onClick={() => { setStep("home"); setBooking({ service: null, staff: null, date: "", time: "", name: "", phone: "", notes: "" }); }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors mt-2">
                  חזרה לעמוד העסק
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Sticky CTA on home ── */}
      {step === "home" && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-t border-gray-100 px-5 py-4">
          <motion.button
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full h-14 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 shadow-lg"
            style={{ background: p }}>
            קבע תור עכשיו
            <ArrowLeft size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
