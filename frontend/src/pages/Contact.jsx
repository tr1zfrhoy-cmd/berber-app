import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MessageCircle, Phone, Mail, MapPin, Clock, PhoneCall } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { openWhatsApp } from "../lib/support";
import { SUPPORT } from "../lib/api";

/**
 * "Contact Us" — 100% offline capable. Every button opens a native handler:
 *   - WhatsApp: uses whatsapp:// intent (already offline-safe)
 *   - Phone:    tel: opens dialer even without internet
 *   - Email:    mailto: opens email client offline
 */
export default function Contact() {
  const { user } = useAuth();
  const phoneRaw = (SUPPORT?.whatsapp_phone || "9647512614831").replace(/\D/g, "");
  const phoneDisplay = "+" + phoneRaw;
  const emailAddr = (SUPPORT?.email || "").replace("mailto:", "") || "tr1zfrhoy@gmail.com";

  return (
    <div className="px-5 pt-6 pb-8 space-y-5" data-testid="contact-page">
      <div className="flex items-center gap-3">
        <Link to={-1} className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </Link>
        <div>
          <p className="text-zinc-400 text-sm">نحن هنا لخدمتك</p>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-[#D4AF37]" /> اتصل بنا
          </h1>
        </div>
      </div>

      <p className="text-sm text-zinc-400 leading-7 px-1">
        اختر الطريقة الأنسب لك للتواصل معنا. فريق الدعم جاهز على مدار الساعة لخدمتك 🌹
      </p>

      <div className="space-y-3">
        <ContactCard
          icon={<MessageCircle className="w-6 h-6" />}
          title="واتساب الدعم"
          subtitle="أسرع طريقة للتواصل — رد فوري"
          value={phoneDisplay}
          color="emerald"
          testid="contact-whatsapp"
          onClick={() => openWhatsApp(user)}
        />

        <ContactCard
          icon={<Phone className="w-6 h-6" />}
          title="اتصال هاتفي"
          subtitle="مكالمة مباشرة مع الدعم"
          value={phoneDisplay}
          color="gold"
          testid="contact-phone"
          href={`tel:+${phoneRaw}`}
        />

        <ContactCard
          icon={<Mail className="w-6 h-6" />}
          title="البريد الإلكتروني"
          subtitle="للاستفسارات الرسمية والشكاوى"
          value={emailAddr}
          color="blue"
          testid="contact-email"
          href={`mailto:${emailAddr}`}
        />

        <div className="rounded-2xl bg-[#121212] border border-white/5 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-[#D4AF37] flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold">مقرّنا</div>
            <div className="text-xs text-zinc-400 mt-0.5">بغداد، جمهورية العراق</div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#121212] border border-white/5 p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-[#D4AF37] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold">ساعات العمل</div>
            <div className="text-xs text-zinc-400 mt-0.5">يومياً من 8 صباحاً إلى 12 منتصف الليل</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const COLOR_MAP = {
  emerald: { bg: "bg-emerald-500", ring: "shadow-emerald-500/40" },
  gold: { bg: "bg-[#D4AF37]", ring: "shadow-[#D4AF37]/40" },
  blue: { bg: "bg-blue-500", ring: "shadow-blue-500/40" },
};

const ContactCard = ({ icon, title, subtitle, value, color, testid, href, onClick }) => {
  const c = COLOR_MAP[color] || COLOR_MAP.gold;
  const Wrapper = href ? "a" : "button";
  const wrapperProps = href
    ? { href, rel: "noopener" }
    : { type: "button", onClick };
  return (
    <Wrapper
      data-testid={testid}
      {...wrapperProps}
      className="w-full text-right rounded-2xl bg-[#121212] border border-white/5 p-4 flex items-center gap-3 hover:border-[#D4AF37]/30 transition active:scale-[0.99]"
    >
      <div className={`w-12 h-12 rounded-2xl ${c.bg} text-black flex items-center justify-center shadow-lg ${c.ring} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</div>
        <div className="text-xs text-[#D4AF37] mt-1 font-mono truncate" dir="ltr">{value}</div>
      </div>
    </Wrapper>
  );
};
