import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Phone, Save, MapPin, Edit3, Shield, Image, Plus, Trash2, Camera, FileText, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supportWhatsappUrl } from "../lib/support";

export default function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });
  const [portfolio, setPortfolio] = useState(user?.portfolio || []);
  const [newPic, setNewPic] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ ...form, portfolio });
      toast.success("تم حفظ التغييرات");
    } catch { toast.error("خطأ"); }
    finally { setBusy(false); }
  };

  const updateLocation = () => {
    navigator.geolocation?.getCurrentPosition(async (p) => {
      await updateProfile({ lat: p.coords.latitude, lng: p.coords.longitude });
      toast.success("تم تحديث موقعك");
    }, () => toast.error("لم نتمكن من جلب الموقع"));
  };

  const addPic = () => {
    if (!newPic.trim()) return;
    setPortfolio([...portfolio, newPic.trim()]);
    setNewPic("");
  };
  const removePic = (i) => setPortfolio(portfolio.filter((_, idx) => idx !== i));

  const supportUrl = supportWhatsappUrl(user);

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="settings-page">
      <header>
        <p className="text-zinc-400 text-sm">الإعدادات</p>
        <h1 className="text-2xl font-black">حسابك</h1>
      </header>

      <div className="rounded-3xl p-6 gold-border bg-[#121212]">
        <div className="flex items-center gap-4 mb-5">
          {form.avatar ? (
            <img src={form.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border border-[#D4AF37]/40" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8B6914] flex items-center justify-center text-black font-black text-2xl">
              {user?.name?.[0]}
            </div>
          )}
          <div>
            <div className="font-black text-lg">{user?.name}</div>
            <div className="text-xs text-zinc-500" dir="ltr">{user?.phone}</div>
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
          <Field icon={<Camera className="w-4 h-4" />} value={form.avatar}
            onChange={(v) => setForm({ ...form, avatar: v })} placeholder="رابط صورتك الشخصية (URL)" testid="settings-avatar" />
          {user?.role === "barber" && (
            <Field icon={<Edit3 className="w-4 h-4" />} value={form.bio}
              onChange={(v) => setForm({ ...form, bio: v })} placeholder="نبذة عنك (مثلاً: 5 سنوات خبرة، حلاقة رجالية)" testid="settings-bio" />
          )}

          <button data-testid="save-profile-btn" disabled={busy} onClick={save}
            className="w-full py-3 rounded-2xl bg-[#D4AF37] text-black font-black flex items-center justify-center gap-2 hover:bg-[#F3E5AB] transition disabled:opacity-50">
            <Save className="w-4 h-4" /> حفظ التغييرات
          </button>
        </div>
      </div>

      {/* Portfolio (barbers) */}
      {user?.role === "barber" && (
        <div className="rounded-3xl p-5 bg-[#121212] border border-white/5">
          <h3 className="text-sm font-bold mb-1 flex items-center gap-2"><Image className="w-4 h-4 text-[#D4AF37]" /> معرض أعمالك</h3>
          <p className="text-xs text-zinc-500 mb-3">أضف صوراً لأعمالك ليراها الزبائن</p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {portfolio.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="aspect-square object-cover rounded-xl border border-white/10" />
                <button onClick={() => removePic(i)}
                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input data-testid="new-portfolio-input"
              value={newPic} onChange={(e) => setNewPic(e.target.value)}
              placeholder="الصق رابط صورة (URL)" dir="ltr"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none text-sm" />
            <button data-testid="add-portfolio-btn" onClick={addPic}
              className="px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button onClick={save} className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
            حفظ المعرض
          </button>
        </div>
      )}

      <div className="rounded-3xl p-5 bg-[#121212] border border-white/5 space-y-2">
        <button data-testid="update-location-btn" onClick={updateLocation}
          className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-xl transition">
          <span className="flex items-center gap-3 text-sm font-bold"><MapPin className="w-4 h-4 text-[#D4AF37]" /> تحديث موقعي</span>
          <span className="text-zinc-500 text-xs">{user?.lat ? "محدد" : "غير محدد"}</span>
        </button>
        <a data-testid="settings-support-whatsapp" href={supportUrl} target="_blank" rel="noreferrer"
          className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-xl transition">
          <span className="flex items-center gap-3 text-sm font-bold"><Shield className="w-4 h-4 text-[#D4AF37]" /> تواصل مع الدعم عبر واتساب</span>
          <span className="text-emerald-400 text-xs">واتساب</span>
        </a>
      </div>

      <button data-testid="logout-btn"
        onClick={() => { logout(); toast.success("تم تسجيل الخروج"); navigate("/auth", { replace: true }); }}
        className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-black flex items-center justify-center gap-2 hover:bg-red-500/20 transition">
        <LogOut className="w-4 h-4" /> تسجيل الخروج
      </button>

      {/* Legal links */}
      <div className="rounded-2xl bg-[#121212] border border-white/5 divide-y divide-white/5">
        <button data-testid="link-privacy" onClick={() => navigate("/app/privacy")}
          className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition">
          <span className="flex items-center gap-3 text-sm font-bold">
            <Shield className="w-4 h-4 text-[#D4AF37]" /> سياسة الخصوصية
          </span>
          <ChevronLeft className="w-4 h-4 text-zinc-500" />
        </button>
        <button data-testid="link-terms" onClick={() => navigate("/app/terms")}
          className="w-full flex items-center justify-between py-3.5 px-4 hover:bg-white/5 transition">
          <span className="flex items-center gap-3 text-sm font-bold">
            <FileText className="w-4 h-4 text-[#D4AF37]" /> الشروط والأحكام
          </span>
          <ChevronLeft className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      <div className="text-center text-zinc-600 text-xs py-4">
        Berber · v2.0 · 2026
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
