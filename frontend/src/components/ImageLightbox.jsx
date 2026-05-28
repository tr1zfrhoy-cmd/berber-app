import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Full-screen image preview with a bold, unmistakable close button.
 * Tap anywhere outside the image (or on X) to dismiss. ESC closes too.
 */
export default function ImageLightbox({ src, onClose, alt = "" }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      data-testid="image-lightbox"
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 fade-in"
    >
      {/* Prominent close button — top-right, big, red, with double ring for visibility */}
      <button
        data-testid="lightbox-close-btn"
        onClick={(e) => { e.stopPropagation(); onClose?.(); }}
        aria-label="إغلاق"
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[0_0_0_4px_rgba(255,255,255,0.15),0_8px_24px_rgba(239,68,68,0.55)] hover:bg-red-600 active:scale-90 transition z-10"
      >
        <X className="w-6 h-6" strokeWidth={3} />
      </button>

      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
        className="max-w-[95vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl select-none pointer-events-none"
      />
    </div>
  );
}
