import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fmtIQD } from "../lib/api";
import { Search, Wallet as WalletIcon, Star, Scissors, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { user: me } = useAuth();

  const load = () => api.get("/admin/users").then((r) => setUsers(r.data || []));
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    if (filter !== "all" && u.role !== filter) return false;
    if (!q) return true;
    return u.name?.toLowerCase().includes(q.toLowerCase()) || u.phone?.includes(q);
  });

  const deleteUser = async (u) => {
    setBusyId(u.id);
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success(`تم حذف ${u.name} نهائياً`);
      setConfirmId(null);
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusyId(null); }
  };

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
        {filtered.map((u) => {
          const canDelete = u.role !== "admin" && u.id !== me?.id;
          const isConfirming = confirmId === u.id;
          return (
          <div key={u.id} className="rounded-2xl bg-[#121212] border border-white/5 hover:border-[#D4AF37]/40 transition overflow-hidden">
            <div className="flex items-stretch">
              <Link to={`/app/users/${u.id}`} data-testid={`user-row-${u.id}`}
                className="flex-1 flex items-center justify-between p-4">
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
              {canDelete && (
                <button data-testid={`delete-user-${u.id}`}
                  onClick={() => setConfirmId(u.id)}
                  className="px-3 hover:bg-red-500/10 text-red-400 border-r border-white/5 transition flex items-center justify-center"
                  title="حذف نهائي">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {isConfirming && (
              <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/20 text-xs space-y-2"
                data-testid={`confirm-delete-${u.id}`}>
                <div className="font-bold text-red-400">
                  هل تريد حذف <span className="font-black">{u.name}</span> نهائياً؟ سيتم حذف كل الحجوزات والمحفظة والمحادثات.
                </div>
                <div className="flex gap-2">
                  <button data-testid={`confirm-delete-yes-${u.id}`}
                    onClick={() => deleteUser(u)} disabled={busyId === u.id}
                    className="flex-1 py-2 rounded-lg bg-red-500 text-black font-black hover:bg-red-400 transition disabled:opacity-50">
                    {busyId === u.id ? "..." : "نعم، احذف"}
                  </button>
                  <button onClick={() => setConfirmId(null)}
                    className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-200 font-bold">
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        );})}
        {filtered.length === 0 && <div className="text-center py-12 text-zinc-500 text-sm">لا نتائج</div>}
      </div>
    </div>
  );
}
