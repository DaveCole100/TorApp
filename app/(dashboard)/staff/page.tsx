"use client";
import { useState, useEffect } from "react";
import { Plus, UserCheck, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/card";
import type { Staff } from "@/lib/db/schema";

const COLORS = ["#4F46E5","#7C3AED","#DB2777","#DC2626","#16A34A","#0284C7","#EA580C"];

export default function StaffPage() {
  const [staff,    setStaff]    = useState<Staff[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Staff | null>(null);
  const [form, setForm] = useState({ name: "", role: "", bio: "", email: "", phone: "", calendarColor: "#0284C7" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(data.staff ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("שם נדרש"); return; }
    const res = editing
      ? await fetch(`/api/staff/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "שגיאה"); return; }
    toast.success(editing ? "עודכן" : "איש צוות נוסף");
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", role: "", bio: "", email: "", phone: "", calendarColor: "#0284C7" });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק?")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    toast.success("נמחק");
    load();
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role ?? "", bio: s.bio ?? "", email: s.email ?? "", phone: s.phone ?? "", calendarColor: s.calendarColor });
    setShowForm(true);
  };

  function Avatar({ name, color }: { name: string; color: string }) {
    const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
    return <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: color }}>{initials}</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">צוות</h1>
          <p className="text-sm text-gray-400 mt-0.5">{staff.length} אנשי צוות</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} size="md">
          <Plus size={16} /> הוסף איש צוות
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-brand-200 animate-in">
          <h2 className="font-bold text-gray-900 mb-4">{editing ? "עריכה" : "איש צוות חדש"}</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="שם" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
              <Input label="תפקיד" placeholder="ספר בכיר" value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} />
            </div>
            <Input label="ביוגרפיה קצרה" value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="אימייל" type="email" dir="ltr" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
              <Input label="טלפון" type="tel" dir="ltr" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">צבע לוח שנה</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f=>({...f,calendarColor:c}))}
                    className="w-8 h-8 rounded-full border-4 transition-all"
                    style={{ background: c, borderColor: form.calendarColor===c ? c : "transparent", outline: form.calendarColor===c ? `2px solid ${c}` : "none", outlineOffset: "2px" }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>ביטול</Button>
            <Button onClick={handleSave}>{editing ? "שמור" : "הוסף"}</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">{[1,2].map(i=><Skeleton key={i} className="h-20 rounded-2xl"/>)}</div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center mb-4">
            <UserCheck size={24} className="text-brand-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">אין אנשי צוות עדיין</h3>
          <p className="text-sm text-gray-400 mb-5">הוסיפו את הצוות שלכם</p>
          <Button onClick={() => setShowForm(true)}><Plus size={16} /> הוסף ראשון</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {staff.map(s => (
            <Card key={s.id} padding="md">
              <div className="flex items-center gap-4">
                <Avatar name={s.name} color={s.calendarColor} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{s.name}</p>
                  {s.role && <p className="text-xs text-brand-600 mt-0.5">{s.role}</p>}
                  {s.bio && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.bio}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
