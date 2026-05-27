import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * OnlineBanner — non-intrusive banner that slides in from the top when the
 * browser reports we're offline. Disappears automatically once the connection
 * returns. Pair this with the offline.html that the Service Worker serves on
 * a full network failure.
 */
export default function OnlineBanner() {
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      data-testid="offline-banner"
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[400] flex justify-center pointer-events-none pt-[env(safe-area-inset-top)]"
    >
      <div className="m-2 px-4 py-2 rounded-full bg-[#1a1208] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md">
        <WifiOff className="w-3.5 h-3.5" />
        لا يوجد اتصال — وضع العرض فقط
      </div>
    </div>
  );
}
