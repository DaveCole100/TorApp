"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Building2, Palette, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  "מספרה לגברים","מספרה לנשים","מספרה לכל המשפחה",
  "ניל ארט","ריסים ועיניים","קוסמטיקה ועיצוב פנים",
  "עיסוי ורפואה אלטרנטיבית","פיזיותרפיה","קליניקה",
  "אימון כושר אישי","יוגה ופילאטיס","קייטרינג",
  "צלמ/ת","ספר/ית בית","אחר",
];

const DAYS = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];

type DaySchedule = { is_open: boolean; open: string; close: string };
type Schedule    = Record<number, DaySchedule>;

const DEFAULT_SCHEDULE: Schedule = {
  0: { is_open: false, open: "09:00", close: "18:00" },
  1: { is_open: true,  open: "09:00", close: "20:00" },
  2: { is_open: true,  open: "09:00", close: "20:00" },
  3: { is_open: true,  open: "09:00", close: "20:00" },
  4: { is_open: true,  open: "09:00", close: "20:00" },
  5: { is_open: true,  open: "09:00", close: "14:00" },
  6: { is_open: false, open: "09:00", close: "18:00" },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);

  const [name,     setName]     = useState("");
  const [slug,     setSlug]     = useState("");
  const [category, setCategory] = useState("");
  const [phone,    setPhone]    = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [color,    setColor]    = useState("#0284C7");
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);

  const slugify = (v: string) =>
    v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40);

  const handleNameChange = (v: string) => { setName(v); setSlug(slugify(v)); };

  const COLORS = ["#4F46E5","#7C3AED","#DB2777","#DC2626","#EA580C","#16A34A","#0284C7","#374151"];

  const canNext = () => {
    if (step === 1) return name.trim().length > 2 && !!category;
    return true;
  };

  const handleFinish = async () => {
    setLoading(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, slug: slug || slugify(name), category, phone, whatsapp,
        primaryColor: color, schedule,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "שגיאה ביצירת העסק");
      setLoading(false);
      return;
    }
    toast.success("העסק נוצר בהצלחה! 🎉");
    router.push("/dashboard");
    router.refresh();
  };

  const STEPS = [
    { num: 1, label: "פרטי העסק", icon: Building2 },
    { num: 2, label: "מיתוג",     icon: Palette },
    { num: 3, label: "שעות",      icon: Clock },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-brand-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl items-center justify-center text-white font-black text-xl mb-4"
            style={{ background: color }}>T</div>
          <h1 className="text-2xl font-black text-gray-900">הגדרת העסק שלך</h1>
          <p className="text-gray-400 text-sm mt-1">לוקח 2 דקות, מבטיחים!</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.num ? "bg-green-500 text-white" :
                step === s.num ? "text-white" : "bg-gray-100 text-gray-400"
              }`} style={step === s.num ? { background: color } : {}}>
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.num ? "text-gray-900" : "text-gray-400"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-card-lg p-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="font-bold text-gray-900 mb-1">פרטי העסק</h2>
                    <p className="text-sm text-gray-400">אלה יופיעו בדף ההזמנות שלך</p>
                  </div>
                  <Input label="שם העסק" placeholder="Studio Eden" value={name}
                    onChange={e => handleNameChange(e.target.value)} required />
                  {slug && (
                    <p className="text-xs text-gray-400 -mt-2">
                      🔗 כתובת: <span className="font-semibold text-brand-600">torapp.co/{slug}</span>
                    </p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setCategory(c)}
                          className={`p-2.5 rounded-xl border-2 text-sm font-medium text-right transition-all ${
                            category === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input label="טלפון" type="tel" placeholder="054-0000000" value={phone}
                    onChange={e => setPhone(e.target.value)} dir="ltr" />
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="font-bold text-gray-900 mb-1">מיתוג העסק</h2>
                    <p className="text-sm text-gray-400">בחר צבע שמייצג את העסק</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">צבע ראשי</label>
                    <div className="flex flex-wrap gap-3">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setColor(c)}
                          className="w-10 h-10 rounded-full border-4 transition-all active:scale-95"
                          style={{ background: c, borderColor: color === c ? c : "transparent",
                            outline: color === c ? `3px solid ${c}40` : "none", outlineOffset: "2px" }}>
                          {color === c && <Check size={14} color="#fff" className="mx-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 p-4 transition-all" style={{ borderColor: color + "40" }}>
                    <p className="text-xs text-gray-400 mb-2">תצוגה מקדימה</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
                        style={{ background: color }}>{name[0] || "T"}</div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{name || "שם העסק"}</p>
                        <p className="text-xs" style={{ color }}>{category || "קטגוריה"}</p>
                      </div>
                    </div>
                    <button className="mt-3 w-full h-10 rounded-xl text-white text-sm font-bold"
                      style={{ background: color }}>קבע תור עכשיו</button>
                  </div>
                  <Input label="ווטסאפ (אופציונלי)" type="tel" placeholder="972541234567"
                    value={whatsapp} onChange={e => setWhatsapp(e.target.value)} dir="ltr"
                    hint="הכנס מספר בפורמט בינלאומי (972...)" />
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="font-bold text-gray-900 mb-1">שעות פתיחה</h2>
                    <p className="text-sm text-gray-400">ניתן לשנות בהמשך בהגדרות</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {DAYS.map((day, i) => {
                      const h = schedule[i];
                      return (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <button onClick={() => setSchedule(s => ({ ...s, [i]: { ...s[i], is_open: !s[i].is_open } }))}
                            className={`w-10 h-6 rounded-full transition-all relative ${h.is_open ? "bg-green-500" : "bg-gray-200"}`}>
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${h.is_open ? "right-0.5" : "right-4.5"}`} />
                          </button>
                          <span className={`text-sm font-medium w-12 ${h.is_open ? "text-gray-900" : "text-gray-400"}`}>{day}</span>
                          {h.is_open ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input type="time" value={h.open} onChange={e => setSchedule(s => ({ ...s, [i]: { ...s[i], open: e.target.value } }))}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-brand-500" />
                              <span className="text-gray-400 text-xs">–</span>
                              <input type="time" value={h.close} onChange={e => setSchedule(s => ({ ...s, [i]: { ...s[i], close: e.target.value } }))}
                                className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-brand-500" />
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 flex-1">סגור</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)} className="flex-1">
                <ChevronRight size={16} /> הקודם
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="flex-1">
                הבא <ArrowLeft size={16} />
              </Button>
            ) : (
              <Button onClick={handleFinish} loading={loading} className="flex-1" size="lg">
                <Check size={18} /> סיום והפעלת העסק!
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
