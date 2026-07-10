import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, LogOut, KeyRound, Save, Eye, EyeOff, MapPin, Shield, PhoneCall,
  MessageCircle, Info, HelpCircle, FileText, ChevronDown, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { openWhatsApp } from "../lib/support";
import { SUPPORT } from "../lib/api";
import { errMsg } from "../lib/errors";

/**
 * Slide-in settings drawer (left side for RTL).
 * Holds secondary account controls that used to live inline on the Settings page:
 *   • Change password (collapsible)
 *   • Update GPS location (barber only — passed via prop)
 *   • Support: WhatsApp + Phone call
 *   • Legal / info: About · Contact · Help · Privacy · Terms
 *   • Share app (Web Share API + clipboard fallback)
 *   • Logout (red, at the very bottom)
 *
 * All items keep their previous data-testids (link-privacy, link-terms, etc.)
 * so existing tests continue to work.
 */
export default function SettingsDrawer({
  open,
  onClose,
  onLogout,
  onUpdateLocation,   // optional — passed from Settings for barbers
  showUpdateLocation, // boolean — hide GPS button for customers
  hasLocation,        // bool — for the "محدد / غير محدد" badge
  user,
}) {
  const navigate = useNavigate();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const go = (path) => { onClose(); setTimeout(() => navigate(path), 150); };

  const changePassword = async () => {
    if (!pw.current || !pw.next) return toast.error("املأ كلمة المرور الحالية والجديدة");
    if (pw.next.length < 4) return toast.error("كلمة المرور الجديدة قصيرة جداً");
    if (pw.next !== pw.confirm) return toast.error("كلمة المرور وتأكيدها غير متطابقتين");
    setPwBusy(true);
    try {
      await api.post("/auth/change-password", { current_password: pw.current, new_password: pw.next });
      toast.success("تم تحديث كلمة المرور");
      setPw({ current: "", next: "", confirm: "" });
      setPwOpen(false);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setPwBusy(false); }
  };

  const shareApp = async () => {
    const shareData = {
      title: "Berber · حلاق دلفري",
      text: "جرّب Berber — الحلاق الفاخر يجيك لباب بيتك. حمّل التطبيق الآن:",
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success("تم نسخ الرابط! شاركه مع أصحابك");
      } else {
        toast.info("انسخ الرابط: " + shareData.url);
      }
    } catch (e) { /* user cancelled — ignore */ }
  };

  const supportPhone = (SUPPORT?.phone || "07812059874").replace(/\s+/g, "");

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="settings-drawer-backdrop"
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel — slides in from LEFT (matches hamburger on top-left in RTL) */}
      <aside
        data-testid="settings-drawer"
        aria-hidden={!open}
        className={`fixed top-0 bottom-0 left-0 z-[61] w-[86%] max-w-sm bg-[#0a0a0a] border-r border-[#D4AF37]/20 shadow-[10px_0_40px_rgba(0,0,0,0.6)] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="relative px-5 pt-6 pb-4 border-b border-white/5 shrink-0">
          <div className="absolute inset-x-0 top-0 h-24 opacity-40 pointer-events-none"
               style={{ background: "radial-gradient(ellipse at 40% 0%, rgba(212,175,55,0.22), transparent 60%)" }} />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] text-zinc-500 tracking-widest">حسابك</p>
              <h2 className="text-lg font-black gold-text mt-0.5">{user?.name || "مستخدم Berber"}</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5" dir="ltr">{user?.phone}</p>
            </div>
            <button
              data-testid="settings-drawer-close"
              onClick={onClose}
              aria-label="close"
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Change password — collapsible */}
          <div className="rounded-2xl bg-[#111] border border-white/5 overflow-hidden">
            <button
              data-testid="drawer-pw-toggle"
              onClick={() => setPwOpen((v) => !v)}
              className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/5 transition"
            >
              <KeyRound className="w-4 h-4 text-[#D4AF37]" />
              <span className="flex-1 text-right text-sm font-bold">تغيير كلمة المرور</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${pwOpen ? "rotate-180 text-[#D4AF37]" : ""}`} />
            </button>
            {pwOpen && (
              <div className="px-4 pb-4 pt-1 space-y-2 border-t border-white/5">
                <PwField placeholder="كلمة المرور الحالية" value={pw.current} type={showPw ? "text" : "password"}
                  testid="pw-current" onChange={(v) => setPw({ ...pw, current: v })} />
                <PwField placeholder="كلمة المرور الجديدة" value={pw.next} type={showPw ? "text" : "password"}
                  testid="pw-new" onChange={(v) => setPw({ ...pw, next: v })} />
                <PwField placeholder="تأكيد كلمة المرور" value={pw.confirm} type={showPw ? "text" : "password"}
                  testid="pw-confirm" onChange={(v) => setPw({ ...pw, confirm: v })} />
                <button type="button" data-testid="pw-toggle-visibility" onClick={() => setShowPw((v) => !v)}
                  className="text-[11px] text-zinc-400 flex items-center gap-1.5 hover:text-[#D4AF37] transition">
                  {showPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPw ? "إخفاء" : "عرض"}
                </button>
                <button data-testid="change-password-btn" disabled={pwBusy} onClick={changePassword}
                  className="w-full py-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-sm font-black flex items-center justify-center gap-2 hover:bg-[#D4AF37]/25 transition disabled:opacity-50">
                  <Save className="w-4 h-4" /> {pwBusy ? "جاري الحفظ..." : "تحديث"}
                </button>
              </div>
            )}
          </div>

          {/* Update location — barber only */}
          {showUpdateLocation && (
            <DrawerRow
              testid="update-location-btn"
              icon={<MapPin className="w-4 h-4 text-[#D4AF37]" />}
              label="تحديث موقعي بالـ GPS"
              right={<span className={`text-[11px] ${hasLocation ? "text-emerald-400" : "text-zinc-500"}`}>{hasLocation ? "محدد" : "غير محدد"}</span>}
              onClick={onUpdateLocation}
            />
          )}

          {/* Support group */}
          <SectionTitle>الدعم</SectionTitle>
          <DrawerRow
            testid="settings-support-whatsapp"
            icon={<MessageCircle className="w-4 h-4 text-emerald-400" />}
            label="واتساب الدعم"
            right={<span className="text-[10px] text-emerald-400 font-bold">فوري</span>}
            onClick={() => { onClose(); openWhatsApp(user); }}
          />
          <a
            data-testid="drawer-support-call"
            href={`tel:${supportPhone}`}
            onClick={onClose}
            className="w-full flex items-center gap-3 rounded-2xl bg-[#111] border border-white/5 px-4 py-3.5 hover:bg-white/5 transition"
          >
            <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
            <span className="flex-1 text-right text-sm font-bold">اتصل بالدعم</span>
            <span className="text-[11px] text-zinc-500 font-mono" dir="ltr">{supportPhone}</span>
          </a>

          {/* Info & legal */}
          <SectionTitle>معلومات</SectionTitle>
          <DrawerRow testid="link-about" icon={<Info className="w-4 h-4 text-[#D4AF37]" />}
            label="من نحن" onClick={() => go("/app/about")} />
          <DrawerRow testid="link-contact" icon={<PhoneCall className="w-4 h-4 text-[#D4AF37]" />}
            label="اتصل بنا" onClick={() => go("/app/contact")} />
          <DrawerRow testid="link-help" icon={<HelpCircle className="w-4 h-4 text-[#D4AF37]" />}
            label="الأسئلة الشائعة" onClick={() => go("/app/help")} />
          <DrawerRow testid="link-share-app" icon={<Share2 className="w-4 h-4 text-[#D4AF37]" />}
            label="شارك التطبيق" onClick={shareApp} />

          <SectionTitle>القانونية</SectionTitle>
          <DrawerRow testid="link-privacy" icon={<Shield className="w-4 h-4 text-[#D4AF37]" />}
            label="سياسة الخصوصية" onClick={() => go("/app/privacy")} />
          <DrawerRow testid="link-terms" icon={<FileText className="w-4 h-4 text-[#D4AF37]" />}
            label="الشروط والأحكام" onClick={() => go("/app/terms")} />
        </div>

        {/* Footer logout */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <button
            data-testid="logout-btn"
            onClick={() => { onClose(); onLogout(); }}
            className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-400 font-black flex items-center justify-center gap-2 hover:bg-red-500/20 active:scale-[0.98] transition"
          >
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
          <p className="text-center text-[10px] text-zinc-600 mt-3">Berber · v2.0 · 2026</p>
        </div>
      </aside>
    </>
  );
}

const SectionTitle = ({ children }) => (
  <div className="text-[10px] tracking-widest text-zinc-500 pt-2 pb-1 px-1 font-bold">
    {children}
  </div>
);

const DrawerRow = ({ testid, icon, label, right, onClick }) => (
  <button
    data-testid={testid}
    onClick={onClick}
    className="w-full flex items-center gap-3 rounded-2xl bg-[#111] border border-white/5 px-4 py-3.5 hover:bg-white/5 hover:border-[#D4AF37]/20 active:scale-[0.99] transition text-right"
  >
    {icon}
    <span className="flex-1 text-sm font-bold">{label}</span>
    {right}
  </button>
);

const PwField = ({ placeholder, value, onChange, testid, type = "password" }) => (
  <div className="flex items-center bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#D4AF37] transition">
    <KeyRound className="w-3.5 h-3.5 text-zinc-500 ml-2" />
    <input
      data-testid={testid}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="new-password"
      className="bg-transparent flex-1 outline-none text-white placeholder:text-zinc-500 text-xs"
    />
  </div>
);
