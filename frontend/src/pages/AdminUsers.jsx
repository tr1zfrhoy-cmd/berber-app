import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fmtIQD } from "../lib/api";
import { Search, Wallet as WalletIcon, Star, Scissors } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { api.get("/admin/users").then((r) => setUsers(r.data || [])); }, []);

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (!q) return true;
    return u.name?.toLowerCase().includes(q.toLowerCase()) || u.phone?.includes(q);
  });

  return (
    <div className="px-5 pt-6 space-y-4" data-testid="admin-users">
      <header>
        <p className="text-zinc-400 text-sm">المستخدمون</p>
        <h1 className="text-2xl font-black">{users.length} مستخدم</h1>
      </header>

      <div className="flex items-center bg-[#121212] border border-white/10 rounded-2xl px-4 py-3">
        <Search className="w-4 h-4 text-zinc-500 ml-2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الهاتف..."
          data-testid="admin-users-search"
          className="bg-transparent flex-1 outline-none text-sm placeholder:text-zinc-500" />
      </div>

      <div className="flex gap-2">
        {[
          { k: "all", l: "الكل" },
          { k: "barber", l: "حلاقون" },
          { k: "customer", l: "زبائن" },
          { k: "admin", l: "مدراء" },
        ].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)}
            data-testid={`filter-${t.k}`}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
              filter === t.k ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-[#121212] text-zinc-300 border-white/10"
            }`}>{t.l}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <Link key={u.id} to={`/app/users/${u.id}`} data-testid={`user-row-${u.id}`}
            className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-white/5 hover:border-[#D4AF37]/40 transition">
            <div className="flex items-center gap-3">
              {u.avatar ? (
                <img src={u.avatar} alt="" className="w-11 h-11 rounded-xl object-cover border border-[#D4AF37]/30" />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6914] text-black font-black flex items-center justify-center">
                  {u.name?.[0]}
                </div>
              )}
              <div>
                <div className="font-bold text-sm">{u.name}</div>
                <div className="text-xs text-zinc-500" dir="ltr">{u.phone}</div>
                {u.role === "barber" && u.rating_count > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-[#D4AF37] mt-0.5">
                    <Star className="w-3 h-3 fill-[#D4AF37]" /> {u.rating_avg?.toFixed(1)} ({u.rating_count})
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                u.role === "barber" ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30"
                  : u.role === "admin" ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : "bg-blue-500/15 text-blue-400 border-blue-500/30"
              }`}>
                {u.role === "barber" ? "حلاق" : u.role === "admin" ? "مدير" : "زبون"}
              </span>
              {u.role === "barber" && (
                <div className="flex items-center gap-1 text-[11px] gold-text font-black">
                  <WalletIcon className="w-3 h-3" /> {fmtIQD(u.wallet_balance || 0)}
                </div>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-zinc-500 text-sm">لا نتائج</div>}
      </div>
    </div>
  );
}
