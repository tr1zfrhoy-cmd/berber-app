import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Heart, Star, Scissors, BadgeCheck, X, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";

/**
 * Social feed of barber works.
 * Each barber gets ONE card. Multiple uploaded works appear inside a horizontal
 * carousel (swipe / scroll-snap). Clicking any image opens a full-screen
 * lightbox preview. The "Book Now" button still routes through the OFFICIAL
 * internal booking flow (preserves admin commission deduction).
 */
export default function BarberWorks() {
  const navigate = useNavigate();
  const [barbers, setBarbers] = useState([]);
  const [likes, setLikes] = useState({});
  const [preview, setPreview] = useState(null); // { images: [], index: 0 }
  const [reportTarget, setReportTarget] = useState(null); // { barber_id, image_url, barber_name }
  const [reportReason, setReportReason] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportedKeys, setReportedKeys] = useState({}); // local feedback only

  useEffect(() => {
    api.get("/barbers").then((r) => setBarbers(r.data || []));
  }, []);

  const toggleLike = (id) => setLikes((s) => ({ ...s, [id]: !s[id] }));

  const openPreview = (images, index) => setPreview({ images, index });
  const closePreview = () => setPreview(null);
  const nextImg = () => setPreview((p) => p && ({ ...p, index: (p.index + 1) % p.images.length }));
  const prevImg = () => setPreview((p) => p && ({ ...p, index: (p.index - 1 + p.images.length) % p.images.length }));

  const openReport = (barber, imageUrl) => {
    setReportReason("");
    setReportTarget({ barber_id: barber.id, image_url: imageUrl, barber_name: barber.name });
  };
  const closeReport = () => { setReportTarget(null); setReportReason(""); };
  const submitReport = async () => {
    if (!reportTarget) return;
    setReportBusy(true);
    try {
      await api.post("/reports", {
        barber_id: reportTarget.barber_id,
        image_url: reportTarget.image_url,
        reason: reportReason.trim() || null,
      });
      toast.success("تم إرسال البلاغ للإدارة");
      setReportedKeys((s) => ({ ...s, [`${reportTarget.barber_id}|${reportTarget.image_url}`]: true }));
      closeReport();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setReportBusy(false); }
  };

  return (
    <div className="px-3 pt-4 pb-6 space-y-4" data-testid="barber-works-page">
      <header className="px-2 pb-2">
        <p className="text-zinc-400 text-xs">المنشورات</p>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Scissors className="w-6 h-6 text-[#D4AF37]" /> أعمال الحلاقين
        </h1>
        <p className="text-xs text-zinc-500 mt-1">اسحب للجانب لاستعراض أعمال كل حلاق · اضغط على الصورة للعرض الكامل</p>
      </header>

      {barbers.length === 0 && (
        <div className="text-center py-16 text-zinc-500 text-sm">لا توجد منشورات بعد</div>
      )}

      <div className="space-y-5">
        {barbers.map((b) => {
          const images = (b.portfolio || []).filter(Boolean);
          const liked = !!likes[b.id];
          const hasWorks = images.length > 0;

          return (
            <article key={b.id} data-testid={`barber-card-${b.id}`}
              className="rounded-3xl bg-[#121212] border border-white/5 overflow-hidden">
              {/* Fixed header per barber */}
              <div className="flex items-center gap-3 p-3">
                {b.avatar ? (
                  <img src={b.avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B6914] text-black font-black flex items-center justify-center">
                    {b.name?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 font-bold text-sm">
                    <span className="truncate" data-testid={`barber-name-${b.id}`}>{b.name}</span>
                    <BadgeCheck className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    {b.rating_count > 0 ? (
                      <span className="flex items-center gap-0.5 text-[#D4AF37]">
                        <Star className="w-3 h-3 fill-[#D4AF37]" />
                        {b.rating_avg?.toFixed(1)} ({b.rating_count})
                      </span>
                    ) : <span>حلاق جديد</span>}
                    {b.is_online && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        متاح الآن
                      </span>
                    )}
                    {hasWorks && <span>· {images.length} صورة</span>}
                  </div>
                </div>
              </div>

              {/* Carousel of works (or intro card when empty) */}
              {hasWorks ? (
                <div
                  data-testid={`carousel-${b.id}`}
                  className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
                >
                  {images.map((url, i) => {
                    const reportedKey = `${b.id}|${url}`;
                    const wasReported = !!reportedKeys[reportedKey];
                    return (
                      <div key={reportedKey} className="relative shrink-0 w-full snap-center aspect-square">
                        <button
                          type="button"
                          onClick={() => openPreview(images, i)}
                          data-testid={`work-image-${b.id}-${i}`}
                          className="absolute inset-0 w-full h-full bg-black/40 focus:outline-none"
                        >
                          <img src={url} alt="" loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openReport(b, url); }}
                          data-testid={`report-image-${b.id}-${i}`}
                          aria-label="إبلاغ"
                          title={wasReported ? "تم الإبلاغ" : "الإبلاغ عن هذه الصورة"}
                          className={`absolute top-2 left-2 w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition ${
                            wasReported
                              ? "bg-red-500/30 border-red-500/50 text-red-200"
                              : "bg-black/55 border-white/15 text-white hover:bg-red-500/80 hover:border-red-400"
                          }`}
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="aspect-square w-full bg-black/40 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Scissors className="w-16 h-16 text-zinc-700" />
                  </div>
                  <div className="absolute bottom-3 right-3 left-3 bg-black/70 backdrop-blur-sm rounded-xl p-3 text-sm">
                    {b.bio || `حلاق متخصص يقدم خدمات حلاقة احترافية في موقعك`}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 py-2 flex items-center gap-4 border-t border-white/5">
                <button data-testid={`like-${b.id}`} onClick={() => toggleLike(b.id)}
                  className={`flex items-center gap-1 transition ${liked ? "text-red-400 scale-110" : "text-zinc-400 hover:text-red-400"}`}>
                  <Heart className={`w-5 h-5 ${liked ? "fill-red-400" : ""}`} />
                </button>
                {hasWorks && (
                  <span className="text-xs text-zinc-500 mr-auto">اسحب للجانب →</span>
                )}
              </div>

              {/* CTA — official booking flow (commission preserved) */}
              <div className="p-3 pt-0">
                <button data-testid={`book-now-${b.id}`}
                  onClick={() => navigate(`/app/book?barber=${b.id}`)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#8B6914] text-black font-black hover:opacity-90 transition">
                  احجز الآن
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Full-screen image preview */}
      {preview && (
        <div
          data-testid="image-preview-modal"
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
          onClick={closePreview}
        >
          <button
            data-testid="close-preview-btn"
            onClick={(e) => { e.stopPropagation(); closePreview(); }}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          {preview.images.length > 1 && (
            <>
              <button
                data-testid="preview-prev-btn"
                onClick={(e) => { e.stopPropagation(); prevImg(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                data-testid="preview-next-btn"
                onClick={(e) => { e.stopPropagation(); nextImg(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}

          <img
            src={preview.images[preview.index]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[90vh] object-contain select-none"
          />

          {preview.images.length > 1 && (
            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5">
              {preview.images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === preview.index ? "bg-[#D4AF37] w-4" : "bg-white/30"} transition-all`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report image modal */}
      {reportTarget && (
        <div
          data-testid="report-modal"
          className="fixed inset-0 z-[210] bg-black/85 flex items-center justify-center p-4"
          onClick={closeReport}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#121212] border border-red-500/30 p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-red-400">
              <Flag className="w-5 h-5" />
              <h3 className="text-lg font-black">الإبلاغ عن صورة</h3>
            </div>
            <p className="text-xs text-zinc-400">
              سيتم إرسال هذا البلاغ مباشرة إلى الإدارة لمراجعة صورة الحلاق
              <span className="font-bold text-zinc-200"> {reportTarget.barber_name}</span>.
            </p>
            <img src={reportTarget.image_url} alt=""
              className="w-full aspect-video object-cover rounded-xl border border-white/10" />
            <textarea
              data-testid="report-reason-input"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="سبب البلاغ (اختياري): محتوى غير لائق، صورة مسروقة، إعلان مضلل..."
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none text-sm placeholder:text-zinc-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                data-testid="report-submit-btn"
                disabled={reportBusy}
                onClick={submitReport}
                className="flex-1 py-3 rounded-xl bg-red-500 text-black font-black text-sm disabled:opacity-50"
              >
                {reportBusy ? "جاري الإرسال..." : "إرسال البلاغ"}
              </button>
              <button
                data-testid="report-cancel-btn"
                onClick={closeReport}
                className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-200 font-bold text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
