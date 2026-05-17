"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Clock, DollarSign, ToggleLeft, ToggleRight, Scissors } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/card";
import { formatPrice, formatDuration } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import type { Service } from "@/types/database";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Service | null>(null);

  const [form, setForm] = useState({
    name: "", description: "", duration_minutes: 30, price: 0, buffer_minutes: 0, is_popular: false,
  });

  const supabase = createClient();

  const loadServices = async () => {
    setLoading(true);
    const { data: member } = await supabase.from("tenant_members").select("tenant_id").single();
    if (!member) return;
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", member.tenant_id)
      .order("sort_order");
    setServices(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadServices(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("שם השירות נדרש"); return; }
    const { data: member } = await supabase.from("tenant_members").select("tenant_id").single();
    if (!member) return;

    if (editing) {
      const { error } = await supabase.from("services").update(form).eq("id", editing.id);
      if (error) { toast.error("שגיאה בעדכון"); return; }
      toast.success("השירות עודכן");
    } else {
      const { error } = await supabase.from("services").insert({ ...form, tenant_id: member.tenant_id });
      if (error) { toast.error("שגיאה ביצירה"); return; }
      toast.success("השירות נוסף");
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", description: "", duration_minutes: 30, price: 0, buffer_minutes: 0, is_popular: false });
    loadServices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("למחוק שירות זה?")) return;
    await supabase.from("services").delete().eq("id", id);
    toast.success("השירות נמחק");
    loadServices();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from("services").update({ is_active: !current }).eq("id", id);
    loadServices();
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description ?? "", duration_minutes: s.duration_minutes, price: s.price, buffer_minutes: s.buffer_minutes, is_popular: s.is_popular });
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

      {/* Form */}
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
                value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: +e.target.value }))} />
              <Input label="מחיר (₪)" type="number" min={0}
                value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
              <Input label="חוצץ (דק')" type="number" min={0} step={5}
                value={form.buffer_minutes} onChange={e => setForm(f => ({ ...f, buffer_minutes: +e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-medium text-gray-700">סמן כ"פופולרי"</span>
            </label>
          </div>
          <div className="flex gap-2 mt-5 justify-end">
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>ביטול</Button>
            <Button onClick={handleSave}>{editing ? "שמור שינויים" : "הוסף שירות"}</Button>
          </div>
        </Card>
      )}

      {/* List */}
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
            <Card key={s.id} padding="md" className={!s.is_active ? "opacity-60" : ""}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Scissors size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{s.name}</span>
                    {s.is_popular && <Badge variant="warning" size="sm">🔥 פופולרי</Badge>}
                    {!s.is_active && <Badge variant="neutral" size="sm">לא פעיל</Badge>}
                  </div>
                  {s.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} />{formatDuration(s.duration_minutes)}
                    </span>
                    {s.buffer_minutes > 0 && (
                      <span className="text-xs text-gray-400">+ {s.buffer_minutes} דק' חוצץ</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-lg text-brand-600">{formatPrice(s.price)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleToggle(s.id, s.is_active)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      {s.is_active ? <ToggleRight size={18} className="text-brand-600" /> : <ToggleLeft size={18} />}
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
