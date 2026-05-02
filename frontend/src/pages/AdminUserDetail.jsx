import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fmtIQD } from "../lib/api";
import { ChevronLeft, Phone, MapPin, Wallet as WalletIcon, Plus, Minus, Star } from "lucide-react";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";
import { StatusBadge } from "./CustomerHome";

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/admin/users/${id}`);
      setData(data);
    } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { load(); }, [id]);

  const topup = async (sign) => {
    const n = parseInt(amount);
    if (!n || isNaN(n)) return toast.error("أدخل مبلغاً صحيحاً");
    setBusy(true);
    try {
      await api.post(`/admin/users/${id}/wallet`, { amount: sign * n, reason });
      toast.success(sign > 0 ? `تم شحن ${n.toLocaleString("ar-IQ")} د.ع` : `تم خصم ${n.toLocaleString("ar-IQ")} د.ع`);
      setAmount(""); setReason("");
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  if (!data) return <div className="px-5 pt-10 text-center text-zinc-500">...</div>;
  const { user, bookings, txns } = data;

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="admin-user-detail">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="text-xl font-black">{user.name}</h1>
      </div>

      {/* Profile header */}
      <div className="rounded-3xl p-5 gold-border bg-[#121212] flex items-center gap-4">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-20 h-20 rounded-2xl object-cover border border-[#D4AF37]/40" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8B6914] text-black font-black text-3xl flex items-center justify-center">
            {user.name?.[0]}
          </div>
        )}
        <div className="flex-1">
          <div className="font-black text-lg">{user.name}</div>
          <a href={`tel:${user.phone}`} className="flex items-center gap-1 text-emerald-400 text-sm mt-1" dir="ltr">
            <Phone className="w-3.5 h-3.5" /> {user.phone}
          </a>
          <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            user.role === "barber" ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30"
              : user.role === "admin" ? "bg-red-500/15 text-red-400 border-red-500/30"
              : "bg-blue-500/15 text-blue-400 border-blue-500/30"
          }`}>
            {user.role === "barber" ? "حلاق" : user.role === "admin" ? "مدير" : "زبون"}
          </span>
          {user.role === "barber" && user.rating_count > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-[#D4AF37]">
              <Star className="w-3 h-3 fill-[#D4AF37]" /> {user.rating_avg?.toFixed(1)} ({user.rating_count} تقييم)
            </div>
          )}
        </div>
      </div>

      {/* Wallet (barbers only) */}
      {user.role === "barber" && (
        <div className="rounded-3xl p-5 bg-[#121212] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-zinc-400 mb-1">رصيد المحفظة</div>
              <div className="text-3xl font-black gold-text">{fmtIQD(user.wallet_balance || 0)}</div>
            </div>
            <WalletIcon className="w-8 h-8 text-[#D4AF37]" />
          </div>

          <div className="space-y-2">
            <input data-testid="topup-amount-input"
              type="number" inputMode="numeric" placeholder="المبلغ (د.ع)"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm"
              dir="ltr" style={{ textAlign: "right" }} />
            <input data-testid="topup-reason-input"
              placeholder="سبب العملية (اختياري)"
              value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none text-sm" />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button data-testid="topup-add-btn" disabled={busy} onClick={() => topup(1)}
                className="py-3 rounded-xl bg-emerald-500 text-black font-black text-sm flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> شحن
              </button>
              <button data-testid="topup-sub-btn" disabled={busy} onClick={() => topup(-1)}
                className="py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-black text-sm flex items-center justify-center gap-1">
                <Minus className="w-4 h-4" /> خصم
              </button>
            </div>
          </div>

          {/* Transactions */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-zinc-400 mb-2">معاملات المحفظة</h3>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {txns.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 text-xs">
                  <div>
                    <div className="font-bold">{t.reason || t.kind}</div>
                    <div className="text-zinc-500 text-[10px]">{new Date(t.created_at).toLocaleString("ar-IQ")}</div>
                  </div>
                  <div className={`font-black ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {t.amount >= 0 ? "+" : ""}{fmtIQD(t.amount)}
                  </div>
                </div>
              ))}
              {txns.length === 0 && <div className="text-center text-zinc-500 text-xs py-4">لا معاملات بعد</div>}
            </div>
          </div>
        </div>
      )}

      {/* Portfolio (barbers only) */}
      {user.role === "barber" && user.portfolio?.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-400 mb-2">معرض الأعمال</h3>
          <div className="grid grid-cols-3 gap-2">
            {user.portfolio.map((url, i) => (
              <img key={i} src={url} alt="" className="aspect-square object-cover rounded-xl border border-white/10" />
            ))}
          </div>
        </div>
      )}

      {/* Location */}
      {user.lat && user.lng && (
        <a href={`https://www.google.com/maps?q=${user.lat},${user.lng}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-2 p-3 rounded-xl bg-[#121212] border border-white/5 text-sm text-[#D4AF37]">
          <MapPin className="w-4 h-4" /> فتح الموقع في الخرائط
        </a>
      )}

      {/* Bookings */}
      <div>
        <h3 className="text-sm font-bold text-zinc-400 mb-2">الحجوزات ({bookings.length})</h3>
        <div className="space-y-2">
          {bookings.slice(0, 10).map((b) => (
            <div key={b.id} className="p-3 rounded-xl bg-[#121212] border border-white/5 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">{b.service_name}</div>
                <div className="text-xs text-zinc-500">{new Date(b.created_at).toLocaleDateString("ar-IQ")}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={b.status} />
                <span className="gold-text font-black text-xs">{fmtIQD(b.price)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
