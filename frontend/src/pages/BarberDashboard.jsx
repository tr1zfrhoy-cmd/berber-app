import React, { useEffect, useState } from "react";
import { api, fmtIQD } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Check, X, MapPin, Phone, Clock, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "./CustomerHome";

export default function BarberDashboard() {
  const { user, updateProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("incoming");

  const load = async () => {
    const { data } = await api.get("/bookings");
    setBookings(data || []);
  };
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const update = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(status === "accepted" ? "تم قبول الطلب! تم استقطاع 1,000 د.ع" : "تم تحديث الطلب");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ");
    }
  };

  const incoming = bookings.filter((b) => b.status === "pending" && (!b.barber_id || b.barber_id === user.id));
  const mine = bookings.filter((b) => b.barber_id === user.id && b.status !== "pending");

  const toggleOnline = async () => {
    await updateProfile({ is_online: !user.is_online });
    toast.success(user.is_online ? "أنت غير متاح الآن" : "أنت متاح للطلبات");
  };

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="barber-dashboard">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm">حسابك كحلاق</p>
          <h1 className="text-2xl font-black">{user?.name}</h1>
        </div>
        <button data-testid="toggle-online-btn" onClick={toggleOnline}
          className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 border transition ${
            user?.is_online ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-zinc-800 text-zinc-400 border-white/10"
          }`}>
          {user?.is_online ? <><Power className="w-3.5 h-3.5" /> متاح</> : <><PowerOff className="w-3.5 h-3.5" /> غير متاح</>}
        </button>
      </header>

      <div className="flex bg-[#121212] rounded-full p-1 border border-white/5">
        <button data-testid="tab-incoming" onClick={() => setTab("incoming")}
          className={`flex-1 py-2 rounded-full text-sm font-bold transition ${tab === "incoming" ? "bg-[#D4AF37] text-black" : "text-zinc-400"}`}>
          الطلبات الواردة ({incoming.length})
        </button>
        <button data-testid="tab-mine" onClick={() => setTab("mine")}
          className={`flex-1 py-2 rounded-full text-sm font-bold transition ${tab === "mine" ? "bg-[#D4AF37] text-black" : "text-zinc-400"}`}>
          طلباتي ({mine.length})
        </button>
      </div>

      <div className="space-y-3">
        {(tab === "incoming" ? incoming : mine).map((b) => (
          <div key={b.id} data-testid={`barber-booking-${b.id}`}
            className="rounded-2xl bg-[#121212] border border-white/5 p-4 slide-up">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-black text-base">{b.service_name}</div>
                <div className="gold-text font-black text-lg mt-1">{fmtIQD(b.price)}</div>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <Row icon={<MapPin className="w-4 h-4 text-[#D4AF37]" />} text={b.address} />
              {b.customer_phone && <Row icon={<Phone className="w-4 h-4 text-[#D4AF37]" />} text={b.customer_phone} />}
              <Row icon={<Clock className="w-4 h-4 text-[#D4AF37]" />} text={new Date(b.created_at).toLocaleString("ar-IQ")} />
              {b.notes && <div className="text-xs text-zinc-400 mt-2 p-2 bg-black/30 rounded-lg">"{b.notes}"</div>}
            </div>
            {b.status === "pending" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button data-testid={`accept-${b.id}`}
                  onClick={() => update(b.id, "accepted")}
                  className="py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm flex items-center justify-center gap-1 hover:bg-emerald-400 transition">
                  <Check className="w-4 h-4" /> قبول (-1,000 د.ع)
                </button>
                <button data-testid={`reject-${b.id}`}
                  onClick={() => update(b.id, "rejected")}
                  className="py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 font-black text-sm flex items-center justify-center gap-1 hover:bg-red-500/25 transition">
                  <X className="w-4 h-4" /> رفض
                </button>
              </div>
            )}
            {b.status === "accepted" && b.barber_id === user.id && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => update(b.id, "in_progress")}
                  className="py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-sm">بدء العمل</button>
                <button onClick={() => update(b.id, "completed")}
                  className="py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black text-sm">
                  إنهاء
                </button>
              </div>
            )}
            {b.status === "in_progress" && (
              <button onClick={() => update(b.id, "completed")}
                className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500 text-black font-black text-sm">
                إنهاء الطلب
              </button>
            )}
          </div>
        ))}
        {(tab === "incoming" ? incoming : mine).length === 0 && (
          <div className="text-center py-16 text-zinc-500 text-sm">لا توجد طلبات حالياً</div>
        )}
      </div>
    </div>
  );
}

const Row = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-zinc-300"><span>{icon}</span><span>{text}</span></div>
);
