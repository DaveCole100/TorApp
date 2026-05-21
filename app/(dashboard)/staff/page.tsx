"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, UserCheck, Pencil, Trash2, X, Check, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import type { Staff } from "@/lib/db/schema";

const ease = [0.22, 1, 0.36, 1] as const;

const COLORS = ["#4F46E5","#7C3AED","#DB2777","#DC2626","#16A34A","#0284C7","#EA580C","#374151"];

function Avatar({ name, color, size = "lg" }: { name: string; color: string; size?: "sm" | "lg" }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const cls = size === "lg"
    ? "w-14 h-14 rounded-2xl text-xl font-black"
    : "w-10 h-10 rounded-xl text-sm font-bold";
  return (
    <div className={`${cls} flex items-center justify-center text-white shrink-0`} style={{ background: color }}>
      {initials}
    </div>
  );
}

export default function StaffPage() {
  const [staff,    setStaff]    = useState<Staff[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Staff | null>(null);
  const [saving,   setSaving]   = useState(false);

  const [form, setForm] = useState({
    name: "", role: "", bio: "", email: "", phone: "", calendarColor: "#0284C7",
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(data.staff ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: "", role: "", bio: "", email: "", phone: "", calendarColor: "#0284C7" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("שם נדרש"); return; }
    setSaving(true);
    const res = editing
      ? await fetch(`/api/staff/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? "שגיאה"); return; }
    toast.success(editing ? "איש הצוות עודכן" : "איש הצוות נוסף");
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק איש צוות זה?")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    toast.success("נמחק");
    load();
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role ?? "", bio: s.bio ?? "", email: s.email ?? "", phone: s.phone ?? "", calendarColor: s.calendarColor });
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
              <h1 className="text-3xl font-black text-gray-900">צוות</h1>
              <p className="text-sm text-gray-400 mt-0.5">{staff.length} אנשי צוות</p>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 h-11 px-5 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-md hover:shadow-lg"
              style={{ background: "#0284C7" }}>
              <Plus size={17} strokeWidth={2.5} />
              הוסף איש צוות
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => <div key={i} className="h-28 skeleton rounded-3xl" />)}
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 bg-blue-50">
                <UserCheck size={32} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">אין אנשי צוות עדיין</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-xs">הוספת אנשי צוות תאפשר ללקוחות לבחור את הנותן שירות המועדף עליהם</p>
              <button onClick={() => setShowForm(true)}
                className="flex items-center gap-2 h-11 px-6 rounded-2xl text-sm font-black text-white"
                style={{ background: "#0284C7" }}>
                <Plus size={16} />הוסף ראשון
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence initial={false}>
                {staff.map((s, i) => (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: i * 0.04, ease }}
                    className="bg-white rounded-3xl border border-gray-100 p-5"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>

                    <div className="flex items-center gap-4">
                      <Avatar name={s.name} color={s.calendarColor} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-black text-gray-900 text-base">{s.name}</span>
                          {!s.isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">לא פעיל</span>
                          )}
                        </div>
                        {s.role && (
                          <p className="text-xs font-bold mb-1" style={{ color: s.calendarColor }}>{s.role}</p>
                        )}
                        {s.bio && <p className="text-xs text-gray-400 truncate mb-2">{s.bio}</p>}
                        <div className="flex items-center gap-3">
                          {s.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone size={10} />{s.phone}
                            </span>
                          )}
                          {s.email && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Mail size={10} />{s.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(s)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(s.id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 size={15} />
                        </button>
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
                <div className="flex items-center gap-3">
                  {form.name && (
                    <Avatar name={form.name || "?"} color={form.calendarColor} size="sm" />
                  )}
                  <h2 className="font-black text-gray-900 text-lg">{editing ? "עריכת איש צוות" : "איש צוות חדש"}</h2>
                </div>
                <button onClick={resetForm} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="flex-1 p-6 flex flex-col gap-5">

                {/* Name */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">שם *</label>
                  <input placeholder="דני כהן" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-900 placeholder-gray-300 outline-none transition-all bg-white focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                </div>

                {/* Role */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">תפקיד</label>
                  <input placeholder="ספר בכיר" value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-900 placeholder-gray-300 outline-none transition-all bg-white focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                </div>

                {/* Bio */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-2">ביוגרפיה קצרה</label>
                  <textarea placeholder="קצת על איש הצוות..." rows={3} value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-900 placeholder-gray-300 outline-none resize-none transition-all bg-white focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                </div>

                {/* Phone + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-black text-gray-700 block mb-2">טלפון</label>
                    <input type="tel" dir="ltr" placeholder="050-0000000" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-900 placeholder-gray-300 outline-none transition-all bg-white focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                  </div>
                  <div>
                    <label className="text-sm font-black text-gray-700 block mb-2">אימייל</label>
                    <input type="email" dir="ltr" placeholder="staff@example.com" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full h-12 px-4 rounded-2xl border-2 border-gray-100 text-sm font-medium text-gray-900 placeholder-gray-300 outline-none transition-all bg-white focus:border-[#0284C7] focus:ring-4 focus:ring-[#0284C7]/08" />
                  </div>
                </div>

                {/* Calendar color */}
                <div>
                  <label className="text-sm font-black text-gray-700 block mb-3">צבע בלוח שנה</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, calendarColor: c }))}
                        className="w-10 h-10 rounded-full transition-all"
                        style={{
                          background: c,
                          outline: form.calendarColor === c ? `3px solid ${c}` : "3px solid transparent",
                          outlineOffset: "3px",
                          transform: form.calendarColor === c ? "scale(1.15)" : "scale(1)",
                        }} />
                    ))}
                  </div>
                </div>

                {/* Live preview */}
                {form.name && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-3">תצוגה מקדימה</p>
                    <div className="flex items-center gap-3">
                      <Avatar name={form.name} color={form.calendarColor} size="sm" />
                      <div>
                        <p className="font-black text-gray-900 text-sm">{form.name}</p>
                        {form.role && <p className="text-xs font-bold mt-0.5" style={{ color: form.calendarColor }}>{form.role}</p>}
                      </div>
                    </div>
                  </div>
                )}
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
                    : <><Check size={17} strokeWidth={3} />{editing ? "שמור שינויים" : "הוסף"}</>
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
