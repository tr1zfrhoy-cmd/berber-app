import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Phone, Save, MapPin, Edit3, Shield } from "lucide-react";
import { toast } from "sonner";
import { SUPPORT } from "../lib/api";

export default function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", bio: user?.bio || "" });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile(form);
      toast.success("تم حفظ التغييرات");
    } catch {
      toast.error("خطأ");
    } finally { setBusy(false); }
  };

  const updateLocation = () => {
    navigator.geolocation?.getCurrentPosition(async (p) => {
      await updateProfile({ lat: p.coords.latitude, lng: p.coords.longitude });
      toast.success("تم تحديث موقعك");
    }, () => toast.error("لم نتمكن من جلب الموقع"));
  };

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="settings-page">
      <header>
        <p className="text-zinc-400 text-sm">الإعدادات</p>
        <h1 className="text-2xl font-black">حسابك</h1>
      </header>

      <div className="rounded-3xl p-6 gold-border bg-[#121212]">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8B6914] flex items-center justify-center text-black font-black text-2xl">
            {user?.name?.[0]}
          </div>
          <div>
            <div className="font-black text-lg">{user?.name}</div>
            <div className="text-xs text-zinc-500">{user?.email}</div>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/30">
              {user?.role === "barber" ? "حلاق" : user?.role === "admin" ? "مدير" : "زبون"}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Field icon={<User className="w-4 h-4" />} value={form.name}
            onChange={(v) => setForm({ ...form, name: v })} placeholder="الاسم" testid="settings-name" />
          <Field icon={<Phone className="w-4 h-4" />} value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })} placeholder="الهاتف" testid="settings-phone" />
          {user?.role === "barber" && (
            <Field icon={<Edit3 className="w-4 h-4" />} value={form.bio}
              onChange={(v) => setForm({ ...form, bio: v })} placeholder="نبذة عنك" testid="settings-bio" />
          )}

          <button data-testid="save-profile-btn" disabled={busy} onClick={save}
            className="w-full py-3 rounded-2xl bg-[#D4AF37] text-black font-black flex items-center justify-center gap-2 hover:bg-[#F3E5AB] transition disabled:opacity-50">
            <Save className="w-4 h-4" /> حفظ التغييرات
          </button>
        </div>
      </div>

      <div className="rounded-3xl p-5 bg-[#121212] border border-white/5 space-y-2">
        <button data-testid="update-location-btn" onClick={updateLocation}
          className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-xl transition">
          <span className="flex items-center gap-3 text-sm font-bold"><MapPin className="w-4 h-4 text-[#D4AF37]" /> تحديث موقعي</span>
          <span className="text-zinc-500 text-xs">{user?.lat ? "محدد" : "غير محدد"}</span>
        </button>
        <a href={SUPPORT.whatsapp} target="_blank" rel="noreferrer"
          className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-xl transition">
          <span className="flex items-center gap-3 text-sm font-bold"><Shield className="w-4 h-4 text-[#D4AF37]" /> تواصل مع الدعم</span>
          <span className="text-zinc-500 text-xs">واتساب</span>
        </a>
      </div>

      <button data-testid="logout-btn" onClick={() => { logout(); toast.success("تم تسجيل الخروج"); }}
        className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-black flex items-center justify-center gap-2 hover:bg-red-500/20 transition">
        <LogOut className="w-4 h-4" /> تسجيل الخروج
      </button>

      <div className="text-center text-zinc-600 text-xs py-4">
        Berber · v1.0 · 2026
      </div>
    </div>
  );
}

const Field = ({ icon, value, onChange, placeholder, testid }) => (
  <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#D4AF37] transition">
    <span className="text-zinc-500 ml-2">{icon}</span>
    <input data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="bg-transparent flex-1 outline-none text-white placeholder:text-zinc-500 text-sm" />
  </div>
);
