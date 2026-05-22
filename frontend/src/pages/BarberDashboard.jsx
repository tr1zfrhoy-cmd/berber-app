import React, { useEffect, useRef, useState, useCallback } from "react";
import { api, fmtIQD } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Check, X, MapPin, Phone, Clock, PowerOff, Power, Bell, BellOff, Navigation, Wallet, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "./CustomerHome";
import { errMsg, logErr } from "../lib/errors";
import { supportWhatsappUrl } from "../lib/support";

// Pleasant 3-tone notification chime via Web Audio API (no asset needed).
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [
      { f: 880, t: 0.0, d: 0.18 },   // A5
      { f: 1175, t: 0.18, d: 0.18 }, // D6
      { f: 1568, t: 0.36, d: 0.30 }, // G6
    ];
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = n.f;
      const start = ctx.currentTime + n.t;
      const end = start + n.d;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.05);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("playChime failed:", e);
    }
  }
}

export default function BarberDashboard() {
  const { user, updateProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("incoming");
  const [pushEnabled, setPushEnabled] = useState(false);
  const audioRef = useRef(null);
  const knownIdsRef = useRef(new Set());
  const firstLoadRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/bookings");
      const items = data || [];
      // Detect new pending bookings to fire notification
      const pendings = items.filter((b) => b.status === "pending" && (!b.barber_id || b.barber_id === user.id));
      if (!firstLoadRef.current) {
        pendings.forEach((b) => {
          if (!knownIdsRef.current.has(b.id)) {
            fireNotification(b);
          }
        });
      }
      knownIdsRef.current = new Set(pendings.map((b) => b.id));
      firstLoadRef.current = false;
      setBookings(items);
    } catch (e) {
      logErr("Failed to load bookings:", e);
    }
  }, [user?.id]);

  const fireNotification = (b) => {
    playChime();
    try { audioRef.current?.play().catch(() => {}); } catch (e) { logErr("audio play failed:", e); }
    toast.success(`طلب جديد · ${b.service_name} · ${fmtIQD(b.price)}`, { duration: 6000 });
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const n = new Notification("Berber · طلب حلاقة جديد", {
          body: `${b.service_name} - ${b.address}\n${fmtIQD(b.price)}`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: b.id,
          dir: "rtl",
          lang: "ar",
        });
        n.onclick = () => { window.focus(); n.close(); };
      } catch (e) {
        logErr("Notification failed:", e);
      }
    }
  };

  const enablePush = async () => {
    // Trigger a sample chime — also primes the AudioContext on user gesture
    playChime();
    if (!("Notification" in window)) return toast.error("الإشعارات غير مدعومة");
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setPushEnabled(true);
      toast.success("تم تفعيل الإشعارات");
    } else {
      toast.error("تم رفض الإشعارات");
    }
  };

  useEffect(() => {
    if ("Notification" in window) setPushEnabled(Notification.permission === "granted");
    load();
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [load]);

  const update = async (id, status) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(status === "accepted" ? "تم قبول الطلب! تم استقطاع 1,000 د.ع" : "تم تحديث الطلب");
      load();
    } catch (e) {
      toast.error(errMsg(e));
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
      <audio ref={audioRef} preload="auto" />

      <header className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm">حسابك كحلاق</p>
          <h1 className="text-2xl font-black">{user?.name}</h1>
        </div>
        <div className="flex items-center gap-2">
        <button data-testid="enable-push-btn" onClick={enablePush}
            className={`px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 border transition ${
              pushEnabled ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30"
            }`}>
            {pushEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {pushEnabled ? "تنبيه مفعّل" : "تفعيل التنبيه"}
          </button>
          <button data-testid="toggle-online-btn" onClick={toggleOnline}
            className={`px-3 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 border transition ${
              user?.is_online ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-zinc-800 text-zinc-400 border-white/10"
            }`}>
            {user?.is_online ? <><Power className="w-3.5 h-3.5" /> متاح</> : <><PowerOff className="w-3.5 h-3.5" /> غير متاح</>}
          </button>
        </div>
      </header>

      {/* Wallet balance card */}
      <div className="rounded-2xl p-4 gold-border bg-[#121212] flex items-center gap-4">
        <Wallet className="w-8 h-8 text-[#D4AF37]" />
        <div className="flex-1">
          <div className="text-xs text-zinc-400">رصيد محفظة العمولات</div>
          <div className="text-xl font-black gold-text">{fmtIQD(user?.wallet_balance || 0)}</div>
        </div>
        <a href={supportWhatsappUrl(user)} target="_blank" rel="noreferrer"
          data-testid="dashboard-topup-btn"
          className="px-3 py-2 rounded-xl bg-emerald-500 text-black font-black text-xs flex items-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" /> شحن
        </a>
      </div>


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
                <div className="text-xs text-zinc-500 mt-0.5">من: {b.customer_name}</div>
                <div className="gold-text font-black text-lg mt-1">{fmtIQD(b.price)}</div>
              </div>
              <StatusBadge status={b.status} />
            </div>

            <div className="mt-3 space-y-2 text-sm">
              {/* Address + Map link */}
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-zinc-200">{b.address}</div>
                  <a data-testid={`map-link-${b.id}`}
                    href={`https://www.google.com/maps?q=${b.lat},${b.lng}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-[#D4AF37] hover:underline">
                    <Navigation className="w-3 h-3" /> فتح الموقع في الخرائط
                  </a>
                </div>
              </div>

              {/* Customer phone (clickable) */}
              {b.customer_phone && (
                <a data-testid={`call-customer-${b.id}`}
                  href={`tel:${b.customer_phone}`}
                  className="flex items-center gap-2 text-emerald-400 font-bold hover:underline">
                  <Phone className="w-4 h-4" />
                  <span dir="ltr">{b.customer_phone}</span>
                </a>
              )}

              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(b.created_at).toLocaleString("ar-IQ")}</span>
              </div>

              {b.notes && <div className="text-xs text-zinc-400 mt-1 p-2 bg-black/30 rounded-lg">"{b.notes}"</div>}
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
