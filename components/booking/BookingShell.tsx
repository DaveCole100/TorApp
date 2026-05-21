"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, X, Check, Clock, MapPin, Phone,
  MessageCircle, Instagram, ChevronLeft, Star, ArrowLeft,
  Flame, Users, Shield,
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
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
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
  const [todayCount,   setTodayCount]   = useState<number | null>(null);
  const [fromInstagram, setFromInstagram] = useState(false);

  useEffect(() => {
    // Detect Instagram traffic
    const params = new URLSearchParams(window.location.search);
    if (params.get("utm_source") === "instagram" || params.get("ref") === "instagram") {
      setFromInstagram(true);
    }
    // Load today's booking count
    fetch(`/api/booking/stats?slug=${tenant.slug}`)
      .then(r => r.json())
      .then(d => setTodayCount(d.todayCount ?? 0))
      .catch(() => {});
  }, [tenant.slug]);

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
        source:          fromInstagram ? "instagram" : "online",
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

  const isInFlow  = !["home", "success"].includes(step);
  const FLOW_STEPS: Step[] = ["staff", "datetime", "details"];
  const stepIdx   = FLOW_STEPS.indexOf(step);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#F4F6F9" }}>

      {/* ── Instagram welcome banner ── */}
      <AnimatePresence>
        {fromInstagram && step === "home" && (
          <motion.div
            initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.4, ease }}
            className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(90deg, #833AB4, #E1306C, #F77737)" }}>
            <Instagram size={15} />
            הגעת מאינסטגרם — ברוכה הבאה!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── In-flow top bar ── */}
      <AnimatePresence>
        {isInFlow && (
          <motion.div
            initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }} transition={{ duration: 0.28, ease }}
            className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
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
          initial={{ opacity: 0, x: step === "home" ? 0 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.22, ease }}
          className="flex-1 flex flex-col">

          {/* ════════════════ HOME ════════════════ */}
          {step === "home" && (
            <div className="flex-1 pb-28">

              {/* ── Hero ── */}
              <div className="relative overflow-hidden" style={{ minHeight: 300 }}>
                {tenant.coverUrl
                  ? <img src={tenant.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: `linear-gradient(155deg, ${p} 0%, ${p}D0 100%)` }}>
                      {/* Noise */}
                      <div className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "160px" }} />
                      {/* Dots */}
                      <div className="absolute inset-0"
                        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
                      {/* Glow blobs */}
                      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-25"
                        style={{ background: "rgba(255,255,255,0.5)", filter: "blur(60px)" }} />
                      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-15"
                        style={{ background: "rgba(255,255,255,0.4)", filter: "blur(48px)", transform: "translate(-30%, 30%)" }} />
                    </div>
                }
                {/* Bottom fade */}
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)" }} />

                <motion.div variants={stagger} initial="hidden" animate="show"
                  className="relative z-10 px-5 pt-10 pb-8 flex flex-col max-w-lg mx-auto w-full">

                  {/* Logo */}
                  <motion.div variants={fadeUp} className="mb-5">
                    <div className="w-[72px] h-[72px] rounded-[22px] overflow-hidden shadow-2xl border-2 border-white/25 flex items-center justify-center font-black text-2xl text-white"
                      style={{ background: tenant.logoUrl ? "transparent" : "rgba(255,255,255,0.2)", backdropFilter: "blur(12px)" }}>
                      {tenant.logoUrl
                        ? <img src={tenant.logoUrl} alt="" className="w-full h-full object-cover" />
                        : tenant.name[0]}
                    </div>
                  </motion.div>

                  {/* Name */}
                  <motion.h1 variants={fadeUp}
                    className="text-[2.2rem] font-black text-white leading-none tracking-tight mb-2">
                    {tenant.name}
                  </motion.h1>

                  <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap mb-5">
                    {tenant.category && <span className="text-sm font-bold text-white/75">{tenant.category}</span>}
                    {tenant.address && (
                      <span className="flex items-center gap-1 text-xs text-white/55">
                        <MapPin size={10} />{tenant.address}
                      </span>
                    )}
                  </motion.div>

                  {/* Social proof badge */}
                  {todayCount !== null && todayCount > 0 && (
                    <motion.div variants={fadeUp}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-bold text-white mb-5 self-start"
                      style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                      <Flame size={14} className="text-orange-300" />
                      {todayCount} לקוחות קבעו תור היום
                    </motion.div>
                  )}

                  {/* Contact pills */}
                  <motion.div variants={fadeUp} className="flex gap-2 flex-wrap">
                    {tenant.whatsapp && (
                      <a href={`https://wa.me/${tenant.whatsapp}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-bold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)" }}>
                        <MessageCircle size={14} />ווטסאפ
                      </a>
                    )}
                    {tenant.phone && (
                      <a href={`tel:${tenant.phone}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-white text-sm font-bold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)" }}>
                        <Phone size={14} />{tenant.phone}
                      </a>
                    )}
                    {tenant.instagram && (
                      <a href={`https://instagram.com/${tenant.instagram}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-2xl text-white text-sm font-bold transition-all active:scale-95"
                        style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)" }}>
                        <Instagram size={14} />
                      </a>
                    )}
                  </motion.div>
                </motion.div>
              </div>

              {/* Description */}
              {tenant.description && (
                <div className="bg-white border-b border-gray-100 px-5 py-4">
                  <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">{tenant.description}</p>
                </div>
              )}

              {/* Trust badges */}
              <div className="px-4 pt-5 pb-2 max-w-lg mx-auto w-full">
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 border border-gray-100 shrink-0">
                    <Shield size={14} style={{ color: p }} />
                    <span className="text-xs font-bold text-gray-600">הזמנה מאובטחת</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 border border-gray-100 shrink-0">
                    <Users size={14} style={{ color: p }} />
                    <span className="text-xs font-bold text-gray-600">ביטול חינם</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 border border-gray-100 shrink-0">
                    <Check size={14} className="text-green-500" />
                    <span className="text-xs font-bold text-gray-600">אישור מיידי</span>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div id="services" className="px-4 pt-6 max-w-lg mx-auto w-full">
                <div className="flex items-baseline justify-between mb-5">
                  <h2 className="text-2xl font-black text-gray-900">השירותים שלנו</h2>
                  <span className="text-sm font-medium text-gray-400">{services.length} שירותים</span>
                </div>

                <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-3">
                  {services.map((s) => (
                    <motion.div key={s.id} variants={fadeUp}>
                      <button
                        onClick={() => { setBooking(b => ({ ...b, service: s })); setStep("staff"); }}
                        className="w-full text-right bg-white rounded-3xl p-5 cursor-pointer transition-all duration-200 active:scale-[0.99] group border border-gray-100"
                        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-base font-black text-gray-900">{s.name}</span>
                              {s.isPopular && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
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
                            <div className="flex items-center gap-1 text-sm font-black group-hover:-translate-x-1 transition-transform"
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
                    className="flex items-center gap-2 mb-6 px-4 py-3 rounded-2xl text-sm font-bold"
                    style={{ background: p + "10", color: p, border: `1px solid ${p}20` }}>
                    <span className="font-black">{booking.service.name}</span>
                    <span className="opacity-50">·</span>
                    <span className="opacity-70">{formatDuration(booking.service.durationMinutes)}</span>
                    <span className="opacity-50">·</span>
                    <span>{formatPrice(parseFloat(booking.service.price))}</span>
                  </motion.div>
                )}

                <motion.div variants={stagger} className="flex flex-col gap-3">
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

                <motion.div variants={fadeUp} className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3 mb-6 -mx-4 px-4">
                  {days.map(d => {
                    const iso = format(d, "yyyy-MM-dd");
                    const sel = iso === booking.date;
                    return (
                      <button key={iso}
                        onClick={() => { setBooking(b => ({ ...b, date: iso, time: "" })); loadSlots(iso, booking.staff?.id ?? null); }}
                        className="flex flex-col items-center justify-center shrink-0 rounded-2xl border-2 transition-all duration-200 active:scale-95"
                        style={{ width: 62, height: 76, background: sel ? p : "#fff", borderColor: sel ? p : "#E8E8E8", color: sel ? "#fff" : "#374151" }}>
                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{format(d, "EEE", { locale: he })}</span>
                        <span className="text-2xl font-black mt-0.5 leading-none">{format(d, "d")}</span>
                        <span className="text-[9px] opacity-60 mt-0.5">{format(d, "MMM", { locale: he })}</span>
                      </button>
                    );
                  })}
                </motion.div>

                {booking.date && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
                    <p className="text-sm font-black text-gray-700 mb-3">שעות פנויות</p>
                    {loadingSlots ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-12 skeleton rounded-2xl" />)}
                      </div>
                    ) : slots.filter(s => s.available).length === 0 ? (
                      <div className="text-center py-14 bg-white rounded-3xl border border-gray-100">
                        <p className="font-black text-gray-600">אין שעות פנויות</p>
                        <p className="text-sm text-gray-400 mt-1">בחר תאריך אחר</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.filter(s => s.available).map((s, idx) => {
                          const sel      = booking.time === s.time;
                          const hot      = idx < 2 && slots.filter(x => x.available).length <= 4;
                          return (
                            <button key={s.time}
                              onClick={() => { setBooking(b => ({ ...b, time: s.time })); setStep("details"); }}
                              className="relative h-12 rounded-2xl border-2 text-sm font-black transition-all duration-150 active:scale-95"
                              style={sel
                                ? { background: p, borderColor: p, color: "#fff" }
                                : { background: "#fff", borderColor: "#E8E8E8", color: "#374151" }}>
                              {hot && !sel && (
                                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-400 rounded-full border-2 border-white" />
                              )}
                              {s.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* Urgency hint */}
                    {slots.filter(s => s.available).length > 0 && slots.filter(s => s.available).length <= 4 && (
                      <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                        className="flex items-center gap-1.5 text-xs font-bold text-orange-500 mt-3">
                        <Flame size={12} />
                        נותרו {slots.filter(s => s.available).length} מקומות בלבד ליום זה
                      </motion.p>
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

                {/* Summary */}
                <motion.div variants={fadeUp}
                  className="rounded-3xl p-5 mb-6"
                  style={{ background: p + "09", border: `1.5px solid ${p}20` }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: p }}>סיכום ההזמנה</p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between"><span className="text-sm text-gray-500">שירות</span><span className="font-black text-gray-900">{booking.service?.name}</span></div>
                    {booking.staff && <div className="flex justify-between"><span className="text-sm text-gray-500">מטפל</span><span className="font-black text-gray-900">{booking.staff.name}</span></div>}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">מועד</span>
                      <span className="font-black text-gray-900 text-sm">
                        {booking.date && format(new Date(booking.date + "T12:00:00"), "EEE d MMM", { locale: he })} · {booking.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-dashed" style={{ borderColor: p + "25" }}>
                      <span className="font-black text-gray-700">סה״כ</span>
                      <span className="text-3xl font-black" style={{ color: p }}>{formatPrice(parseFloat(booking.service?.price ?? "0"))}</span>
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
                        className="w-full px-4 rounded-2xl border-2 text-sm text-gray-900 placeholder-gray-300 outline-none transition-all font-medium bg-white"
                        style={{ height: 52, borderColor: "#E8E8E8" }}
                        onFocus={e => { e.target.style.borderColor = p; e.target.style.boxShadow = `0 0 0 4px ${p}12`; }}
                        onBlur={e => { e.target.style.borderColor = "#E8E8E8"; e.target.style.boxShadow = "none"; }} />
                    </motion.div>
                  ))}
                  <motion.div variants={fadeUp}>
                    <label className="text-sm font-black text-gray-700 block mb-2">הערה (אופציונלי)</label>
                    <textarea placeholder="בקשה מיוחדת..." rows={3}
                      value={booking.notes} onChange={e => setBooking(b => ({ ...b, notes: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border-2 text-sm text-gray-900 placeholder-gray-300 outline-none resize-none transition-all font-medium bg-white"
                      style={{ borderColor: "#E8E8E8" }}
                      onFocus={e => { e.target.style.borderColor = p; e.target.style.boxShadow = `0 0 0 4px ${p}12`; }}
                      onBlur={e => { e.target.style.borderColor = "#E8E8E8"; e.target.style.boxShadow = "none"; }} />
                  </motion.div>
                </motion.div>

                <motion.div variants={fadeUp}>
                  <motion.button onClick={handleConfirm} disabled={loading} whileTap={{ scale: 0.98 }}
                    className="w-full text-white font-black text-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 rounded-3xl"
                    style={{ height: 58, background: p, boxShadow: `0 8px 24px ${p}40` }}>
                    {loading
                      ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
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
                transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
                className="w-32 h-32 rounded-full flex items-center justify-center mb-8"
                style={{ background: "#DCFCE7" }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "#22C55E" }}>
                  <Check size={44} color="#fff" strokeWidth={3} />
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-4xl font-black text-gray-900 mb-2">התור נקבע!</h2>
                <p className="text-xl font-bold text-gray-600 mb-1">{booking.service?.name}</p>
                {booking.date && (
                  <p className="text-base text-gray-500 mb-1">
                    {format(new Date(booking.date + "T12:00:00"), "EEEE, d MMMM", { locale: he })} · {booking.time}
                  </p>
                )}
                {booking.staff && <p className="text-sm text-gray-400 mb-6">עם {booking.staff.name}</p>}
                {!booking.staff && <div className="mb-6" />}

                <div className="bg-green-50 rounded-3xl p-5 mb-6 border border-green-100 max-w-xs mx-auto">
                  <p className="text-sm font-bold text-green-700">📱 אישור יישלח ל-{booking.phone}</p>
                </div>

                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  {tenant.whatsapp && (
                    <motion.a whileTap={{ scale: 0.97 }}
                      href={`https://wa.me/${tenant.whatsapp}?text=${encodeURIComponent(`שלום! קבעתי תור ל${booking.service?.name} ב${booking.date} בשעה ${booking.time}`)}`}
                      className="flex items-center justify-center gap-2 w-full rounded-3xl font-black text-white transition-all"
                      style={{ height: 52, background: "#22C55E" }}>
                      <MessageCircle size={18} />שלח אישור בווטסאפ
                    </motion.a>
                  )}
                  {tenant.instagram && (
                    <a href={`https://instagram.com/${tenant.instagram}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-3xl font-bold text-white transition-all text-sm"
                      style={{ height: 44, background: "linear-gradient(90deg, #833AB4, #E1306C, #F77737)" }}>
                      <Instagram size={16} />עקבי באינסטגרם
                    </a>
                  )}
                  <button onClick={() => { setStep("home"); setBooking({ service: null, staff: null, date: "", time: "", name: "", phone: "", notes: "" }); }}
                    className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors mt-1">
                    חזרה לעמוד העסק
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky CTA */}
      {step === "home" && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-4"
          style={{ background: "linear-gradient(to top, #F4F6F9 55%, transparent)" }}>
          <motion.button
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-3 text-white font-black text-lg rounded-3xl transition-all"
            style={{ height: 60, background: p, boxShadow: `0 12px 32px ${p}45` }}>
            קבע תור עכשיו
            <ArrowLeft size={22} strokeWidth={2.5} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
