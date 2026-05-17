"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Clock, ToggleLeft, ToggleRight, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/card";
import { formatPrice, formatDuration } from "@/lib/utils/format";
import type { Service } from "@/lib/db/schema";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Service | null>(null);

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

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("שם השירות נדרש"); return; }
    const res = editing
      ? await fetch(`/api/services/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "שגיאה"); return; }
    toast.success(editing ? "השירות עודכן" : "השירות נוסף");
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", description: "", durationMinutes: 30, price: 0, bufferMinutes: 0, isPopular: false });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק שירות זה?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    toast.success("השירות נמחק");
    load();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await fetch(`/api/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    load();
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      durationMinutes: s.durationMinutes,
      price: parseFloat(s.price),
      bufferMinutes: s.bufferMinutes,
      isPopular: s.isPopular,
    });
    setShowForm(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">שירותים</h1>
          <p className="text-sm text-gray-400 mt-0.5">{services.length} שירותים</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} size="md">
          <Plus size={16} /> שירות חדש
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-brand-200 shadow-card-md animate-in">
          <h2 className="font-bold text-gray-900 mb-4">{editing ? "עריכת שירות" : "שירות חדש"}</h2>
          <div className="grid gap-4">
            <Input label="שם השירות" placeholder="תספורת גברים" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="תיאור (אופציונלי)" placeholder="תיאור קצר..."
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="משך (דק')" type="number" min={5} step={5}
                value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: +e.target.value }))} />
              <Input label="מחיר (₪)" type="number" min={0}
                value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
              <Input label="חוצץ (דק')" type="number" min={0} step={5}
                value={form.bufferMinutes} onChange={e => setForm(f => ({ ...f, bufferMinutes: +e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPopular} onChange={e => setForm(f => ({ ...f, isPopular: e.target.checked }))} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-medium text-gray-700">סמן כ"פופולרי"</span>
            </label>
          </div>
          <div className="flex gap-2 mt-5 justify-end">
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>ביטול</Button>
            <Button onClick={handleSave}>{editing ? "שמור שינויים" : "הוסף שירות"}</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center mb-4">
            <Scissors size={24} className="text-brand-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">אין שירותים עדיין</h3>
          <p className="text-sm text-gray-400 mb-5">הוסיפו את השירותים שאתם מציעים</p>
          <Button onClick={() => setShowForm(true)}><Plus size={16} /> הוסף שירות ראשון</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {services.map(s => (
            <Card key={s.id} padding="md" className={!s.isActive ? "opacity-60" : ""}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Scissors size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{s.name}</span>
                    {s.isPopular && <Badge variant="warning" size="sm">🔥 פופולרי</Badge>}
                    {!s.isActive && <Badge variant="neutral" size="sm">לא פעיל</Badge>}
                  </div>
                  {s.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} />{formatDuration(s.durationMinutes)}
                    </span>
                    {s.bufferMinutes > 0 && (
                      <span className="text-xs text-gray-400">+ {s.bufferMinutes} דק' חוצץ</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-lg text-brand-600">{formatPrice(parseFloat(s.price))}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(s.id, s.isActive)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      {s.isActive ? <ToggleRight size={18} className="text-brand-600" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
