"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, ExternalLink, Copy, Instagram, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import type { Tenant } from "@/lib/db/schema";

export default function SettingsPage() {
  const [tenant,  setTenant]  = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", whatsapp: "", email: "", instagram: "",
    address: "", description: "", primaryColor: "#0284C7",
    bookingAdvanceDays: 60, cancellationHours: 24,
  });

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return;
      const data = await res.json();
      const t: Tenant = data.tenant;
      setTenant(t);
      setForm({
        name: t.name,
        phone: t.phone ?? "",
        whatsapp: t.whatsapp ?? "",
        email: t.email ?? "",
        instagram: t.instagram ?? "",
        address: t.address ?? "",
        description: t.description ?? "",
        primaryColor: t.primaryColor,
        bookingAdvanceDays: t.bookingAdvanceDays,
        cancellationHours: t.cancellationHours,
      });
    })();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) { toast.error("שגיאה בשמירה"); return; }
    toast.success("ההגדרות נשמרו");
  };

  const bookingUrl = tenant ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${tenant.slug}` : "";
  const COLORS = ["#4F46E5","#7C3AED","#DB2777","#DC2626","#EA580C","#16A34A","#0284C7","#374151"];

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">הגדרות</h1>
          <p className="text-sm text-gray-400 mt-0.5">ניהול פרטי העסק</p>
        </div>
        <Button onClick={handleSave} loading={loading} size="md">
          <Save size={16} /> שמור
        </Button>
      </div>

      {tenant && (
        <Card className="mb-5 border-brand-100 bg-brand-50/50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm text-gray-900">עמוד ההזמנות שלך</p>
              <p className="text-xs text-brand-600 mt-0.5 break-all">{bookingUrl}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { navigator.clipboard.writeText(bookingUrl); toast.success("הועתק!"); }}
                className="p-2 rounded-lg hover:bg-white transition-colors text-gray-500">
                <Copy size={15} />
              </button>
              <a href={bookingUrl} target="_blank" rel="noreferrer"
                className="p-2 rounded-lg hover:bg-white transition-colors text-gray-500">
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Instagram booking link */}
      {tenant && (
        <div className="rounded-2xl p-5 mb-5 border"
          style={{ background: "linear-gradient(135deg, #833AB410, #E1306C10, #F7773710)", borderColor: "#E1306C20" }}>
          <div className="flex items-center gap-2 mb-3">
            <Instagram size={18} style={{ color: "#E1306C" }} />
            <p className="font-black text-gray-900">הזמנות מאינסטגרם</p>
          </div>
          <p className="text-sm text-gray-500 mb-3">שים את הקישור הזה ב-Bio שלך באינסטגרם — לקוחות שלוחצים יראו באנר "הגעת מאינסטגרם"</p>
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100">
            <Link size={13} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-600 flex-1 truncate dir-ltr" dir="ltr">
              {bookingUrl}?utm_source=instagram
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(`${bookingUrl}?utm_source=instagram`); toast.success("קישור אינסטגרם הועתק!"); }}
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all"
              style={{ background: "linear-gradient(90deg, #833AB4, #E1306C)" }}>
              העתק
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        <Card>
          <CardTitle className="mb-4">פרטי העסק</CardTitle>
          <div className="flex flex-col gap-4">
            <Input label="שם העסק" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            <Input label="תיאור" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            <Input label="כתובת" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="טלפון" type="tel" dir="ltr" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
              <Input label="אימייל" type="email" dir="ltr" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="ווטסאפ" type="tel" dir="ltr" value={form.whatsapp} onChange={e => setForm(f=>({...f,whatsapp:e.target.value}))} />
              <Input label="אינסטגרם" dir="ltr" value={form.instagram} onChange={e => setForm(f=>({...f,instagram:e.target.value}))} />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">מיתוג</CardTitle>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-3">צבע ראשי</label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f=>({...f,primaryColor:c}))}
                  className="w-10 h-10 rounded-full border-4 transition-all"
                  style={{ background:c, borderColor: form.primaryColor===c ? c : "transparent", outline: form.primaryColor===c ? `3px solid ${c}40` : "none", outlineOffset:"2px" }} />
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">הגדרות הזמנות</CardTitle>
          <div className="grid grid-cols-2 gap-3">
            <Input label="ימים מראש" type="number" min={1} max={365}
              value={form.bookingAdvanceDays} onChange={e => setForm(f=>({...f,bookingAdvanceDays:+e.target.value}))}
              hint="כמה ימים מראש ניתן לקבוע" />
            <Input label="שעות לביטול" type="number" min={0}
              value={form.cancellationHours} onChange={e => setForm(f=>({...f,cancellationHours:+e.target.value}))}
              hint="מינימום שעות לביטול תור" />
          </div>
        </Card>
      </div>
    </div>
  );
}
