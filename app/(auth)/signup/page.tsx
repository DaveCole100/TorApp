"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("הסיסמה חייבת להכיל לפחות 8 תווים"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName: name }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "שגיאה בהרשמה");
      setLoading(false);
      return;
    }
    toast.success("החשבון נוצר! מעבר לאשף ההגדרות...");
    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-brand-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white text-2xl font-black shadow-brand-glow mb-4">
            T
          </div>
          <h1 className="text-2xl font-black text-gray-900">פתחו עסק ב-TorApp</h1>
          <p className="text-gray-500 mt-1 text-sm">חינם. ללא כרטיס אשראי. ב-2 דקות.</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-card-lg p-6">
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              label="שם מלא"
              placeholder="ישראל ישראלי"
              value={name}
              onChange={e => setName(e.target.value)}
              prefix={<User size={15} />}
              required
            />
            <Input
              label="אימייל"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              prefix={<Mail size={15} />}
              required
              dir="ltr"
            />
            <Input
              label="סיסמה"
              type="password"
              placeholder="לפחות 8 תווים"
              value={password}
              onChange={e => setPassword(e.target.value)}
              prefix={<Lock size={15} />}
              required
              dir="ltr"
            />
            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              יצירת חשבון חינמי
              <ArrowLeft size={16} />
            </Button>
          </form>
          <p className="text-[11px] text-gray-400 text-center mt-4">
            בהרשמה אתם מסכימים ל<a href="#" className="underline">תנאי השימוש</a>
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          כבר יש לכם חשבון?{" "}
          <Link href="/login" className="text-brand-600 font-semibold hover:underline">
            כניסה
          </Link>
        </p>
      </div>
    </div>
  );
}
