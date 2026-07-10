import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Save, Edit3, Image as ImageIcon, Camera, Menu } from "lucide-react";
import { toast } from "sonner";
import { AvatarUpload, GalleryUpload } from "../components/ImageUpload";
import Avatar from "../components/Avatar";
import SettingsDrawer from "../components/SettingsDrawer";

/**
 * Slim, focused Settings page.
 *   • Profile card (avatar, name, phone, [bio for barber], save)
 *   • Portfolio grid (barber only)
 *   • Everything else — password, GPS, support, legal, share, logout —
 *     lives inside the SettingsDrawer, opened by the hamburger button.
 */
export default function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const isBarber = user?.role === "barber";

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });
  const [portfolio, setPortfolio] = useState(user?.portfolio || []);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ ...form, portfolio });
      toast.success("تم حفظ التغييرات");
    } catch { toast.error("خطأ"); }
    finally { setBusy(false); }
  };

  const updateLocation = () => {
    if (!navigator.geolocation) return toast.error("الجهاز لا يدعم الموقع");
    navigator.geolocation.getCurrentPosition(async (p) => {
      await updateProfile({ lat: p.coords.latitude, lng: p.coords.longitude });
      toast.success("تم تحديث موقعك");
    }, () => toast.error("لم نتمكن من جلب الموقع"));
  };

  const doLogout = () => {
    logout();
    toast.success("تم تسجيل الخروج");
    navigate("/auth", { replace: true });
  };

  const roleLabel = user?.role === "barber" ? "حلاق" : user?.role === "admin" ? "مدير" : "زبون";

  return (
    <div className="px-5 pt-6 pb-8 space-y-5" data-testid="settings-page">
      {/* Header with hamburger (top-left in RTL) */}
      <header className="flex items-start justify-between">
        <button
          data-testid="settings-drawer-open"
          onClick={() => setDrawerOpen(true)}
          aria-label="menu"
          className="w-11 h-11 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center hover:border-[#D4AF37]/40 active:scale-95 transition"
        >
          <Menu className="w-5 h-5 text-[#D4AF37]" />
        </button>
        <div className="text-right">
          <p className="text-zinc-400 text-sm">الإعدادات</p>
          <h1 className="text-2xl font-black">حسابك</h1>
        </div>
      </header>

      {/* Profile card */}
      <section className="rounded-3xl p-6 gold-border bg-[#121212]" data-testid="settings-profile-card">
        <div className="flex items-center gap-4 mb-5">
          <Avatar src={form.avatar} name={user?.name} size="lg" testid="settings-profile-avatar" />
          <div>
            <div className="font-black text-lg">{user?.name}</div>
            <div className="text-xs text-zinc-500" dir="ltr">{user?.phone}</div>
            <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/30">
              {roleLabel}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Field icon={<User className="w-4 h-4" />} value={form.name}
            onChange={(v) => setForm({ ...form, name: v })} placeholder="الاسم" testid="settings-name" />
          <Field icon={<Phone className="w-4 h-4" />} value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })} placeholder="الهاتف" testid="settings-phone" />

          <div>
            <div className="text-xs text-zinc-400 mb-2 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> الصورة الشخصية
            </div>
            <AvatarUpload
              value={form.avatar}
              kind="avatar"
              testid="settings-avatar-upload"
              onChange={(url) => { setForm({ ...form, avatar: url }); updateProfile({ avatar: url }); }}
            />
          </div>

          {isBarber && (
            <Field icon={<Edit3 className="w-4 h-4" />} value={form.bio}
              onChange={(v) => setForm({ ...form, bio: v })}
              placeholder="نبذة عنك (مثلاً: 5 سنوات خبرة، حلاقة رجالية)"
              testid="settings-bio" />
          )}

          <button data-testid="save-profile-btn" disabled={busy} onClick={save}
            className="w-full py-3 rounded-2xl bg-[#D4AF37] text-black font-black flex items-center justify-center gap-2 hover:bg-[#F3E5AB] active:scale-[0.99] transition disabled:opacity-50">
            <Save className="w-4 h-4" /> حفظ التغييرات
          </button>
        </div>
      </section>

      {/* Portfolio — barbers only, main surface */}
      {isBarber && (
        <section className="rounded-3xl p-5 bg-[#121212] border border-white/5" data-testid="settings-portfolio">
          <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#D4AF37]" /> معرض أعمالك
          </h3>
          <p className="text-xs text-zinc-500 mb-3">ارفع صوراً من معرض هاتفك ليراها الزبائن في صفحة "أعمال الحلاقين"</p>
          <GalleryUpload
            value={portfolio}
            onChange={(arr) => { setPortfolio(arr); updateProfile({ portfolio: arr }); }}
            max={10}
          />
        </section>
      )}

      {/* Drawer */}
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={doLogout}
        onUpdateLocation={updateLocation}
        showUpdateLocation={isBarber}
        hasLocation={!!user?.lat}
        user={user}
      />
    </div>
  );
}

const Field = ({ icon, value, onChange, placeholder, testid }) => (
  <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#D4AF37] transition">
    <span className="text-zinc-500 ml-2">{icon}</span>
    <input
      data-testid={testid}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-transparent flex-1 outline-none text-white placeholder:text-zinc-500 text-sm"
    />
  </div>
);
