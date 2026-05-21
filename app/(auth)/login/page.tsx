"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Calendar, CheckCircle2, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";

const FEATURES = [
  { icon: Calendar,      text: "ניהול תורים חכם" },
  { icon: CheckCircle2,  text: "אישורים אוטומטיים" },
  { icon: Zap,           text: "הזמנות אונליין 24/7" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res  = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "שגיאה בכניסה"); setLoading(false); return; }
    router.push(data.hasTenant ? "/dashboard" : "/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-dvh flex" dir="rtl">

      {/* ── Left brand panel (hidden on mobile) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0284C7 0%, #0369A1 100%)" }}>

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1.5px, transparent 1.5px)", backgroundSize: "32px 32px" }} />
        {/* Glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "#38BDF8", filter: "blur(80px)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
          style={{ background: "#059669", filter: "blur(80px)" }} />

        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-white text-lg border border-white/30">
              T
            </div>
            <span className="text-white font-black text-xl">TorApp</span>
          </div>
        </div>

        <div className="relative z-10 px-10 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
              ניהול תורים<br />בחכמה
            </h2>
            <p className="text-white/70 text-lg mb-10 leading-relaxed">
              מערכת מתקדמת לעסקים שרוצים לצמוח
            </p>
            <div className="flex flex-col gap-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="text-white/90 font-semibold">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F8FAFC]">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base"
              style={{ background: "#0284C7" }}>T</div>
            <span className="font-black text-gray-900 text-lg">TorApp</span>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-1">כניסה לחשבון</h1>
          <p className="text-gray-500 text-sm mb-8">ברוכים הבאים חזרה</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">אימייל</label>
              <div className="relative">
                <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="you@example.com" required dir="ltr"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 pr-10 pl-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">סיסמה</label>
              <div className="relative">
                <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" placeholder="••••••••" required dir="ltr"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 pr-10 pl-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 outline-none transition-all" />
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full h-13 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 mt-2 transition-all disabled:opacity-60"
              style={{ background: "#0284C7", height: "52px" }}>
              {loading
                ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                : <>כניסה <ArrowLeft size={18} strokeWidth={2.5} /></>
              }
            </motion.button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            אין לכם חשבון?{" "}
            <Link href="/signup" className="font-bold hover:underline" style={{ color: "#0284C7" }}>
              הרשמה חינם
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
