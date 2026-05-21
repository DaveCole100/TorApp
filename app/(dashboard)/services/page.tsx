"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Clock, Sparkles, X, Check, Scissors } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, formatDuration } from "@/lib/utils/format";
import type { Service } from "@/lib/db/schema";

const ease = [0.22, 1, 0.36, 1] as const;

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 75, 90, 120];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Service | null>(null);
  const [saving,   setSaving]   = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", durationMinutes: 30, price: 0, bufferMinutes: 0, isPopular: false,
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data.services ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", durationMinutes: 30, price: 0, bufferMinutes: 0, isPopular: false });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("שם השירות נדרש"); return; }
    setSaving(true);
    const res = editing
      ? await fetch(`/api/services/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? "שגיאה"); return; }
    toast.success(editing ? "השירות עודכן" : "השירות נוסף");
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק שירות זה?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    toast.success("השירות נמחק");
    load();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await fetch(`/api/services/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) });
    load();
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description ?? "", durationMinutes: s.durationMinutes, price: parseFloat(s.price), bufferMinutes: s.bufferMinutes, isPopular: s.isPopular });
    setShowForm(true);
  };

  return (
    <div className="flex h-full">

      {/* ── Main list ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-3xl font-black text-gray-900">שירותים</h1>
              <p className="text-sm text-gray-400 mt-0.5">{services.length} שירותים במערכת</p>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 h-11 px-5 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-md hover:shadow-lg"
              style={{ background: "#0284C7" }}>
              <Plus size={17} strokeWidth={2.5} />
              שירות חדש
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-3xl" />)}
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 bg-blue-50">
                <Scissors size={32} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">אין שירותים עדיין</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">הוספת שירותים תאפשר ללקוחות לבחור ולהזמין תור אונליין</p>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 h-11 px-6 rounded-2xl text-sm font-black text-white"
                style={{ background: "#0284C7" }}>
                <Plus size={16} />הוסף שירות ראשון
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {services.map((s, i) => (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: i * 0.04, ease }}
                    className={`bg-white rounded-3xl border border-gray-100 p-5 transition-all ${!s.isActive ? "opacity-50" : ""}`}
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl bg-gray-50">
                        ✂️
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-black text-gray-900 text-base">{s.name}</span>
                          {s.isPopular && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                              <Sparkles size={8} />פופולרי
                            </span>
                          )}
                          {!s.isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">לא פעיל</span>
                          )}
                        </div>
                        {s.description && <p className="text-sm text-gray-400 truncate mb-2">{s.description}</p>}
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full font-medium">
                            <Clock size={10} />{formatDuration(s.durationMinutes)}
                          </span>
                          {s.bufferMinutes > 0 && (
                            <span className="text-xs text-gray-400">+ {s.bufferMinutes} דק' חוצץ</span>
                          )}
                        </div>
                      </div>

                      {/* Price + actions */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="text-2xl font-black text-gray-900">{formatPrice(parseFloat(s.price))}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleToggle(s.id, s.isActive)}
                            title={s.isActive ? "השבת" : "הפעל"}
                            className="h-8 px-3 rounded-xl text-xs font-bold transition-all border"
                            style={s.isActive
                              ? { background: "#F0FDF4", color: "#16A34A", borderColor: "#BBF7D0" }
                              : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}>
                            {s.isActive ? "פעיל" : "כבוי"}
                          </button>
                          <button onClick={() => openEdit(s)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(s.id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* ── Side form panel ── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={resetForm} />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 35 }}
              className="fixed md:relative top-0 left-0 h-full w-full md:w-[380px] bg-white border-r border-gray-100 z-50 overflow-y-auto flex flex-col shadow-2xl md:shadow-none">

              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="font-black text-gray-900 text-lg">{editing ? "עריכת שירות" : "שירות חדש"}</h2>
                <button onClick={resetForm} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="flex-1 p-6 flex flex-col gap-5">

                {/* Name */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">שם השירות *</label>
                  <input placeholder="תספורת גברים" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-900 placeholder-gray-300 outline-none transition-all bg-white focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">תיאור (אופציונלי)</label>
                  <textarea placeholder="תיאור קצר של השירות..." rows={3} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-900 placeholder-gray-300 outline-none resize-none transition-all bg-white focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                </div>

                {/* Duration */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">משך הטיפול</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATION_OPTIONS.map(d => (
                      <button key={d} onClick={() => setForm(f => ({ ...f, durationMinutes: d }))}
                        className="h-11 rounded-2xl text-sm font-bold border-2 transition-all"
                        style={form.durationMinutes === d
                          ? { background: "#0284C7", borderColor: "#0284C7", color: "#fff" }
                          : { background: "#F9FAFB", borderColor: "#F3F4F6", color: "#374151" }}>
                        {d < 60 ? `${d}′` : `${d/60}ש׳`}
                      </button>
                    ))}
                  </div>
                  <input type="number" min={5} step={5} value={form.durationMinutes}
                    onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))}
                    className="mt-2 w-full h-10 px-4 rounded-xl border-2 border-gray-100 text-sm font-medium text-gray-700 outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08 transition-all" />
                </div>

                {/* Price */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">מחיר (₪)</label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₪</span>
                    <input type="number" min={0} value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                      className="w-full h-12 pr-10 pl-4 rounded-2xl border-2 border-gray-100 text-xl font-black text-gray-900 outline-none transition-all focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                  </div>
                </div>

                {/* Buffer */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">חוצץ אחרי הטיפול (דק')</label>
                  <input type="number" min={0} step={5} value={form.bufferMinutes}
                    onChange={e => setForm(f => ({ ...f, bufferMinutes: +e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-900 outline-none transition-all focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                  <p className="text-xs text-gray-400 mt-1.5">זמן בין תורים לניקוי/הכנה</p>
                </div>

                {/* Popular */}
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 transition-all"
                  style={form.isPopular ? { borderColor: "#F59E0B", background: "#FFFBEB" } : { borderColor: "#F3F4F6", background: "#F9FAFB" }}>
                  <div onClick={() => setForm(f => ({ ...f, isPopular: !f.isPopular }))}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0"
                    style={form.isPopular ? { background: "#F59E0B" } : { background: "#E5E7EB" }}>
                    {form.isPopular && <Check size={14} color="#fff" strokeWidth={3} />}
                  </div>
                  <div>
                    <p className="font-black text-gray-900 text-sm">סמן כ"פופולרי" ⭐</p>
                    <p className="text-xs text-gray-400 mt-0.5">יוצג עם תגית פופולרי בעמוד ההזמנות</p>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button onClick={resetForm}
                  className="flex-1 h-12 rounded-2xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                  ביטול
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 h-12 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all active:scale-98"
                  style={{ background: "#0284C7" }}>
                  {saving
                    ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    : <><Check size={17} strokeWidth={3} />{editing ? "שמור שינויים" : "הוסף שירות"}</>
                  }
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
