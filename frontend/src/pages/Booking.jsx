import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, fmtIQD } from "../lib/api";
import { ChevronLeft, MapPin, Scissors, Baby, User as UserIcon, Wind, Check, Sparkles, Flame } from "lucide-react";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";

const ICON = { Scissors, Baby, User: UserIcon, Wind, Sparkles, Flame };

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const [services, setServices] = useState([]);
  const [serviceKey, setServiceKey] = useState(params.get("service") || "full");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);
  const barberId = params.get("barber");

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data));
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoords({ lat: 33.3152, lng: 44.3661 })
    );
  }, []);

  const selected = services.find((s) => s.key === serviceKey);

  const [addressError, setAddressError] = useState(false);
  const submit = async () => {
    if (!address.trim()) {
      setAddressError(true);
      toast.error("الرجاء إدخال العنوان قبل التأكيد");
      return;
    }
    setAddressError(false);
    if (!coords) return toast.error("لم نتمكن من تحديد الموقع");
    setBusy(true);
    try {
      await api.post("/bookings", {
        service_key: serviceKey,
        address,
        notes,
        lat: coords.lat,
        lng: coords.lng,
        barber_id: barberId || null,
      });
      toast.success("تم إرسال الطلب! بانتظار حلاق");
      navigate("/app");
    } catch (e) {
      toast.error(errMsg(e, "خطأ أثناء الحجز"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="booking-page">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="text-2xl font-black">حجز جديد</h1>
      </div>

      <div>
        <h3 className="text-sm text-zinc-400 mb-2">الخدمة</h3>
        <div className="grid grid-cols-2 gap-2">
          {services.map((s) => {
            const Icon = ICON[s.icon] || Scissors;
            const active = serviceKey === s.key;
            return (
              <button key={s.key} data-testid={`pick-service-${s.key}`}
                onClick={() => setServiceKey(s.key)}
                className={`text-right p-4 rounded-2xl border transition ${active ? "bg-[#D4AF37]/10 border-[#D4AF37]" : "bg-[#121212] border-white/10"}`}>
                <div className="flex items-start justify-between">
                  <Icon className={`w-5 h-5 ${active ? "text-[#D4AF37]" : "text-zinc-500"}`} />
                  {active && <Check className="w-4 h-4 text-[#D4AF37]" />}
                </div>
                <div className="font-bold text-sm mt-3">{s.name_ar}</div>
                <div className="gold-text font-black text-sm">{fmtIQD(s.price)}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm text-zinc-400 mb-2">العنوان</h3>
        <div className={`bg-[#121212] border rounded-2xl px-4 py-3 flex items-start gap-3 transition ${addressError ? "border-red-500" : "border-white/10"}`}>
          <MapPin className={`w-5 h-5 mt-0.5 ${addressError ? "text-red-500" : "text-[#D4AF37]"}`} />
          <textarea data-testid="booking-address-input"
            value={address} onChange={(e) => { setAddress(e.target.value); if (addressError) setAddressError(false); }}
            rows={2} placeholder="مثال: الكرادة، شارع 62، عمارة 12، الطابق 3"
            className="bg-transparent flex-1 outline-none text-white placeholder:text-zinc-500 text-sm resize-none" />
        </div>
        {addressError && <div className="text-xs text-red-400 mt-2">الرجاء إدخال العنوان</div>}
      </div>

      <div>
        <h3 className="text-sm text-zinc-400 mb-2">ملاحظات (اختياري)</h3>
        <input data-testid="booking-notes-input"
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="أي تفاصيل إضافية للحلاق"
          className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 outline-none text-sm placeholder:text-zinc-500" />
      </div>

      <div className="rounded-2xl bg-[#121212] border border-white/10 p-4 space-y-2">
        <Row k="السعر" v={fmtIQD(selected?.price || 0)} />
        <Row k="رسوم التوصيل" v="مجاني" />
        <div className="border-t border-white/10 my-2" />
        <Row k="الإجمالي" v={fmtIQD(selected?.price || 0)} bold />
      </div>

      <button data-testid="confirm-booking-btn" disabled={busy} onClick={submit}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#8B6914] text-black font-black hover:opacity-90 transition disabled:opacity-50">
        {busy ? "جاري الإرسال..." : `تأكيد الحجز · ${fmtIQD(selected?.price || 0)}`}
      </button>
    </div>
  );
}

const Row = ({ k, v, bold }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-zinc-400">{k}</span>
    <span className={bold ? "gold-text font-black text-base" : "text-white font-bold"}>{v}</span>
  </div>
);
