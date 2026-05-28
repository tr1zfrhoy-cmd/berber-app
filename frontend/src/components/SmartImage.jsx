import React, { useState } from "react";
import ImageLightbox from "./ImageLightbox";

/**
 * SmartImage — drop-in <img>:
 *   • TAP → open in full-screen Lightbox
 *   • Blocks Chrome's long-press menu via oncontextmenu + draggable=false
 *
 * If `onClick` is supplied it overrides the default lightbox behavior.
 */
export default function SmartImage({ src, alt = "", className = "", testid, onClick }) {
  const [open, setOpen] = useState(false);

  const handleClick = (e) => {
    if (onClick) return onClick(e);
    if (src) setOpen(true);
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        data-testid={testid}
        draggable={false}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
      />
      {open && (
        <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
