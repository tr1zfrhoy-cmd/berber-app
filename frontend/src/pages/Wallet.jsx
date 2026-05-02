import React, { useEffect, useState } from "react";
import { api, fmtIQD } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Wallet as WalletIcon, TrendingUp, Receipt, CreditCard, ArrowDownLeft, MessageCircle } from "lucide-react";
import { supportWhatsappUrl } from "../lib/support";

export default function Wallet() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => { api.get("/wallet/me").then((r) => setData(r.data)); }, []);

  if (!data) return <div className="px-5 pt-10 text-center text-zinc-500">...</div>;

  const supportUrl = supportWhatsappUrl(user);

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="wallet-page">
      <header>
        <p className="text-zinc-400 text-sm">المحفظة</p>
        <h1 className="text-2xl font-black">رصيدك ومعاملاتك</h1>
      </header>

      <div className="relative rounded-3xl p-6 overflow-hidden gold-border" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)" }}>
        <div className="absolute -left-8 -top-8 w-40 h-40 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #D4AF37, transparent 70%)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-zinc-400 text-xs mb-2">
              {user.role === "barber" ? "رصيد المحفظة (للعمولة)" : user.role === "customer" ? "إجمالي صرفك" : "إيرادات المنصة"}
            </div>
            <div className="text-4xl font-black gold-text">
              {fmtIQD(user.role === "barber" ? data.balance : user.role === "customer" ? data.spent : data.platform_revenue)}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {user.role === "barber" ? `${data.jobs} حلاقة · إجمالي العمولات المدفوعة ${fmtIQD(data.fees)}` : ""}
              {user.role === "customer" ? `${data.jobs} طلب` : ""}
              {user.role === "admin" ? `${data.total_jobs} حلاقة على المنصة` : ""}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
            <WalletIcon className="w-6 h-6 text-[#D4AF37]" />
          </div>
        </div>

        {user.role === "barber" && (
          <a data-testid="topup-whatsapp-btn" href={supportUrl} target="_blank" rel="noreferrer"
            className="mt-5 w-full py-3 rounded-2xl bg-emerald-500 text-black font-black flex items-center justify-center gap-2 hover:bg-emerald-400 transition">
            <MessageCircle className="w-4 h-4" />
            شحن المحفظة عبر الواتساب
          </a>
        )}
      </div>

      {user.role === "barber" && (
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<TrendingUp className="w-4 h-4" />} label="أجور الحلاقات" value={fmtIQD(data.gross)} />
          <Stat icon={<CreditCard className="w-4 h-4" />} label="العمولات" value={fmtIQD(data.fees)} danger />
          <Stat icon={<Receipt className="w-4 h-4" />} label="حلاقات" value={data.jobs} />
        </div>
      )}

      {user.role === "barber" && data.txns?.length > 0 && (
        <div>
          <h3 className="text-sm text-zinc-400 mb-2">معاملات المحفظة</h3>
          <div className="space-y-2">
            {data.txns.slice(0, 20).map((t) => (
              <div key={t.id} data-testid={`wtxn-${t.id}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#121212] border border-white/5">
                <div>
                  <div className="font-bold text-sm">{t.reason || t.kind}</div>
                  <div className="text-[11px] text-zinc-500">{new Date(t.created_at).toLocaleString("ar-IQ")}</div>
                </div>
                <div className={`font-black text-sm ${t.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {t.amount >= 0 ? "+" : ""}{fmtIQD(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm text-zinc-400 mb-2">الحجوزات</h3>
        {(data.items || []).slice(0, 20).map((b) => (
          <div key={b.id} data-testid={`txn-${b.id}`}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-white/5 mb-2">
            <div>
              <div className="font-bold text-sm">{b.service_name}</div>
              <div className="text-xs text-zinc-500">{new Date(b.created_at).toLocaleDateString("ar-IQ")}</div>
            </div>
            <div className="text-left">
              <div className="gold-text font-black">{fmtIQD(b.price)}</div>
              {user.role === "barber" && b.platform_fee > 0 && (
                <div className="text-[10px] text-red-400">عمولة: {fmtIQD(b.platform_fee)}</div>
              )}
            </div>
          </div>
        ))}
        {(!data.items || data.items.length === 0) && (
          <div className="text-center py-12 text-zinc-500 text-sm">لا حجوزات بعد</div>
        )}
      </div>
    </div>
  );
}

const Stat = ({ icon, label, value, danger }) => (
  <div className="p-3 rounded-2xl bg-[#121212] border border-white/5">
    <div className={`flex items-center gap-1 text-xs ${danger ? "text-red-400" : "text-zinc-400"}`}>{icon}<span>{label}</span></div>
    <div className={`mt-1 font-black text-sm ${danger ? "text-red-400" : "text-white"}`}>{value}</div>
  </div>
);
