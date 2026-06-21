import React, { useEffect, useState } from "react";
import { api, fmtIQD } from "../lib/api";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";
import { Save, Plus, Trash2, Scissors, FileText, Shield, Mail, MessageCircle } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [savedFee, setSavedFee] = useState(null); // last value confirmed from DB
  const [busy, setBusy] = useState(false);
  const [feeBusy, setFeeBusy] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/settings");
      setSettings({
        platform_fee: data.platform_fee,
        services: data.services,
        support_whatsapp: data.support_whatsapp,
        support_email: data.support_email || "",
        privacy_text: data.privacy_text || "",
        terms_text: data.terms_text || "",
      });
      setSavedFee(data.platform_fee);
    } catch (e) { toast.error(errMsg(e)); }
  };

  // Per-section savers — each one persists ONLY its own subset of fields so the
  // admin can update legal text or contact info without touching commission/services.
  const saveLegal = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch("/admin/settings", {
        privacy_text: settings.privacy_text,
        terms_text: settings.terms_text,
        support_email: settings.support_email,
        support_whatsapp: settings.support_whatsapp,
      });
      setSettings((s) => ({
        ...s,
        privacy_text: data.privacy_text,
        terms_text: data.terms_text,
        support_email: data.support_email,
        support_whatsapp: data.support_whatsapp,
      }));
      toast.success("تم حفظ النصوص القانونية وبيانات التواصل");
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  // Dedicated commission saver — persists JUST the fee to the DB.
  const saveFee = async () => {
    const n = parseInt(settings.platform_fee);
    if (isNaN(n) || n < 0) return toast.error("أدخل قيمة صحيحة للعمولة");
    setFeeBusy(true);
    try {
      const { data } = await api.patch("/admin/settings", { platform_fee: n });
      setSavedFee(data.platform_fee);
      setSettings((s) => ({ ...s, platform_fee: data.platform_fee }));
      toast.success(`تم حفظ العمولة: ${data.platform_fee.toLocaleString("ar-IQ")} د.ع`);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setFeeBusy(false); }
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
        <button data-testid="save-fee-btn" onClick={saveFee} disabled={feeBusy}
          className="mt-3 w-full py-3 rounded-xl bg-emerald-500 text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-50">
          <Save className="w-4 h-4" /> {feeBusy ? "جاري الحفظ..." : "حفظ العمولة في قاعدة البيانات"}
        </button>
        {savedFee !== null && (
          <div className="mt-2 text-center text-[11px] text-zinc-500">
            القيمة المحفوظة حالياً في القاعدة: <span className="gold-text font-black">{savedFee.toLocaleString("ar-IQ")} د.ع</span>
          </div>
        )}
      </div>

      {/* WhatsApp + Email (contact info, used dynamically inside legal pages) */}
      <div className="rounded-2xl bg-[#121212] border border-white/5 p-5 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#D4AF37]" /> بيانات التواصل
        </h3>
        <div className="space-y-2">
          <label className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" /> رقم واتساب الدعم
          </label>
          <input data-testid="whatsapp-input"
            value={settings.support_whatsapp}
            onChange={(e) => setSettings({ ...settings, support_whatsapp: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm"
            dir="ltr" placeholder="9647812059874" />
          <div className="text-[11px] text-zinc-500">صيغة دولية بدون + (مثال: 9647812059874)</div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> البريد الإلكتروني للدعم
          </label>
          <input data-testid="email-input"
            value={settings.support_email}
            onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm"
            dir="ltr" placeholder="support@berber.app" />
        </div>
      </div>

      {/* Legal: Privacy Policy + Terms editor */}
      <div className="rounded-2xl bg-[#121212] border border-[#D4AF37]/20 p-5 space-y-4" data-testid="legal-editor">
        <header>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4AF37]" /> النصوص القانونية
          </h3>
          <p className="text-[11px] text-zinc-500 mt-1 leading-5">
            عدّل النصوص بالكامل. التغييرات تظهر فوراً للمستخدمين بعد الحفظ.<br />
            <span className="text-[#D4AF37] font-bold">{`{{whatsapp}}`}</span> و <span className="text-[#D4AF37] font-bold">{`{{email}}`}</span> يتم استبدالهما تلقائياً بقيم التواصل أعلاه.<br />
            تنسيقات مدعومة: <code className="text-[#D4AF37]">## عنوان</code>، <code className="text-[#D4AF37]">- نقطة</code>، <code className="text-[#D4AF37]">**عريض**</code>.
          </p>
        </header>

        <div className="space-y-2">
          <label className="text-xs font-bold flex items-center gap-1.5 text-zinc-300">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" /> سياسة الخصوصية
          </label>
          <textarea
            data-testid="privacy-textarea"
            value={settings.privacy_text}
            onChange={(e) => setSettings({ ...settings, privacy_text: e.target.value })}
            rows={14}
            dir="rtl"
            spellCheck={false}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none text-xs font-mono leading-6 resize-y focus:border-[#D4AF37]/50"
            placeholder="# سياسة الخصوصية..."
          />
          <div className="text-[10px] text-zinc-500 text-left" dir="ltr">
            {(settings.privacy_text || "").length} chars
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold flex items-center gap-1.5 text-zinc-300">
            <FileText className="w-3.5 h-3.5 text-[#D4AF37]" /> الشروط والأحكام
          </label>
          <textarea
            data-testid="terms-textarea"
            value={settings.terms_text}
            onChange={(e) => setSettings({ ...settings, terms_text: e.target.value })}
            rows={14}
            dir="rtl"
            spellCheck={false}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 outline-none text-xs font-mono leading-6 resize-y focus:border-[#D4AF37]/50"
            placeholder="# الشروط والأحكام..."
          />
          <div className="text-[10px] text-zinc-500 text-left" dir="ltr">
            {(settings.terms_text || "").length} chars
          </div>
        </div>

        <button data-testid="save-legal-btn" onClick={saveLegal} disabled={busy}
          className="w-full py-3 rounded-xl bg-emerald-500 text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 transition disabled:opacity-50">
          <Save className="w-4 h-4" /> {busy ? "جاري الحفظ..." : "حفظ النصوص القانونية والتواصل"}
        </button>
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
