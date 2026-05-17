import { useState } from "react";
import { useLocation } from "wouter";
import { Avatar } from "@/components/ui";
import {
  MapPin, Phone, Clock, Star, Instagram, MessageCircle,
  Scissors, ChevronLeft, Users, ChevronRight,
} from "@/components/icons";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BusinessProfile {
  id: number;
  slug: string;
  name: string;
  tagline?: string;
  category: string;
  coverUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  address?: string;
  rating: number;
  reviewCount: number;
  workingHours?: Record<string, { open: string; close: string } | null>;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  category?: string;
  isPopular?: boolean;
  nextAvailable?: string;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number;
  specialties?: string[];
}

interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  serviceNames?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_BUSINESS: BusinessProfile = {
  id: 4,
  slug: "studio-eden",
  name: "Studio Eden",
  tagline: "חווית יופי מושלמת בלב תל אביב",
  category: "מספרה ועיצוב שיער",
  primaryColor: "#4F46E5",
  phone: "054-1234567",
  whatsapp: "972541234567",
  instagram: "studio.eden.tlv",
  address: "רוטשילד 22, תל אביב",
  rating: 4.9,
  reviewCount: 247,
  workingHours: {
    "0": null,
    "1": { open: "09:00", close: "20:00" },
    "2": { open: "09:00", close: "20:00" },
    "3": { open: "09:00", close: "20:00" },
    "4": { open: "09:00", close: "20:00" },
    "5": { open: "09:00", close: "14:00" },
    "6": null,
  },
};

const MOCK_SERVICES: Service[] = [
  { id: 1, name: "תספורת גברים",  description: "תספורת מקצועית + סידור קצוות",      durationMinutes: 30, price: 80,  category: "תספורות", isPopular: true,  nextAvailable: "היום 14:30" },
  { id: 2, name: "תספורת + זקן",  description: "תספורת מלאה עם עיצוב זקן מקצועי",   durationMinutes: 50, price: 120, category: "תספורות", isPopular: true,  nextAvailable: "היום 16:00" },
  { id: 4, name: "תספורת ילדים",  description: "עד גיל 12, עם סבלנות ואהבה",         durationMinutes: 20, price: 55,  category: "תספורות" },
  { id: 3, name: "עיצוב זקן",     description: "עיצוב וגילוח מקצועי עם תער",         durationMinutes: 25, price: 60,  category: "זקן",     nextAvailable: "מחר 10:00" },
  { id: 5, name: "פיד + עיצוב",   description: "פיד מקצועי עם עיצוב גבולות מדויק",  durationMinutes: 40, price: 90,  category: "עיצוב",   isPopular: true,  nextAvailable: "היום 17:30" },
  { id: 6, name: "טיפול פנים",    description: "ניקוי עמוק + לחות + עיסוי",          durationMinutes: 60, price: 160, category: "טיפולים" },
];

const MOCK_STAFF: StaffMember[] = [
  { id: 1, name: "אדן כהן",   role: "בעל המספרה",   bio: "15 שנות ניסיון", rating: 5.0,  specialties: ["גברים", "קלאסי"] },
  { id: 2, name: "יוסי לוי",  role: "ספר בכיר",     bio: "מומחה בסגנונות מודרניים", rating: 4.8, specialties: ["פייד", "עיצוב"] },
  { id: 3, name: "מיכל שפירא",role: "קוסמטיקאית",   bio: "טיפולי פנים מתקדמים",  rating: 4.9,  specialties: ["טיפולים", "עיצוב"] },
];

const MOCK_REVIEWS: Review[] = [
  { id: 1, customerName: "דוד מ.", rating: 5, comment: "השירות הטוב ביותר שקיבלתי! אדן פשוט גאון, בדיוק מה שרציתי.", date: "לפני 2 ימים", serviceNames: "תספורת + זקן" },
  { id: 2, customerName: "רון א.", rating: 5, comment: "אווירה מדהימה, מהיר ומקצועי. בא כל שבוע!", date: "לפני שבוע", serviceNames: "פיד + עיצוב" },
  { id: 3, customerName: "נועם ב.", rating: 5, comment: "ממליץ בחום! הקביעת התור הייתה קלה וחוויה מהנה מאוד.", date: "לפני שבועיים", serviceNames: "תספורת גברים" },
];

// ─── Category meta ────────────────────────────────────────────────────────────

const CAT_META: Record<string, { bg: string; emoji: string }> = {
  "תספורות": { bg: "linear-gradient(135deg,#667eea,#764ba2)", emoji: "✂️" },
  "זקן":     { bg: "linear-gradient(135deg,#2196F3,#21CBF3)", emoji: "🪒" },
  "עיצוב":   { bg: "linear-gradient(135deg,#f093fb,#f5576c)", emoji: "💈" },
  "טיפולים": { bg: "linear-gradient(135deg,#43e97b,#38f9d7)", emoji: "🌿" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function durationLabel(min: number) {
  if (min < 60) return `${min} דק'`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}ש' ${m}דק'` : `${h} שעות`;
}

const DAYS_HE = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];

function todayHoursLabel(wh?: BusinessProfile["workingHours"]): { label: string; open: boolean } {
  if (!wh) return { label: "", open: false };
  const today = new Date().getDay().toString();
  const h = wh[today];
  if (!h) return { label: "סגור היום", open: false };
  return { label: `פתוח עד ${h.close}`, open: true };
}

// ─── Stars ───────────────────────────────────────────────────────────────────

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? "currentColor" : "none"}
          style={{ color: "#F59E0B" }} />
      ))}
    </span>
  );
}

// ─── Service Card (premium redesign) ─────────────────────────────────────────

function ServiceCard({ s, onBook }: { s: Service; onBook: (s: Service) => void }) {
  const meta = CAT_META[s.category ?? ""] ?? { bg: "linear-gradient(135deg,#667eea,#764ba2)", emoji: "✂️" };
  return (
    <div
      className="flex gap-3 p-4 rounded-2xl border bg-white transition-all active:scale-[0.99]"
      style={{ borderColor: "var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      {/* Image/icon square */}
      <div
        className="w-[72px] h-[72px] rounded-xl flex-shrink-0 flex items-center justify-center text-3xl"
        style={{ background: meta.bg }}
      >
        {meta.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-bold text-[15px] leading-tight" style={{ color: "var(--text)" }}>
              {s.name}
            </span>
            {s.isPopular && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                style={{ background: "#FFF8E1", color: "#F59E0B", border: "1px solid #FDE68A" }}>
                🔥 פופולרי
              </span>
            )}
          </div>
          <span className="font-black text-lg flex-shrink-0" style={{ color: "var(--p)" }}>
            ₪{s.price}
          </span>
        </div>

        {s.description && (
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
            {s.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-3">
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              <Clock size={11} />
              {durationLabel(s.durationMinutes)}
            </span>
            {s.nextAvailable && (
              <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
                הבא פנוי: {s.nextAvailable}
              </span>
            )}
          </div>
          <button
            onClick={() => onBook(s)}
            className="px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all active:scale-95"
            style={{ borderColor: "var(--p)", color: "var(--p)" }}
          >
            הזמן
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "services", label: "שירותים" },
  { id: "staff",    label: "הצוות" },
  { id: "reviews",  label: "ביקורות" },
  { id: "info",     label: "מידע" },
];

export default function BusinessPage({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("services");
  const [activeCat, setActiveCat] = useState("הכל");

  const business = MOCK_BUSINESS;
  const services = MOCK_SERVICES;
  const staff    = MOCK_STAFF;
  const reviews  = MOCK_REVIEWS;

  const categories = ["הכל", ...Array.from(new Set(services.map(s => s.category ?? "כללי")))];
  const filtered = activeCat === "הכל" ? services : services.filter(s => s.category === activeCat);

  const { label: hoursLabel, open: isOpen } = todayHoursLabel(business.workingHours);

  const handleBook = (service?: Service) => {
    const qs = service ? `?serviceId=${service.id}` : "";
    setLocation(`/book/${business.id}${qs}`);
  };

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>

      {/* ── Cover ── */}
      <div className="relative h-52 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-400" />
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* ── Business Header ── */}
      <div className="px-5 pb-5 bg-white" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Logo + share row */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div
            className="w-20 h-20 rounded-2xl border-4 overflow-hidden flex items-center justify-center font-black text-3xl"
            style={{
              background: business.logoUrl ? "transparent" : "var(--p)",
              borderColor: "#fff",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            {business.logoUrl
              ? <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
              : business.name[0]
            }
          </div>
          <button
            className="px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            שיתוף
          </button>
        </div>

        {/* Name + category + rating */}
        <h1 className="text-2xl font-black leading-tight" style={{ color: "var(--text)" }}>
          {business.name}
        </h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{business.category}</span>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <div className="flex items-center gap-1.5">
            <Star size={14} fill="currentColor" style={{ color: "#F59E0B" }} />
            <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{business.rating}</span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>({business.reviewCount} ביקורות)</span>
          </div>
        </div>

        {/* Tagline */}
        {business.tagline && (
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {business.tagline}
          </p>
        )}

        {/* Info row */}
        <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
          {business.address && (
            <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
              <MapPin size={12} /> {business.address}
            </span>
          )}
          {hoursLabel && (
            <span className="flex items-center gap-1 font-medium"
              style={{ color: isOpen ? "var(--success)" : "var(--text-muted)" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: isOpen ? "var(--success)" : "var(--text-muted)" }} />
              {hoursLabel}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {business.whatsapp && (
            <a
              href={`https://wa.me/${business.whatsapp}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ background: "#22C55E", color: "#fff" }}
            >
              <MessageCircle size={16} />
              ווטסאפ
            </a>
          )}
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95"
              style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
            >
              <Phone size={15} />
              {business.phone}
            </a>
          )}
          {business.instagram && (
            <a
              href={`https://instagram.com/${business.instagram}`}
              className="w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all active:scale-95"
              style={{ borderColor: "var(--border-strong)" }}
            >
              <Instagram size={18} style={{ color: "#C026D3" }} />
            </a>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        className="sticky top-0 z-20 flex border-b bg-white"
        style={{ borderColor: "var(--border)" }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 py-3.5 text-sm font-semibold border-b-2 transition-all"
            style={{
              color: activeTab === t.id ? "var(--p)" : "var(--text-muted)",
              borderBottomColor: activeTab === t.id ? "var(--p)" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="pb-32">

        {/* ── Services ── */}
        {activeTab === "services" && (
          <div className="page-enter">
            {/* Category filter pills */}
            <div className="flex gap-2 px-4 pt-3 pb-3 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0 active:scale-95"
                  style={
                    activeCat === cat
                      ? { background: "var(--p)", color: "#fff", borderColor: "var(--p)" }
                      : { background: "#fff", color: "var(--text-secondary)", borderColor: "var(--border)" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Service cards */}
            <div className="px-4 flex flex-col gap-3">
              {filtered.map(s => (
                <ServiceCard key={s.id} s={s} onBook={handleBook} />
              ))}
            </div>
          </div>
        )}

        {/* ── Staff ── */}
        {activeTab === "staff" && (
          <div className="page-enter pt-5">
            <h3 className="px-5 font-bold text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              הצוות שלנו — {staff.length} מטפלים
            </h3>
            {/* Horizontal scroll cards */}
            <div className="flex gap-4 px-5 overflow-x-auto pb-3 no-scrollbar">
              {staff.map(s => (
                <div key={s.id}
                  className="flex flex-col items-center flex-shrink-0 w-28 bg-white rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
                >
                  <div className="relative">
                    <Avatar name={s.name} src={s.avatarUrl} size={64} />
                    {s.rating && (
                      <span
                        className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#F59E0B", color: "#fff" }}
                      >
                        {s.rating}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-sm mt-2.5 text-center leading-tight" style={{ color: "var(--text)" }}>
                    {s.name}
                  </span>
                  <span className="text-[11px] mt-0.5 text-center" style={{ color: "var(--p)" }}>
                    {s.role}
                  </span>
                  {s.specialties && (
                    <div className="flex flex-wrap gap-1 mt-2 justify-center">
                      {s.specialties.map(sp => (
                        <span key={sp} className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--p-soft)", color: "var(--p)" }}>
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => handleBook()}
                    className="mt-3 w-full py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95"
                    style={{ borderColor: "var(--p)", color: "var(--p)" }}
                  >
                    בחר
                  </button>
                </div>
              ))}
            </div>

            {/* Staff vertical details below */}
            <div className="px-5 mt-5 flex flex-col gap-3">
              {staff.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border"
                  style={{ borderColor: "var(--border)" }}>
                  <Avatar name={s.name} src={s.avatarUrl} size={48} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{s.name}</span>
                      {s.rating && <Stars rating={s.rating} size={11} />}
                    </div>
                    <span className="text-xs" style={{ color: "var(--p)" }}>{s.role}</span>
                    {s.bio && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {activeTab === "reviews" && (
          <div className="px-5 pt-5 page-enter">
            {/* Rating summary */}
            <div className="bg-white rounded-2xl border p-5 mb-4"
              style={{ borderColor: "var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <div className="text-5xl font-black leading-none" style={{ color: "var(--text)" }}>
                    {business.rating}
                  </div>
                  <Stars rating={business.rating} size={14} />
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    {business.reviewCount} ביקורות
                  </p>
                </div>
                <div className="flex-1">
                  {[5,4,3,2,1].map(n => (
                    <div key={n} className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold w-3" style={{ color: "var(--text-muted)" }}>{n}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: n === 5 ? "82%" : n === 4 ? "11%" : n === 3 ? "4%" : "2%",
                            background: n === 5 ? "var(--p)" : n === 4 ? "#818CF8" : "var(--border-strong)",
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border p-4"
                  style={{ borderColor: "var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div className="flex items-start gap-3">
                    <Avatar name={r.customerName} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                          {r.customerName}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.date}</span>
                      </div>
                      <Stars rating={r.rating} size={12} />
                      {r.serviceNames && (
                        <span className="text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full"
                          style={{ background: "var(--p-soft)", color: "var(--p)" }}>
                          {r.serviceNames}
                        </span>
                      )}
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {r.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Info ── */}
        {activeTab === "info" && (
          <div className="px-5 pt-5 flex flex-col gap-3 page-enter">
            {/* Hours */}
            <div className="bg-white rounded-2xl border p-5"
              style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Clock size={15} style={{ color: "var(--p)" }} />
                שעות פתיחה
              </h3>
              {business.workingHours && DAYS_HE.map((day, i) => {
                const h = business.workingHours![i.toString()];
                const isToday = new Date().getDay() === i;
                return (
                  <div key={i}
                    className="flex justify-between items-center py-2.5 border-t first:border-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="text-sm font-medium"
                      style={{ color: isToday ? "var(--p)" : "var(--text)", fontWeight: isToday ? 700 : 500 }}>
                      {day}
                      {isToday && <span className="text-xs mr-1.5" style={{ color: "var(--p)" }}>· היום</span>}
                    </span>
                    <span className={`text-sm font-${h ? "semibold" : "normal"}`}
                      style={{ color: h ? "var(--text)" : "var(--text-muted)" }}>
                      {h ? `${h.open} – ${h.close}` : "סגור"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Address */}
            {business.address && (
              <div className="bg-white rounded-2xl border p-5 flex items-center gap-4"
                style={{ borderColor: "var(--border)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--p-soft)" }}>
                  <MapPin size={18} style={{ color: "var(--p)" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>כתובת</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{business.address}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky Book CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 z-30"
        style={{
          paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
          paddingTop: "1rem",
          background: "linear-gradient(to top, #fff 65%, transparent)",
        }}
      >
        <button
          onClick={() => handleBook()}
          className="w-full h-14 rounded-2xl text-white text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, var(--p) 0%, #7C3AED 100%)",
            boxShadow: "0 4px 24px rgba(79,70,229,0.4)",
          }}
        >
          קבע תור עכשיו
          <ChevronLeft size={20} />
        </button>
      </div>
    </div>
  );
}
