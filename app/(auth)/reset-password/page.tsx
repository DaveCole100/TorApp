"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";

function ResetForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const token       = params.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("הסיסמאות אינן תואמות"); return; }
    if (password.length < 8)  { setError("סיסמה חייבת להיות לפחות 8 תווים"); return; }

    setLoading(true);
    const res  = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "שגיאה"); return; }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 font-bold mb-4">קישור לא תקין</p>
        <Link href="/forgot-password" className="font-bold underline" style={{ color: "#0284C7" }}>
          בקש קישור חדש
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-black text-gray-900">הסיסמה שונתה!</h2>
        <p className="text-sm text-gray-500">מעביר אותך לעמוד הכניסה...</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">סיסמה חדשה</label>
        <div className="relative">
          <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type={showPw ? "text" : "password"} placeholder="לפחות 8 תווים" required dir="ltr"
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-12 pr-10 pl-10 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 outline-none transition-all" />
          <button type="button" onClick={() => setShowPw(s => !s)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-1.5">אימות סיסמה</label>
        <div className="relative">
          <Lock size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type={showPw ? "text" : "password"} placeholder="הכנס שוב" required dir="ltr"
            value={confirm} onChange={e => setConfirm(e.target.value)}
            className="w-full h-12 pr-10 pl-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 outline-none transition-all" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {password.length > 0 && (
        <div className="flex gap-1">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full transition-all"
              style={{ background: password.length >= i * 3 ? (password.length >= 10 ? "#16A34A" : "#F59E0B") : "#E5E7EB" }} />
          ))}
        </div>
      )}

      <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
        className="w-full rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        style={{ background: "#0284C7", height: "52px" }}>
        {loading
          ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          : "שמור סיסמה חדשה"
        }
      </motion.button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-[#F8FAFC]" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm">

        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base"
            style={{ background: "#0284C7" }}>T</div>
          <span className="font-black text-gray-900 text-lg">TorApp</span>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-1">סיסמה חדשה</h1>
        <p className="text-gray-500 text-sm mb-8">בחר סיסמה חזקה לחשבונך</p>

        <Suspense fallback={<div className="h-40 skeleton rounded-2xl" />}>
          <ResetForm />
        </Suspense>

        <Link href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-6 transition-colors">
          <ArrowRight size={14} />
          חזרה לכניסה
        </Link>
      </motion.div>
    </div>
  );
}
