import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Map, Wallet, MessageCircle, Settings, LayoutDashboard, Users, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const customerTabs = [
  { to: "/app", icon: Home, label: "الرئيسية", end: true },
  { to: "/app/map", icon: Map, label: "الخريطة" },
  { to: "/app/wallet", icon: Wallet, label: "المحفظة" },
  { to: "/app/chat", icon: MessageCircle, label: "الدعم" },
  { to: "/app/settings", icon: Settings, label: "الإعدادات" },
];
const barberTabs = [
  { to: "/app", icon: ClipboardList, label: "الطلبات", end: true },
  { to: "/app/map", icon: Map, label: "الخريطة" },
  { to: "/app/wallet", icon: Wallet, label: "المحفظة" },
  { to: "/app/chat", icon: MessageCircle, label: "الدعم" },
  { to: "/app/settings", icon: Settings, label: "الإعدادات" },
];
const adminTabs = [
  { to: "/app", icon: LayoutDashboard, label: "لوحة التحكم", end: true },
  { to: "/app/users", icon: Users, label: "المستخدمون" },
  { to: "/app/bookings", icon: ClipboardList, label: "الحجوزات" },
  { to: "/app/chat", icon: MessageCircle, label: "الدعم" },
  { to: "/app/settings", icon: Settings, label: "الإعدادات" },
];

export default function Layout({ children }) {
  const { user } = useAuth();
  const tabs = user?.role === "admin" ? adminTabs : user?.role === "barber" ? barberTabs : customerTabs;

  return (
    <div className="min-h-screen bg-[#050505] grain">
      <div className="max-w-2xl mx-auto pb-24 relative">
        {children}
      </div>

      <nav data-testid="bottom-nav" className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-2xl mx-auto px-4 pb-3 pointer-events-auto">
          <div className="glass rounded-2xl px-2 py-2 flex items-center justify-between border border-white/10">
            {tabs.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end}
                data-testid={`nav-${label}`}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition flex-1 ${
                    isActive ? "bg-[#D4AF37]/15 text-[#D4AF37]" : "text-zinc-500 hover:text-zinc-200"
                  }`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold">{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
