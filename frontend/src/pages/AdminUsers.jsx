import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Search } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => { api.get("/admin/users").then((r) => setUsers(r.data || [])); }, []);

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(q.toLowerCase()) ||
    u.email?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="px-5 pt-6 space-y-4" data-testid="admin-users">
      <header>
        <p className="text-zinc-400 text-sm">المستخدمون</p>
        <h1 className="text-2xl font-black">{users.length} مستخدم</h1>
      </header>

      <div className="flex items-center bg-[#121212] border border-white/10 rounded-2xl px-4 py-3">
        <Search className="w-4 h-4 text-zinc-500 ml-2" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث..."
          className="bg-transparent flex-1 outline-none text-sm placeholder:text-zinc-500" />
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#121212] border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8B6914] text-black font-black flex items-center justify-center">
                {u.name?.[0]}
              </div>
              <div>
                <div className="font-bold text-sm">{u.name}</div>
                <div className="text-xs text-zinc-500">{u.email}</div>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
              u.role === "barber" ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30"
                : u.role === "admin" ? "bg-red-500/15 text-red-400 border-red-500/30"
                : "bg-blue-500/15 text-blue-400 border-blue-500/30"
            }`}>
              {u.role === "barber" ? "حلاق" : u.role === "admin" ? "مدير" : "زبون"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
