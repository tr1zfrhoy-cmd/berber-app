import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, Phone, Save, MapPin, Edit3, Shield, Image, Plus, Trash2, Camera, FileText, ChevronLeft, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { api } from "../lib/api";
import { supportWhatsappUrl, openWhatsApp } from "../lib/support";
import { errMsg } from "../lib/errors";
import { AvatarUpload, GalleryUpload } from "../components/ImageUpload";
import Avatar from "../components/Avatar";

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

  // Password change state (separate from profile form, no side-effects elsewhere)
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  const changePassword = async () => {
    if (!pw.current || !pw.next) return toast.error("املأ كلمة المرور الحالية والجديدة");
    if (pw.next.length < 4) return toast.error("كلمة المرور الجديدة قصيرة جداً");
    if (pw.next !== pw.confirm) return toast.error("كلمة المرور وتأكيدها غير متطابقتين");
    setPwBusy(true);
    try {
      await api.post("/auth/change-password", { current_password: pw.current, new_password: pw.next });
      toast.success("تم تحديث كلمة المرور");
      setPw({ current: "", next: "", confirm: "" });
    } catch (e) { toast.error(errMsg(e)); }
    finally { setPwBusy(false); }
  };

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
  const handleSupport = () => openWhatsApp(user);

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="settings-page">
      <header>
        <p className="text-zinc-400 text-sm">الإعدادات</p>
        <h1 className="text-2xl font-black">حسابك</h1>
      </header>

      <div className="rounded-3xl p-6 gold-border bg-[#121212]">
        <div className="flex items-center gap-4 mb-5">
          <Avatar src={form.avatar} name={user?.name} size="lg" testid="settings-profile-avatar" />
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
          <div>
            <div className="text-xs text-zinc-400 mb-2 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> الصورة الشخصية</div>
            <AvatarUpload value={form.avatar} kind="avatar" testid="settings-avatar-upload"
              onChange={(url) => { setForm({ ...form, avatar: url }); updateProfile({ avatar: url }); }} />
          </div>
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
          <p className="text-xs text-zinc-500 mb-3">ارفع صوراً من معرض هاتفك ليراها الزبائن في صفحة "أعمال الحلاقين"</p>
          <GalleryUpload value={portfolio} onChange={(arr) => {
            setPortfolio(arr);
            updateProfile({ portfolio: arr });
          }} max={10} />
        </div>
      )}

      {/* Change password */}
      <div className="rounded-3xl p-5 bg-[#121212] border border-white/5" data-testid="change-password-card">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#D4AF37]" /> كلمة المرور
        </h3>
        <p className="text-xs text-zinc-500 mb-3">حدّث كلمة المرور بشكل آمن. لا يتم عرض كلمة المرور القديمة لأسباب أمنية.</p>
        <div className="space-y-2">
          <PwField icon={<KeyRound className="w-4 h-4" />} value={pw.current} type={showPw ? "text" : "password"}
            placeholder="كلمة المرور الحالية" testid="pw-current"
            onChange={(v) => setPw({ ...pw, current: v })} />
          <PwField icon={<KeyRound className="w-4 h-4" />} value={pw.next} type={showPw ? "text" : "password"}
            placeholder="كلمة المرور الجديدة (4 أحرف على الأقل)" testid="pw-new"
            onChange={(v) => setPw({ ...pw, next: v })} />
          <PwField icon={<KeyRound className="w-4 h-4" />} value={pw.confirm} type={showPw ? "text" : "password"}
            placeholder="تأكيد كلمة المرور الجديدة" testid="pw-confirm"
            onChange={(v) => setPw({ ...pw, confirm: v })} />
          <button type="button" data-testid="pw-toggle-visibility" onClick={() => setShowPw((v) => !v)}
            className="text-xs text-zinc-400 flex items-center gap-1.5 hover:text-[#D4AF37] transition">
            {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPw ? "إخفاء كلمات المرور" : "عرض كلمات المرور"}
          </button>
          <button data-testid="change-password-btn" disabled={pwBusy} onClick={changePassword}
            className="w-full py-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-black flex items-center justify-center gap-2 hover:bg-[#D4AF37]/25 transition disabled:opacity-50">
            <Save className="w-4 h-4" /> {pwBusy ? "جاري الحفظ..." : "تحديث كلمة المرور"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl p-5 bg-[#121212] border border-white/5 space-y-2">
        <button data-testid="update-location-btn" onClick={updateLocation}
          className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-xl transition">
          <span className="flex items-center gap-3 text-sm font-bold"><MapPin className="w-4 h-4 text-[#D4AF37]" /> تحديث موقعي</span>
          <span className="text-zinc-500 text-xs">{user?.lat ? "محدد" : "غير محدد"}</span>
        </button>
        <button type="button" data-testid="settings-support-whatsapp" onClick={handleSupport}
          className="w-full flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-xl transition text-right">
          <span className="flex items-center gap-3 text-sm font-bold"><Shield className="w-4 h-4 text-[#D4AF37]" /> تواصل مع الدعم عبر واتساب</span>
          <span className="text-emerald-400 text-xs">واتساب</span>
        </button>
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

const PwField = ({ icon, value, onChange, placeholder, testid, type = "password" }) => (
  <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#D4AF37] transition">
    <span className="text-zinc-500 ml-2">{icon}</span>
    <input data-testid={testid} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      autoComplete="new-password"
      className="bg-transparent flex-1 outline-none text-white placeholder:text-zinc-500 text-sm" />
  </div>
);
