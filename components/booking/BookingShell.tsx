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
import { formatPrice, formatDuration } from "@/lib/utils/format";
import type { Tenant, Service, Staff, BusinessHours } from "@/lib/db/schema";

type Step = "home" | "staff" | "datetime" | "details" | "success";

interface BookingState {
  service: Service | null;
  staff:   Staff | null;
  date:    string;
  time:    string;
  name:    string;
  phone:   string;
  notes:   string;
}

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

function Avatar({ name, size = 48, color }: { name: string; size?: number; color?: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <div className="rounded-full flex items-center justify-center text-white font-black shrink-0"
      style={{ width: size, height: size, background: color ?? "#0284C7", fontSize: size * 0.35 }}>
      {initials}
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
    if (idx > 0) setStep(flow[idx - 1] as Step);
  };

  const STEP_LABELS: Record<Step, string> = {
    home: "", staff: "בחירת מטפל",
    datetime: "בחירת מועד", details: "פרטים אישיים", success: "",
  };

  const isInFlow = !["home", "success"].includes(step);

  /* ── Progress bar ── */
  const FLOW_STEPS: Step[] = ["staff", "datetime", "details"];
  const stepIdx = FLOW_STEPS.indexOf(step);

  return (
    <div className="min-h-dvh flex flex-col bg-[#F5F7FA]">

      {/* ── In-flow top bar ── */}
      <AnimatePresence>
        {isInFlow && (
          <motion.div
            initial={{ y: -56, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }} transition={{ duration: 0.3, ease }}
            className="bg-white border-b border-gray-100 sticky top-0 z-30">
            <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
              <button onClick={goBack}
                className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0">
                <ChevronRight size={18} className="text-gray-500" />
              </button>
              <div className="flex-1">
                <p className="font-black text-sm text-gray-900">{STEP_LABELS[step]}</p>
                <p className="text-xs text-gray-400">{tenant.name}</p>
              </div>
              <button onClick={() => setStep("home")}
                className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            {/* Progress */}
            <div className="flex px-4 pb-3 gap-1.5 max-w-lg mx-auto">
              {FLOW_STEPS.map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
                  style={{ background: i <= stepIdx ? p : "#E5E7EB" }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2, ease }}
          className="flex-1 flex flex-col">

          {/* ════════════════ HOME ════════════════ */}
          {step === "home" && (
            <div className="flex-1 pb-28">

              {/* Hero */}
              <div className="relative" style={{ minHeight: 280 }}>
                {tenant.coverUrl
                  ? <img src={tenant.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${p} 0%, ${p}BB 60%, ${p}88 100%)` }}>
                      {/* Noise texture */}
                      <div className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundSize: "180px" }} />
                      {/* Dot grid */}
                      <div className="absolute inset-0"
                        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                      {/* Glow circles */}
                      <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30"
                        style={{ background: "rgba(255,255,255,0.3)", filter: "blur(64px)", transform: "translate(-40%, -40%)" }} />
                      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-20"
                        style={{ background: "rgba(255,255,255,0.4)", filter: "blur(48px)", transform: "translate(30%, 30%)" }} />
                    </div>
                }
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)" }} />

                <motion.div variants={stagger} initial="hidden" animate="show"
                  className="relative z-10 px-5 pt-12 pb-8 flex flex-col max-w-lg mx-auto w-full">

                  {/* Logo */}
                  <motion.div variants={fadeUp} className="mb-5">
                    <div className="w-18 h-18 rounded-3xl overflow-hidden shadow-xl border-2 border-white/20 flex items-center justify-center font-black text-2xl text-white"
                      style={{ width: 72, height: 72, background: tenant.logoUrl ? "transparent" : "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)" }}>
                      {tenant.logoUrl
                        ? <img src={tenant.logoUrl} alt="" className="w-full h-full object-cover" />
                        : tenant.name[0]
                      }
                    </div>
                  </motion.div>

                  {/* Name */}
                  <motion.h1 variants={fadeUp}
                    className="text-4xl font-black text-white leading-none tracking-tight mb-2">
                    {tenant.name}
                  </motion.h1>

                  <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap mb-5">
                    {tenant.category && <span className="text-base font-bold text-white/75">{tenant.category}</span>}
                    {tenant.address && (
                      <span className="flex items-center gap-1 text-sm text-white/55">
                        <MapPin size={11} />{tenant.address}
                      </span>
                    )}
                  </motion.div>

                  {/* Contact pills */}
                  <motion.div variants={fadeUp} className="flex gap-2 flex-wrap">
                    {tenant.whatsapp && (
                      <a href={`https://wa.me/${tenant.whatsapp}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-bold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                        <MessageCircle size={14} />ווטסאפ
                      </a>
                    )}
                    {tenant.phone && (
                      <a href={`tel:${tenant.phone}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-bold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                        <Phone size={14} />{tenant.phone}
                      </a>
                    )}
                    {tenant.instagram && (
                      <a href={`https://instagram.com/${tenant.instagram}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl text-white text-sm font-bold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                        <Instagram size={14} />
                      </a>
                    )}
                  </motion.div>
                </motion.div>
              </div>

              {/* Description */}
              {tenant.description && (
                <div className="bg-white border-b border-gray-100 px-5 py-4 max-w-lg mx-auto w-full">
                  <p className="text-sm text-gray-600 leading-relaxed">{tenant.description}</p>
                </div>
              )}

              {/* Services */}
              <div className="px-4 pt-7 max-w-lg mx-auto w-full">
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="text-2xl font-black text-gray-900">השירותים שלנו</h2>
                  <span className="text-sm font-medium text-gray-400">{services.length} זמינים</span>
                </div>

                <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
                  {services.map((s) => (
                    <motion.div key={s.id} variants={fadeUp}>
                      <button
                        onClick={() => { setBooking(b => ({ ...b, service: s })); setStep("staff"); }}
                        className="w-full text-right bg-white rounded-3xl border border-gray-100 p-5 cursor-pointer transition-all duration-200 active:scale-[0.99] group"
                        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-lg font-black text-gray-900">{s.name}</span>
                              {s.isPopular && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full"
                                  style={{ background: "#FEF3C7", color: "#D97706" }}>
                                  <Star size={8} fill="currentColor" />פופולרי
                                </span>
                              )}
                            </div>
                            {s.description && (
                              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{s.description}</p>
                            )}
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
                              <Clock size={10} />{formatDuration(s.durationMinutes)}
                            </span>
                          </div>

                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <span className="text-3xl font-black leading-none" style={{ color: p }}>
                              {formatPrice(parseFloat(s.price))}
                            </span>
                            <div className="flex items-center gap-1 text-sm font-black transition-transform group-hover:-translate-x-1"
                              style={{ color: p }}>
                              הזמן <ChevronLeft size={16} strokeWidth={2.5} />
                            </div>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}

          {/* ════════════════ STAFF ════════════════ */}
          {step === "staff" && (
            <div className="px-4 py-7 flex-1 max-w-lg mx-auto w-full">
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp} className="mb-6">
                  <h2 className="text-3xl font-black text-gray-900 mb-1">עם מי תרצה?</h2>
                  <p className="text-sm text-gray-400">בחר מטפל או קבע עם הראשון שפנוי</p>
                </motion.div>

                {booking.service && (
                  <motion.div variants={fadeUp}
                    className="flex items-center gap-3 mb-6 px-4 py-3 rounded-2xl text-sm font-bold"
                    style={{ background: p + "10", color: p, border: `1px solid ${p}20` }}>
                    <span className="font-black">{booking.service.name}</span>
                    <span className="text-xs opacity-70">·</span>
                    <span className="opacity-70">{formatDuration(booking.service.durationMinutes)}</span>
                    <span className="text-xs opacity-70">·</span>
                    <span>{formatPrice(parseFloat(booking.service.price))}</span>
                  </motion.div>
                )}

                <motion.div variants={stagger} className="flex flex-col gap-3">
                  {/* Any available */}
                  <motion.div variants={fadeUp}
                    onClick={() => { setBooking(b => ({ ...b, staff: null })); setStep("datetime"); }}
                    className="flex items-center gap-4 bg-white rounded-3xl p-5 cursor-pointer transition-all active:scale-[0.99] border-2"
                    style={{ borderColor: !booking.staff ? p : "transparent", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl shrink-0">👥</div>
                    <div className="flex-1">
                      <p className="font-black text-gray-900 text-base">כל מטפל פנוי</p>
                      <p className="text-sm text-gray-400 mt-0.5">הזמן הכי מוקדם שפנוי</p>
                    </div>
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{ borderColor: !booking.staff ? p : "#D1D5DB", background: !booking.staff ? p : "transparent" }}>
                      {!booking.staff && <Check size={13} color="#fff" strokeWidth={3} />}
                    </div>
                  </motion.div>

                  {staff.map(s => (
                    <motion.div key={s.id} variants={fadeUp}
                      onClick={() => { setBooking(b => ({ ...b, staff: s })); setStep("datetime"); }}
                      className="flex items-center gap-4 bg-white rounded-3xl p-5 cursor-pointer transition-all active:scale-[0.99] border-2"
                      style={{ borderColor: booking.staff?.id === s.id ? p : "transparent", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                      <Avatar name={s.name} size={56} color={s.calendarColor} />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-base">{s.name}</p>
                        {s.role && <p className="text-sm font-bold mt-0.5" style={{ color: p }}>{s.role}</p>}
                        {s.bio && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.bio}</p>}
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{ borderColor: booking.staff?.id === s.id ? p : "#D1D5DB", background: booking.staff?.id === s.id ? p : "transparent" }}>
                        {booking.staff?.id === s.id && <Check size={13} color="#fff" strokeWidth={3} />}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* ════════════════ DATETIME ════════════════ */}
          {step === "datetime" && (
            <div className="px-4 py-7 flex-1 max-w-lg mx-auto w-full">
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp} className="mb-6">
                  <h2 className="text-3xl font-black text-gray-900 mb-1">בחר מועד</h2>
                  <p className="text-sm text-gray-400">מתי יתאים לך?</p>
                </motion.div>

                {/* Date scroller */}
                <motion.div variants={fadeUp}
                  className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3 mb-6 -mx-4 px-4">
                  {days.map(d => {
                    const iso = format(d, "yyyy-MM-dd");
                    const sel = iso === booking.date;
                    return (
                      <button key={iso}
                        onClick={() => { setBooking(b => ({ ...b, date: iso, time: "" })); loadSlots(iso, booking.staff?.id ?? null); }}
                        className="flex flex-col items-center justify-center shrink-0 rounded-2xl border-2 transition-all duration-200 active:scale-95"
                        style={{
                          width: 62, height: 76,
                          background:   sel ? p          : "#fff",
                          borderColor:  sel ? p          : "#EBEBEB",
                          color:        sel ? "#fff"     : "#374151",
                        }}>
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                          {format(d, "EEE", { locale: he })}
                        </span>
                        <span className="text-2xl font-black mt-0.5 leading-none">
                          {format(d, "d")}
                        </span>
                        <span className="text-[9px] opacity-60 mt-0.5">
                          {format(d, "MMM", { locale: he })}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>

                {booking.date && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease }}>
                    <p className="text-sm font-black text-gray-700 mb-3">שעות פנויות</p>
                    {loadingSlots ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="h-12 skeleton rounded-2xl" />
                        ))}
                      </div>
                    ) : slots.filter(s => s.available).length === 0 ? (
                      <div className="text-center py-14 bg-white rounded-3xl border border-gray-100">
                        <p className="font-black text-gray-600">אין שעות פנויות</p>
                        <p className="text-sm text-gray-400 mt-1">בחר תאריך אחר</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.filter(s => s.available).map(s => {
                          const sel = booking.time === s.time;
                          return (
                            <button key={s.time}
                              onClick={() => { setBooking(b => ({ ...b, time: s.time })); setStep("details"); }}
                              className="h-12 rounded-2xl border-2 text-sm font-black transition-all duration-150 active:scale-95"
                              style={sel
                                ? { background: p, borderColor: p, color: "#fff" }
                                : { background: "#fff", borderColor: "#EBEBEB", color: "#374151" }}>
                              {s.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* ════════════════ DETAILS ════════════════ */}
          {step === "details" && (
            <div className="px-4 py-7 flex-1 max-w-lg mx-auto w-full">
              <motion.div variants={stagger} initial="hidden" animate="show">
                <motion.div variants={fadeUp} className="mb-6">
                  <h2 className="text-3xl font-black text-gray-900 mb-1">הפרטים שלך</h2>
                  <p className="text-sm text-gray-400">נשלח אליך אישור לטלפון</p>
                </motion.div>

                {/* Summary card */}
                <motion.div variants={fadeUp}
                  className="rounded-3xl p-5 mb-6"
                  style={{ background: p + "08", border: `1.5px solid ${p}18` }}>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">סיכום ההזמנה</p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">שירות</span>
                      <span className="font-black text-gray-900">{booking.service?.name}</span>
                    </div>
                    {booking.staff && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 font-medium">מטפל</span>
                        <span className="font-black text-gray-900">{booking.staff.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 font-medium">מועד</span>
                      <span className="font-black text-gray-900 text-sm">
                        {booking.date && format(new Date(booking.date + "T12:00:00"), "EEEE d MMMM", { locale: he })} · {booking.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-dashed" style={{ borderColor: p + "30" }}>
                      <span className="font-black text-gray-700">סה״כ</span>
                      <span className="text-3xl font-black" style={{ color: p }}>
                        {formatPrice(parseFloat(booking.service?.price ?? "0"))}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Form */}
                <motion.div variants={stagger} className="flex flex-col gap-4 mb-6">
                  {[
                    { label: "שם מלא", placeholder: "ישראל ישראלי", type: "text", key: "name" as const, dir: "rtl" },
                    { label: "טלפון",  placeholder: "050-0000000",  type: "tel",  key: "phone" as const, dir: "ltr" },
                  ].map(f => (
                    <motion.div key={f.key} variants={fadeUp}>
                      <label className="text-sm font-black text-gray-700 block mb-2">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} dir={f.dir} required
                        value={booking[f.key]} onChange={e => setBooking(b => ({ ...b, [f.key]: e.target.value }))}
                        className="w-full h-13 px-4 rounded-2xl border-2 text-sm text-gray-900 placeholder-gray-300 outline-none transition-all font-medium bg-white"
                        style={{ height: 52, borderColor: "#EBEBEB" }}
                        onFocus={e => { e.target.style.borderColor = p; e.target.style.boxShadow = `0 0 0 4px ${p}15`; }}
                        onBlur={e => { e.target.style.borderColor = "#EBEBEB"; e.target.style.boxShadow = "none"; }} />
                    </motion.div>
                  ))}
                  <motion.div variants={fadeUp}>
                    <label className="text-sm font-black text-gray-700 block mb-2">הערה (אופציונלי)</label>
                    <textarea placeholder="בקשה מיוחדת..." rows={3}
                      value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border-2 text-sm text-gray-900 placeholder-gray-300 outline-none resize-none transition-all font-medium bg-white"
                      style={{ borderColor: "#EBEBEB" }}
                      onFocus={e => { e.target.style.borderColor = p; e.target.style.boxShadow = `0 0 0 4px ${p}15`; }}
                      onBlur={e => { e.target.style.borderColor = "#EBEBEB"; e.target.style.boxShadow = "none"; }} />
                  </motion.div>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <motion.button onClick={handleConfirm} disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-white font-black text-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 rounded-3xl"
                    style={{ height: 58, background: p }}>
                    {loading
                      ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      : <><Check size={22} strokeWidth={3} />אישור קביעת תור</>
                    }
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* ════════════════ SUCCESS ════════════════ */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center min-h-[88dvh] px-6 text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.1 }}
                className="w-32 h-32 rounded-full flex items-center justify-center mb-8"
                style={{ background: "#DCFCE7" }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: "#22C55E" }}>
                  <Check size={44} color="#fff" strokeWidth={3} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <h2 className="text-4xl font-black text-gray-900 mb-2">התור נקבע!</h2>
                <p className="text-xl font-bold text-gray-600 mb-1">{booking.service?.name}</p>
                {booking.date && (
                  <p className="text-base text-gray-500 mb-1">
                    {format(new Date(booking.date + "T12:00:00"), "EEEE, d MMMM", { locale: he })} · {booking.time}
                  </p>
                )}
                {booking.staff && <p className="text-sm text-gray-400 mb-8">עם {booking.staff.name}</p>}
                {!booking.staff && <div className="mb-8" />}

                <div className="bg-green-50 rounded-3xl p-5 mb-6 border border-green-100 max-w-xs mx-auto">
                  <p className="text-sm font-bold text-green-700">📱 אישור יישלח ל-{booking.phone}</p>
                </div>

                {tenant.whatsapp && (
                  <motion.a whileTap={{ scale: 0.97 }}
                    href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(`שלום! קבעתי תור ל${booking.service?.name} ב${booking.date} בשעה ${booking.time}`)}`}
                    className="flex items-center justify-center gap-2 px-8 rounded-3xl font-black text-white mb-4 transition-all w-full max-w-xs mx-auto"
                    style={{ height: 52, background: "#22C55E" }}>
                    <MessageCircle size={18} />שלח לווטסאפ
                  </motion.a>
                )}

                <button onClick={() => { setStep("home"); setBooking({ service: null, staff: null, date: "", time: "", name: "", phone: "", notes: "" }); }}
                  className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mt-2">
                  חזרה לעמוד העסק
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky CTA on home */}
      {step === "home" && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-4"
          style={{ background: "linear-gradient(to top, rgba(245,247,250,1) 60%, rgba(245,247,250,0))" }}>
          <motion.button
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5, ease }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full max-w-lg mx-auto block text-white font-black text-lg flex items-center justify-center gap-3 rounded-3xl shadow-xl transition-all"
            style={{ height: 60, background: p, boxShadow: `0 8px 32px ${p}50` }}>
            קבע תור עכשיו
            <ArrowLeft size={22} strokeWidth={2.5} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
