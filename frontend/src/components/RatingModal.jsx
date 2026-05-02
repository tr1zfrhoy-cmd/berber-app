import React, { useState } from "react";
import { Star } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";

export default function RatingModal({ booking, onClose, onRated }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(0);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/bookings/${booking.id}/rating`, { stars, comment });
      toast.success("تم إرسال التقييم، شكراً!");
      onRated?.();
      onClose();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#D4AF37]/40 rounded-3xl p-6 slide-up" data-testid="rating-modal">
        <h2 className="text-lg font-black text-center">قيّم الخدمة</h2>
        <p className="text-center text-xs text-zinc-400 mt-1">{booking.barber_name} · {booking.service_name}</p>

        <div className="flex items-center justify-center gap-2 my-6">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (hover || stars) >= n;
            return (
              <button key={n} data-testid={`star-${n}`}
                onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                onClick={() => setStars(n)}
                className="transition hover:scale-110">
                <Star className={`w-10 h-10 ${active ? "fill-[#D4AF37] text-[#D4AF37]" : "text-zinc-600"}`} />
              </button>
            );
          })}
        </div>

        <textarea data-testid="rating-comment"
          placeholder="أضف تعليقاً (اختياري)..."
          value={comment} onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 outline-none text-sm placeholder:text-zinc-500 resize-none" />

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button onClick={onClose}
            className="py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm">لاحقاً</button>
          <button data-testid="submit-rating-btn" disabled={busy} onClick={submit}
            className="py-3 rounded-xl bg-[#D4AF37] text-black font-black text-sm disabled:opacity-50">
            {busy ? "..." : "إرسال التقييم"}
          </button>
        </div>
      </div>
    </div>
  );
}
