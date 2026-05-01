import React, { useEffect, useState } from "react";
import { api, fmtIQD } from "../lib/api";
import { StatusBadge } from "./CustomerHome";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => { api.get("/admin/bookings").then((r) => setBookings(r.data || [])); }, []);

  return (
    <div className="px-5 pt-6 space-y-4" data-testid="admin-bookings">
      <header>
        <p className="text-zinc-400 text-sm">الحجوزات</p>
        <h1 className="text-2xl font-black">{bookings.length} حجز</h1>
      </header>

      <div className="space-y-2">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-2xl bg-[#121212] border border-white/5 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-black">{b.service_name}</div>
                <div className="text-xs text-zinc-500 mt-1">{b.customer_name} → {b.barber_name || "—"}</div>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-zinc-400 text-xs">{new Date(b.created_at).toLocaleString("ar-IQ")}</span>
              <span className="gold-text font-black">{fmtIQD(b.price)}</span>
            </div>
            {b.platform_fee > 0 && (
              <div className="mt-2 text-[11px] text-emerald-400">رسوم المنصة: {fmtIQD(b.platform_fee)}</div>
            )}
          </div>
        ))}
        {bookings.length === 0 && <div className="text-center py-12 text-zinc-500 text-sm">لا توجد حجوزات بعد</div>}
      </div>
    </div>
  );
}
