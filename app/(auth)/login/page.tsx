"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "שגיאה בכניסה");
      setLoading(false);
      return;
    }
    router.push(data.hasTenant ? "/dashboard" : "/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-brand-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white text-2xl font-black shadow-brand-glow mb-4">
            T
          </div>
          <h1 className="text-2xl font-black text-gray-900">ברוכים הבאים</h1>
          <p className="text-gray-500 mt-1 text-sm">היכנסו לחשבון TorApp שלכם</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-card-lg p-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              prefix={<Lock size={15} />}
              required
              dir="ltr"
            />
            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              כניסה
              <ArrowLeft size={16} />
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          אין לכם חשבון?{" "}
          <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
            הרשמה חינם
          </Link>
        </p>
      </div>
    </div>
  );
}
