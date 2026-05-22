import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Flag, ChevronLeft, AlertTriangle, CheckCircle2, XCircle, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";

/**
 * Admin-only Reports page. Shows all reports from customers/barbers flagging
 * images in the "Barber Works" feed. Admin can mark as reviewed/dismissed, or
 * jump to the reported barber's profile to use the existing delete action.
 */
export default function AdminReports() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState(0);
  const [filter, setFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get(`/admin/reports${filter !== "all" ? `?status=${filter}` : ""}`);
      setItems(data?.items || []);
      setPending(data?.pending || 0);
    } catch (e) { toast.error(errMsg(e)); }
  };
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (id, status) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/reports/${id}`, { status });
      toast.success(status === "reviewed" ? "تم وضع علامة مراجَع" : status === "dismissed" ? "تم رفض البلاغ" : "تم التحديث");
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusyId(null); }
  };

  return (
    <div className="px-5 pt-6 space-y-4" data-testid="admin-reports-page">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <p className="text-zinc-400 text-sm">البلاغات</p>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Flag className="w-6 h-6 text-red-400" /> بلاغات أعمال الحلاقين
            {pending > 0 && (
              <span className="text-xs bg-red-500 text-black rounded-full px-2 py-0.5 font-black">
                {pending} جديد
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { k: "pending", l: "قيد المراجعة" },
          { k: "reviewed", l: "تمت المراجعة" },
          { k: "dismissed", l: "مرفوضة" },
          { k: "all", l: "الكل" },
        ].map((t) => (
          <button key={t.k} onClick={() => setFilter(t.k)}
            data-testid={`reports-filter-${t.k}`}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition ${
              filter === t.k ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-[#121212] text-zinc-300 border-white/10"
            }`}>{t.l}</button>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-zinc-500 text-sm">لا بلاغات في هذه الفئة</div>
      )}

      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} data-testid={`report-${r.id}`}
            className="rounded-2xl bg-[#121212] border border-white/5 overflow-hidden">
            <div className="flex">
              <div className="w-28 h-28 shrink-0 bg-black/40">
                <img src={r.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/app/users/${r.barber_id}`} className="font-bold text-sm hover:text-[#D4AF37] flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" /> {r.barber_name || "حلاق"}
                  </Link>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-[11px] text-zinc-500">
                  من: <span className="text-zinc-300">{r.reporter_name}</span>
                  {" · "}
                  {new Date(r.created_at).toLocaleString("ar-IQ")}
                </div>
                {r.reason && (
                  <div className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{r.reason}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex border-t border-white/5 text-xs">
              <Link to={`/app/users/${r.barber_id}`}
                data-testid={`report-open-user-${r.id}`}
                className="flex-1 py-2.5 text-center font-bold text-[#D4AF37] hover:bg-white/5 transition">
                فتح الملف (حذف الحلاق)
              </Link>
              {r.status !== "reviewed" && (
                <button onClick={() => setStatus(r.id, "reviewed")} disabled={busyId === r.id}
                  data-testid={`report-mark-reviewed-${r.id}`}
                  className="flex-1 py-2.5 font-bold text-emerald-400 hover:bg-emerald-500/10 transition border-r border-white/5 flex items-center justify-center gap-1 disabled:opacity-50">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تمت المراجعة
                </button>
              )}
              {r.status !== "dismissed" && (
                <button onClick={() => setStatus(r.id, "dismissed")} disabled={busyId === r.id}
                  data-testid={`report-dismiss-${r.id}`}
                  className="flex-1 py-2.5 font-bold text-zinc-400 hover:bg-white/5 transition border-r border-white/5 flex items-center justify-center gap-1 disabled:opacity-50">
                  <XCircle className="w-3.5 h-3.5" /> رفض البلاغ
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const cfg = status === "pending"
    ? { label: "قيد المراجعة", cls: "bg-red-500/15 text-red-400 border-red-500/30" }
    : status === "reviewed"
    ? { label: "تمت المراجعة", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
    : { label: "مرفوض", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};
