import React, { useState, useCallback } from "react";
import ImageLightbox from "./ImageLightbox";
import ImageActionSheet from "./ImageActionSheet";
import useLongPress from "../hooks/useLongPress";
import { downloadImage } from "../lib/download";
import { toast } from "sonner";

/**
 * SmartImage — drop-in replacement for <img> that gives you:
 *   • TAP   → open in full-screen Lightbox
 *   • HOLD  → luxury bottom sheet (Open • Download)
 *   • Kills Chrome's native long-press menu (no more "Save image / Copy link")
 *
 * If `onClick` is supplied it overrides the default lightbox behavior on tap.
 * Long-press behaviour is always active when `src` is provided.
 */
export default function SmartImage({
  src, alt = "", className = "", testid, onClick,
  filename, enableLongPress = true,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handlers = useLongPress(() => { if (src) setSheetOpen(true); }, { delay: 450 });

  const handleClick = (e) => {
    handlers.onClick(e);
    if (e.defaultPrevented) return;
    if (onClick) return onClick(e);
    if (src) setLightboxOpen(true);
  };

  const doDownload = useCallback(async () => {
    if (downloading || !src) return;
    setDownloading(true);
    try {
      const ok = await downloadImage(src, filename || `berber-${Date.now()}.jpg`);
      if (ok) {
        setDownloaded(true);
        toast.success("تم حفظ الصورة في الجهاز");
        setTimeout(() => { setSheetOpen(false); setDownloaded(false); }, 1200);
      } else {
        setSheetOpen(false);
      }
    } catch {
      toast.error("تعذّر تنزيل الصورة، حاول مرة أخرى");
    } finally {
      setDownloading(false);
    }
  }, [src, filename, downloading]);

  const finalHandlers = enableLongPress ? handlers : {};

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        data-testid={testid}
        {...finalHandlers}
        onClick={enableLongPress ? handleClick : onClick}
        onContextMenu={enableLongPress ? handlers.onContextMenu : undefined}
      />

      {enableLongPress && (
        <ImageActionSheet
          open={sheetOpen} src={src}
          onClose={() => setSheetOpen(false)}
          onOpen={() => { setSheetOpen(false); setLightboxOpen(true); }}
          onDownload={doDownload}
          downloading={downloading}
          downloaded={downloaded}
        />
      )}

      {lightboxOpen && (
        <ImageLightbox src={src} alt={alt} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}
