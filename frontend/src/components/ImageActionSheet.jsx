import React, { useEffect } from "react";
import { X, Maximize2, Download, Check } from "lucide-react";

/**
 * ImageActionSheet — luxury bottom-sheet with two actions for any image:
 *   1. Open full screen (Lightbox)
 *   2. Download silently to device gallery
 *
 * Triggered by a long-press on any <SmartImage> or <Avatar>.
 */
export default function ImageActionSheet({
  open, src,
  onClose, onOpen, onDownload,
  downloading = false, downloaded = false,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-testid="image-action-sheet"
      onClick={onClose}
      className="fixed inset-0 z-[350] flex items-end justify-center fade-in"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0a0a0a] border-t border-[#D4AF37]/30 rounded-t-3xl p-4 pb-8 sheet-slide-up shadow-[0_-20px_60px_rgba(0,0,0,0.55)]"
      >
        {/* drag handle */}
        <div className="mx-auto w-12 h-1.5 rounded-full bg-zinc-700 mb-4" />

        {/* preview thumb */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <img
            src={src} alt=""
            className="w-14 h-14 rounded-xl object-cover border border-[#D4AF37]/30 pointer-events-none"
          />
          <div className="flex-1">
            <div className="text-sm font-bold">صورة</div>
            <div className="text-xs text-zinc-500">اختر الإجراء</div>
          </div>
          <button
            data-testid="action-sheet-close"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* actions */}
        <button
          data-testid="action-open-image"
          onClick={onOpen}
          className="w-full flex items-center gap-4 py-4 px-2 hover:bg-white/5 rounded-xl transition mt-2"
        >
          <span className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center flex-shrink-0">
            <Maximize2 className="w-5 h-5" />
          </span>
          <span className="text-right flex-1">
            <span className="block font-bold text-sm">فتح الصورة</span>
            <span className="block text-xs text-zinc-500">عرض بشاشة كاملة</span>
          </span>
        </button>

        <button
          data-testid="action-download-image"
          onClick={onDownload}
          disabled={downloading}
          className="w-full flex items-center gap-4 py-4 px-2 hover:bg-white/5 rounded-xl transition disabled:opacity-60"
        >
          <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            downloaded ? "bg-emerald-500/15 text-emerald-400" : "bg-[#D4AF37]/15 text-[#D4AF37]"
          }`}>
            {downloaded ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
          </span>
          <span className="text-right flex-1">
            <span className="block font-bold text-sm">
              {downloaded ? "تم الحفظ" : downloading ? "جاري التنزيل…" : "تنزيل الصورة"}
            </span>
            <span className="block text-xs text-zinc-500">حفظ في معرض الجهاز</span>
          </span>
        </button>
      </div>
    </div>
  );
}
