"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Copy, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email,    setEmail]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [copied,   setCopied]   = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetUrl("");

    const res  = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "שגיאה"); return; }
    if (data.resetUrl) setResetUrl(data.resetUrl);
    else setError("האימייל לא נמצא במערכת");
  };

  const copy = () => {
    navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-[#F8FAFC]" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base"
            style={{ background: "#0284C7" }}>T</div>
          <span className="font-black text-gray-900 text-lg">TorApp</span>
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-1">שכחת סיסמה?</h1>
        <p className="text-gray-500 text-sm mb-8">הזן את האימייל שלך ונשלח קישור לאיפוס</p>

        {!resetUrl ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">אימייל</label>
              <div className="relative">
                <Mail size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" placeholder="you@example.com" required dir="ltr"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 pr-10 pl-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/10 outline-none transition-all" />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: "#0284C7", height: "52px" }}>
              {loading
                ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                : "שלח קישור איפוס"
              }
            </motion.button>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
              <p className="text-sm font-bold text-green-800 mb-1">קישור האיפוס מוכן!</p>
              <p className="text-xs text-green-700">לחץ על הקישור כדי לאפס את הסיסמה. תוקף: שעה אחת.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-500 mb-2">קישור לאיפוס:</p>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <span className="text-xs text-gray-600 flex-1 break-all dir-ltr" dir="ltr">{resetUrl}</span>
                <button onClick={copy}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: copied ? "#22C55E" : "#0284C7" }}>
                  {copied ? <Check size={14} color="#fff" /> : <Copy size={14} color="#fff" />}
                </button>
              </div>
            </div>

            <a href={resetUrl}
              className="w-full h-13 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 text-center"
              style={{ background: "#0284C7", height: "52px" }}>
              עבור לאיפוס סיסמה
            </a>
          </motion.div>
        )}

        <Link href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-6 transition-colors">
          <ArrowRight size={14} />
          חזרה לכניסה
        </Link>
      </motion.div>
    </div>
  );
}
