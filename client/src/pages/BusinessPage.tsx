import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Badge, Card, Spinner } from "@/components/ui";
import {
  MapPin, Phone, Clock, Star, Instagram, MessageCircle,
  Scissors, ChevronLeft, Image, Users, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  imageUrl?: string;
  isPopular?: boolean;
}

interface StaffMember {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  rating?: number;
}

interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  serviceNames?: string;
}

// ─── Mock data (replaced by real API) ────────────────────────────────────────

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
  { id: 1, name: "תספורת גברים", description: "תספורת מקצועית + סידור קצוות", durationMinutes: 30, price: 80, category: "תספורות", isPopular: true },
  { id: 2, name: "תספורת + זקן", description: "תספורת מלאה עם עיצוב זקן מקצועי", durationMinutes: 50, price: 120, category: "תספורות", isPopular: true },
  { id: 3, name: "עיצוב זקן", description: "עיצוב וגילוח מקצועי", durationMinutes: 25, price: 60, category: "זקן" },
  { id: 4, name: "תספורת ילדים", description: "עד גיל 12", durationMinutes: 20, price: 55, category: "תספורות" },
  { id: 5, name: "פיד + עיצוב", description: "פיד מקצועי עם עיצוב גבולות", durationMinutes: 40, price: 90, category: "עיצוב" },
  { id: 6, name: "טיפול פנים לגברים", description: "ניקוי עמוק + לחות", durationMinutes: 60, price: 160, category: "טיפולים" },
];

const MOCK_STAFF: StaffMember[] = [
  { id: 1, name: "אדן כהן", role: "בעל המספרה", bio: "15 שנות ניסיון, מתמחה בסגנונות מודרניים", rating: 5.0 },
  { id: 2, name: "יוסי לוי", role: "ספר בכיר", bio: "מומחה בתספורות קלאסיות וטרנדיות", rating: 4.8 },
  { id: 3, name: "מיכל שפירא", role: "קוסמטיקאית", bio: "טיפולי פנים ועיצוב גבות מתקדמים", rating: 4.9 },
];

const MOCK_REVIEWS: Review[] = [
  { id: 1, customerName: "דוד מ.", rating: 5, comment: "השירות הטוב ביותר שקיבלתי! אדן פשוט גאון, בדיוק מה שרציתי.", date: "לפני 2 ימים", serviceNames: "תספורת + זקן" },
  { id: 2, customerName: "רון א.", rating: 5, comment: "אווירה מדהימה, מהיר ומקצועי. בא כל שבוע!", date: "לפני שבוע", serviceNames: "פיד + עיצוב" },
  { id: 3, customerName: "נועם ב.", rating: 5, comment: "ממליץ בחום! הקביעת התור הייתה קלה וחוויה מהנה.", date: "לפני שבועיים" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function durationLabel(min: number) {
  if (min < 60) return `${min} דק'`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}ש' ${m}דק'` : `${h} שעות`;
}

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function todayHours(wh?: BusinessProfile["workingHours"]) {
  if (!wh) return null;
  const today = new Date().getDay().toString();
  const h = wh[today];
  if (!h) return "סגור היום";
  return `פתוח ${h.open}–${h.close}`;
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          fill={i <= Math.round(rating) ? "currentColor" : "none"}
          style={{ color: "#F59E0B" }}
        />
      ))}
    </span>
  );
}

// ─── Service Category Group ───────────────────────────────────────────────────

function ServiceGroup({ category, services, onBook }: {
  category: string;
  services: Service[];
  onBook: (s: Service) => void;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold uppercase tracking-wider mb-3 px-1"
        style={{ color: "var(--text-muted)" }}>
        {category}
      </h3>
      <div className="flex flex-col gap-2">
        {services.map(s => (
          <div
            key={s.id}
            onClick={() => onBook(s)}
            className="flex items-center gap-3 p-4 rounded-[var(--r-lg)] border transition-all active:scale-[0.99] cursor-pointer"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div
              className="w-11 h-11 rounded-[var(--r-md)] flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--p-soft)" }}
            >
              <Scissors size={18} style={{ color: "var(--p)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                  {s.name}
                </span>
                {s.isPopular && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
                    פופולרי
                  </span>
                )}
              </div>
              {s.description && (
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{s.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Clock size={10} className="inline ml-0.5" />
                  {durationLabel(s.durationMinutes)}
                </span>
              </div>
            </div>
            <div className="text-left flex-shrink-0">
              <div className="font-bold text-base" style={{ color: "var(--p)" }}>₪{s.price}</div>
              <ChevronLeft size={14} style={{ color: "var(--text-muted)" }} className="mx-auto mt-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "services", label: "שירותים" },
  { id: "staff",    label: "הצוות" },
  { id: "reviews",  label: "ביקורות" },
  { id: "info",     label: "מידע" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BusinessPage({ slug }: { slug: string }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("services");

  // In production, fetch real data by slug
  const business = MOCK_BUSINESS;
  const services  = MOCK_SERVICES;
  const staff     = MOCK_STAFF;
  const reviews   = MOCK_REVIEWS;

  // Group services by category
  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.category || "כללי";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const handleBook = (service?: Service) => {
    const qs = service ? `?serviceId=${service.id}` : "";
    setLocation(`/book/${business.id}${qs}`);
  };

  return (
    <div className="min-h-dvh animate-[fadeIn_0.2s_ease]" style={{ background: "var(--bg)" }}>

      {/* ── Cover ── */}
      <div className="relative h-52 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 overflow-hidden">
        {business.coverUrl
          ? <img src={business.coverUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 60%)" }} />
        }
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* ── Business Header ── */}
      <div className="relative px-4 pb-4" style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-sm)" }}>
        {/* Logo */}
        <div className="absolute -top-8 right-4">
          <div
            className="w-16 h-16 rounded-[var(--r-lg)] border-4 overflow-hidden flex items-center justify-center font-bold text-2xl"
            style={{
              background: business.logoUrl ? "transparent" : "var(--p)",
              borderColor: "var(--bg-card)",
              color: "#fff",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {business.logoUrl
              ? <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
              : business.name[0]
            }
          </div>
        </div>

        <div className="pt-10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text)" }}>
                {business.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {business.category}
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-shrink-0">
              <Star size={14} fill="currentColor" style={{ color: "#F59E0B" }} />
              <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{business.rating}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>({business.reviewCount})</span>
            </div>
          </div>

          {business.tagline && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {business.tagline}
            </p>
          )}

          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3">
            {business.whatsapp && (
              <a
                href={`https://wa.me/${business.whatsapp}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-xs font-semibold transition-all active:scale-95"
                style={{ background: "#DCFCE7", color: "#16A34A" }}
              >
                <MessageCircle size={13} />
                ווטסאפ
              </a>
            )}
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-xs font-semibold transition-all active:scale-95"
                style={{ background: "var(--info-soft)", color: "var(--info)" }}
              >
                <Phone size={13} />
                {business.phone}
              </a>
            )}
            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--r-sm)] text-xs font-semibold transition-all active:scale-95"
                style={{ background: "#FDF2F8", color: "#C026D3" }}
              >
                <Instagram size={13} />
              </a>
            )}
          </div>

          {/* Hours */}
          {business.workingHours && (
            <div className="flex items-center gap-1.5 mt-3">
              <Clock size={13} style={{ color: "var(--success)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
                {todayHours(business.workingHours)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        className="sticky top-0 z-20 flex border-b overflow-x-auto"
        style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 min-w-fit px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2"
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
      <div className="pb-32 pt-2">

        {/* Services */}
        {activeTab === "services" && (
          <div className="px-4 pt-2 page-enter">
            {Object.entries(grouped).map(([cat, svcs]) => (
              <ServiceGroup key={cat} category={cat} services={svcs} onBook={handleBook} />
            ))}
          </div>
        )}

        {/* Staff */}
        {activeTab === "staff" && (
          <div className="px-4 pt-4 flex flex-col gap-3 page-enter">
            {staff.map(s => (
              <Card key={s.id} onClick={() => handleBook()}>
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} src={s.avatarUrl} size={52} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{s.name}</span>
                      {s.rating && (
                        <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          <Star size={10} fill="currentColor" style={{ color: "#F59E0B" }} />
                          {s.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--p)" }}>{s.role}</p>
                    {s.bio && <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{s.bio}</p>}
                  </div>
                  <ChevronLeft size={16} style={{ color: "var(--text-muted)" }} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Reviews */}
        {activeTab === "reviews" && (
          <div className="px-4 pt-4 page-enter">
            {/* Summary */}
            <Card className="mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-black" style={{ color: "var(--text)" }}>{business.rating}</div>
                  <Stars rating={business.rating} />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{business.reviewCount} ביקורות</p>
                </div>
                <div className="flex-1">
                  {[5,4,3,2,1].map(n => (
                    <div key={n} className="flex items-center gap-2 mb-1">
                      <span className="text-xs w-2" style={{ color: "var(--text-muted)" }}>{n}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: n === 5 ? "80%" : n === 4 ? "12%" : "4%",
                            background: "var(--p)",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <Card key={r.id}>
                  <div className="flex items-start gap-3">
                    <Avatar name={r.customerName} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{r.customerName}</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.date}</span>
                      </div>
                      <Stars rating={r.rating} />
                      {r.serviceNames && (
                        <p className="text-xs mt-1" style={{ color: "var(--p)" }}>{r.serviceNames}</p>
                      )}
                      <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {r.comment}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        {activeTab === "info" && (
          <div className="px-4 pt-4 flex flex-col gap-3 page-enter">
            <Card>
              <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text)" }}>שעות פתיחה</h3>
              {business.workingHours && DAYS_HE.map((day, i) => {
                const h = business.workingHours![i.toString()];
                const isToday = new Date().getDay() === i;
                return (
                  <div key={i} className="flex justify-between items-center py-2 border-t first:border-0"
                    style={{ borderColor: "var(--border)" }}>
                    <span className={`text-sm ${isToday ? "font-bold" : "font-medium"}`}
                      style={{ color: isToday ? "var(--p)" : "var(--text)" }}>
                      {day}
                    </span>
                    <span className="text-sm" style={{ color: h ? "var(--text-secondary)" : "var(--text-muted)" }}>
                      {h ? `${h.open} – ${h.close}` : "סגור"}
                    </span>
                  </div>
                );
              })}
            </Card>

            {business.address && (
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[var(--r-sm)] flex items-center justify-center"
                    style={{ background: "var(--p-soft)" }}>
                    <MapPin size={16} style={{ color: "var(--p)" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>כתובת</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{business.address}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky Book Button ── */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 z-30"
        style={{
          background: "linear-gradient(to top, var(--bg-card) 70%, transparent)",
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={() => handleBook()}
          className="w-full h-14 rounded-[var(--r-lg)] text-white text-base font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: "var(--p)",
            boxShadow: "0 4px 24px color-mix(in srgb, var(--p) 40%, transparent)",
          }}
        >
          קבע תור עכשיו
          <ChevronLeft size={20} />
        </button>
      </div>
    </div>
  );
}
