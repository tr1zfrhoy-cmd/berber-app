import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtIQD } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Users, Scissors, ClipboardList, TrendingUp, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)); }, []);

  const doLogout = () => {
    logout();
    toast.success("تم تسجيل الخروج");
    navigate("/auth", { replace: true });
  };

  if (!stats) return <div className="px-5 pt-10 text-center text-zinc-500">...</div>;

  return (
    <div className="px-5 pt-6 space-y-5" data-testid="admin-dashboard">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-zinc-400 text-sm">لوحة التحكم</p>
          <h1 className="text-2xl font-black">إدارة منصة Berber</h1>
          {user?.name && <p className="text-xs text-zinc-500 mt-1">المدير: {user.name}</p>}
        </div>
        <button data-testid="admin-logout-btn" onClick={doLogout}
          className="px-3 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs flex items-center gap-1.5 hover:bg-red-500/20 transition">
          <LogOut className="w-3.5 h-3.5" /> خروج
        </button>
      </header>

      <div className="rounded-3xl p-6 gold-border" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)" }}>
        <div className="text-zinc-400 text-xs">إيرادات المنصة (إجمالي الاستقطاعات)</div>
        <div className="mt-2 text-4xl font-black gold-text">{fmtIQD(stats.revenue)}</div>
        <div className="mt-1 text-xs text-zinc-500">{stats.completed} حلاقة مكتملة من إجمالي {stats.bookings}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Users className="w-5 h-5" />} label="المستخدمون" value={stats.users} />
        <Stat icon={<Scissors className="w-5 h-5" />} label="الحلاقون" value={stats.barbers} />
        <Stat icon={<Users className="w-5 h-5" />} label="الزبائن" value={stats.customers} />
        <Stat icon={<ClipboardList className="w-5 h-5" />} label="قيد الانتظار" value={stats.pending} />
      </div>

      <div className="rounded-3xl p-5 bg-[#121212] border border-white/5">
        <h3 className="font-black text-lg mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#D4AF37]" /> ملخص النشاط</h3>
        <div className="space-y-2 text-sm">
          <Row k="حجوزات قيد التنفيذ" v={stats.accepted} />
          <Row k="حجوزات مكتملة" v={stats.completed} />
          <Row k="إجمالي الحجوزات" v={stats.bookings} />
        </div>
      </div>
    </div>
  );
}

const Stat = ({ icon, label, value }) => (
  <div className="p-4 rounded-2xl bg-[#121212] border border-white/5">
    <div className="flex items-center gap-2 text-[#D4AF37]">{icon}<span className="text-xs text-zinc-400">{label}</span></div>
    <div className="text-2xl font-black mt-2">{value}</div>
  </div>
);

const Row = ({ k, v, gold }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="text-zinc-400">{k}</span>
    <span className={gold ? "gold-text font-black" : "font-bold"}>{v}</span>
  </div>
);
