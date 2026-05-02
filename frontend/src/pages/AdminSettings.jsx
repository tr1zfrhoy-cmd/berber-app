import React, { useEffect, useState } from "react";
import { api, fmtIQD } from "../lib/api";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";
import { Save, Plus, Trash2, Scissors } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/settings");
      setSettings({ platform_fee: data.platform_fee, services: data.services, support_whatsapp: data.support_whatsapp });
    } catch (e) { toast.error(errMsg(e)); }
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.patch("/admin/settings", settings);
      toast.success("تم حفظ الإعدادات");
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const updateService = (i, k, v) => {
    const list = [...settings.services];
    list[i] = { ...list[i], [k]: v };
    setSettings({ ...settings, services: list });
  };

  const addService = () => {
    const key = `svc_${Date.now()}`;
    setSettings({
      ...settings,
      services: [...settings.services, { key, name_ar: "خدمة جديدة", price: 5000, icon: "Scissors", active: true }],
    });
  };

  const removeService = (i) => {
    const list = [...settings.services];
    list.splice(i, 1);
    setSettings({ ...settings, services: list });
  };

  if (!settings) return <div className="px-5 pt-10 text-center text-zinc-500">...</div>;

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="admin-settings">
      <header>
        <p className="text-zinc-400 text-sm">الإعدادات العامة</p>
        <h1 className="text-2xl font-black">التحكم الكامل</h1>
      </header>

      {/* Platform fee */}
      <div className="rounded-2xl bg-[#121212] border border-white/5 p-5">
        <h3 className="text-sm font-bold mb-3">قيمة الاستقطاع (العمولة) لكل حلاقة</h3>
        <div className="flex items-center gap-2">
          <input data-testid="fee-input"
            type="number" inputMode="numeric"
            value={settings.platform_fee}
            onChange={(e) => setSettings({ ...settings, platform_fee: parseInt(e.target.value) || 0 })}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm font-black"
            dir="ltr" style={{ textAlign: "right" }} />
          <span className="text-zinc-400 text-sm">د.ع</span>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="rounded-2xl bg-[#121212] border border-white/5 p-5">
        <h3 className="text-sm font-bold mb-3">رقم واتساب الدعم</h3>
        <input data-testid="whatsapp-input"
          value={settings.support_whatsapp}
          onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm"
          dir="ltr" placeholder="9647812059874" />
        <div className="text-[11px] text-zinc-500 mt-2">صيغة دولية بدون + (مثال: 9647812059874)</div>
      </div>

      {/* Services */}
      <div className="rounded-2xl bg-[#121212] border border-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">الخدمات والأسعار</h3>
          <button data-testid="add-service-btn" onClick={addService}
            className="px-3 py-1.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold flex items-center gap-1">
            <Plus className="w-3 h-3" /> خدمة
          </button>
        </div>
        <div className="space-y-2">
          {settings.services.map((s, i) => (
            <div key={s.key + i} className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#D4AF37]" />
                <input data-testid={`svc-name-${i}`}
                  value={s.name_ar} onChange={(e) => updateService(i, "name_ar", e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm font-bold" />
                <button onClick={() => removeService(i)} className="text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input data-testid={`svc-price-${i}`}
                  type="number" inputMode="numeric"
                  value={s.price} onChange={(e) => updateService(i, "price", parseInt(e.target.value) || 0)}
                  className="w-32 bg-black/50 border border-white/10 rounded-lg px-3 py-2 outline-none text-sm"
                  dir="ltr" style={{ textAlign: "right" }} />
                <span className="text-zinc-400 text-xs">د.ع</span>
                <label className="mr-auto flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={s.active !== false}
                    onChange={(e) => updateService(i, "active", e.target.checked)} />
                  <span className="text-zinc-300">مفعّلة</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">أيقونة:</span>
                <select value={s.icon || "Scissors"}
                  onChange={(e) => updateService(i, "icon", e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 outline-none text-xs">
                  {["Scissors", "Baby", "User", "Wind", "Sparkles", "Flame"].map((ic) => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
                <span className="text-xs text-zinc-500 mr-auto" dir="ltr">key: {s.key}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button data-testid="save-settings-btn" onClick={save} disabled={busy}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#8B6914] text-black font-black flex items-center justify-center gap-2 disabled:opacity-50">
        <Save className="w-4 h-4" /> {busy ? "جاري الحفظ..." : "حفظ كل التغييرات"}
      </button>
    </div>
  );
}
