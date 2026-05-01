import React, { useEffect, useState } from "react";
import { api, fmtIQD } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Wallet as WalletIcon, TrendingUp, Receipt, CreditCard, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Wallet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api.get("/wallet/me").then((r) => setData(r.data)); }, []);

  if (!data) return <div className="px-5 pt-10 text-center text-zinc-500">...</div>;

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
            <div className="text-zinc-400 text-xs mb-2">الرصيد المتاح</div>
            <div className="text-4xl font-black gold-text">
              {fmtIQD(user.role === "barber" ? data.net : user.role === "customer" ? data.spent : data.platform_revenue)}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              {user.role === "barber" ? `${data.jobs} حلاقة · بعد خصم ${fmtIQD(data.fees)}` : ""}
              {user.role === "customer" ? `${data.jobs} طلب` : ""}
              {user.role === "admin" ? `${data.total_jobs} حلاقة على المنصة` : ""}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
            <WalletIcon className="w-6 h-6 text-[#D4AF37]" />
          </div>
        </div>

        {user.role === "barber" && (
          <button data-testid="withdraw-btn"
            onClick={() => navigate("/app/chat?withdraw=1")}
            className="mt-5 w-full py-3 rounded-2xl bg-[#D4AF37] text-black font-black flex items-center justify-center gap-2 hover:bg-[#F3E5AB] transition">
            <ArrowDownLeft className="w-4 h-4" />
            طلب سحب الرصيد (ماستر كارد)
          </button>
        )}
      </div>

      {/* Stats */}
      {user.role === "barber" && (
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={<TrendingUp className="w-4 h-4" />} label="إجمالي" value={fmtIQD(data.gross)} />
          <Stat icon={<CreditCard className="w-4 h-4" />} label="الخصم" value={fmtIQD(data.fees)} danger />
          <Stat icon={<Receipt className="w-4 h-4" />} label="حلاقات" value={data.jobs} />
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        <h3 className="text-sm text-zinc-400">المعاملات</h3>
        {(data.items || []).slice(0, 30).map((b) => (
          <div key={b.id} data-testid={`txn-${b.id}`}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-white/5">
            <div>
              <div className="font-bold text-sm">{b.service_name}</div>
              <div className="text-xs text-zinc-500">{new Date(b.created_at).toLocaleDateString("ar-IQ")}</div>
            </div>
            <div className="text-left">
              <div className="gold-text font-black">{fmtIQD(user.role === "barber" ? b.barber_earnings : b.price)}</div>
              {user.role === "barber" && b.platform_fee > 0 && (
                <div className="text-[10px] text-red-400">- {fmtIQD(b.platform_fee)} رسوم</div>
              )}
            </div>
          </div>
        ))}
        {(!data.items || data.items.length === 0) && (
          <div className="text-center py-12 text-zinc-500 text-sm">لا توجد معاملات بعد</div>
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
