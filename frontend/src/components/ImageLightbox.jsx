import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Full-screen image preview with backdrop + close button.
 * Used for tap-to-enlarge on profile avatars.
 *
 * Props:
 *   src       (string)   – image URL to show
 *   onClose   (function) – called when user dismisses
 *   alt       (string?)  – accessibility label
 */
export default function ImageLightbox({ src, onClose, alt = "" }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    // Prevent body scroll while open
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
      className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 fade-in"
    >
      <button
        data-testid="lightbox-close-btn"
        onClick={(e) => { e.stopPropagation(); onClose?.(); }}
        aria-label="إغلاق"
        className="absolute top-5 left-5 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[95vw] max-h-[88vh] object-contain rounded-2xl shadow-2xl select-none"
      />
    </div>
  );
}
