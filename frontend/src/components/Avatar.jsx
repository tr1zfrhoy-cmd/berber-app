import React, { useState } from "react";
import ImageLightbox from "./ImageLightbox";

/**
 * Profile avatar with letter-fallback. Tap to enlarge into a lightbox
 * (only when a real image is present — bare letters don't open a preview).
 *
 * Props:
 *   src       – image URL (optional)
 *   name      – used for letter fallback
 *   size      – tailwind size class shortcut: "sm" | "md" | "lg" (defaults to "md")
 *   className – extra classes on the outer wrapper
 *   testid    – data-testid for testing
 *   onClick   – optional click handler. If omitted and `src` exists, tapping opens lightbox.
 */
export default function Avatar({ src, name, size = "md", className = "", testid, onClick }) {
  const [open, setOpen] = useState(false);

  const sizeCls = {
    sm: "w-9 h-9 text-sm rounded-xl",
    md: "w-12 h-12 text-lg rounded-2xl",
    lg: "w-16 h-16 text-2xl rounded-2xl",
    xl: "w-20 h-20 text-3xl rounded-2xl",
  }[size] || "w-12 h-12 text-lg rounded-2xl";

  const handleClick = () => {
    if (onClick) return onClick();
    if (src) setOpen(true);
  };

  const letter = (name && name.trim()[0]) || "?";

  return (
    <>
      <button
        type="button"
        data-testid={testid || "avatar-btn"}
        onClick={handleClick}
        aria-label={src ? "عرض الصورة" : letter}
        className={`${sizeCls} ${className} overflow-hidden flex items-center justify-center font-black transition active:scale-95 ${
          src
            ? "border-2 border-[#D4AF37]/40 bg-black/10"
            : "bg-gradient-to-br from-[#D4AF37] to-[#8B6914] text-black"
        }`}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="w-full h-full object-cover pointer-events-none"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          letter
        )}
      </button>

      {open && src && (
        <ImageLightbox src={src} onClose={() => setOpen(false)} alt={name || ""} />
      )}
    </>
  );
}
