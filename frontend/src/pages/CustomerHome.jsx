import React, { useEffect, useState } from "react";
import { Scissors, Baby, User as UserIcon, Wind, ArrowLeft, Plus, Sparkles, Clock, Flame, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, fmtIQD } from "../lib/api";
import { useNavigate } from "react-router-dom";
import RatingModal from "../components/RatingModal";

const ICON = { Scissors, Baby, User: UserIcon, Wind, Sparkles, Flame };

export default function CustomerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rateBooking, setRateBooking] = useState(null);
  const [rated, setRated] = useState({});

  const load = async () => {
    const [s, b] = await Promise.all([api.get("/services"), api.get("/bookings")]);
    setServices(s.data);
    setBookings(b.data || []);
  };

  useEffect(() => { load(); }, []);

  const recent = bookings.slice(0, 4);

  return (
    <div className="px-5 pt-6 space-y-7" data-testid="customer-home">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-sm">أهلاً وسهلاً</p>
          <h1 className="text-3xl font-black mt-1">{user?.name} <span className="gold-text">·</span></h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8B6914] flex items-center justify-center text-black font-black text-lg">
          {user?.name?.[0]}
        </div>
      </header>

      <div className="relative rounded-3xl overflow-hidden gold-border slide-up" style={{ minHeight: 180 }}>
        <img src="https://images.unsplash.com/photo-1703792684940-a05aa0f1188f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwzfHxiYXJiZXIlMjBwb3J0cmFpdHxlbnwwfHx8fDE3Nzc1OTkwNzV8MA&ixlib=rb-4.1.0&q=85"
             alt="" className="absolute inset-0 w-full h-full object-cover opacity-65" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/60 to-black/90" />
        <div className="relative p-6">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB] text-[11px] font-bold">
            <Sparkles className="w-3 h-3" /> خدمة فاخرة
          </div>
          <h2 className="text-2xl font-black mt-3 leading-tight">حلاقتك<br/>عند باب بيتك</h2>
          <button data-testid="hero-book-btn" onClick={() => navigate("/app/book")}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-black font-black text-sm hover:bg-[#F3E5AB] transition">
            احجز الآن <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-black mb-3">اختر خدمتك</h3>
        <div className="grid grid-cols-2 gap-3">
          {services.map((s) => {
            const Icon = ICON[s.icon] || Scissors;
            return (
              <button key={s.key} data-testid={`service-${s.key}`}
                onClick={() => navigate(`/app/book?service=${s.key}`)}
                className="text-right p-4 rounded-2xl bg-[#121212] border border-white/5 hover:border-[#D4AF37]/50 transition group">
                <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mb-3 group-hover:bg-[#D4AF37] group-hover:text-black transition">
                  <Icon className="w-5 h-5 text-[#D4AF37] group-hover:text-black" />
                </div>
                <div className="font-bold text-base">{s.name_ar}</div>
                <div className="mt-1 text-sm gold-text font-black">{fmtIQD(s.price)}</div>
              </button>
            );
          })}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h3 className="text-lg font-black mb-3">طلباتك الأخيرة</h3>
          <div className="space-y-2">
            {recent.map((b) => (
              <div key={b.id} data-testid={`booking-${b.id}`}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-white/5">
                <div>
                  <div className="font-bold text-sm">{b.service_name}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {new Date(b.created_at).toLocaleString("ar-IQ")}
                  </div>
                  {b.status === "completed" && !rated[b.id] && (
                    <button data-testid={`rate-btn-${b.id}`}
                      onClick={() => setRateBooking(b)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-bold">
                      <Star className="w-3 h-3" /> قيّم الحلاق
                    </button>
                  )}
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      <button data-testid="fab-quick-book" onClick={() => navigate("/app/book")}
        className="fixed bottom-28 left-5 z-20 w-14 h-14 rounded-full bg-gradient-to-br from-[#F3E5AB] to-[#8B6914] text-black flex items-center justify-center shadow-2xl pulse-gold hover:scale-105 transition">
        <Plus className="w-6 h-6" strokeWidth={3} />
      </button>

      {rateBooking && (
        <RatingModal booking={rateBooking}
          onClose={() => setRateBooking(null)}
          onRated={() => { setRated({ ...rated, [rateBooking.id]: true }); load(); }} />
      )}

      {/* Footer legal links */}
      <div className="pt-4 pb-2 flex items-center justify-center gap-4 text-xs text-zinc-500">
        <button data-testid="home-link-privacy" onClick={() => navigate("/app/privacy")}
          className="hover:text-[#D4AF37] transition">سياسة الخصوصية</button>
        <span className="text-zinc-700">·</span>
        <button data-testid="home-link-terms" onClick={() => navigate("/app/terms")}
          className="hover:text-[#D4AF37] transition">الشروط والأحكام</button>
      </div>
    </div>
  );
}

export const StatusBadge = ({ status }) => {
  const map = {
    pending: { t: "قيد الانتظار", c: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    accepted: { t: "تم القبول", c: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    in_progress: { t: "جارية", c: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    completed: { t: "مكتملة", c: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    cancelled: { t: "ملغاة", c: "bg-red-500/20 text-red-400 border-red-500/30" },
    rejected: { t: "مرفوضة", c: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const v = map[status] || map.pending;
  return <span className={`px-3 py-1 rounded-full border text-[11px] font-bold ${v.c}`}>{v.t}</span>;
};
