import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { isNative } from "../lib/native";

/**
 * Smart PWA install prompt.
 * - Listens to `beforeinstallprompt` (Chrome/Edge/Android).
 * - Shows a lightweight bottom banner after user has interacted for ~10 seconds.
 * - Dismissal persists in localStorage for 7 days.
 * - Silently hidden inside an installed PWA / TWA (display-mode: standalone).
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Never show inside an already-installed context (PWA standalone OR native shell)
    if (isNative()) return;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.startsWith("android-app://");
    if (isStandalone) return;

    // Respect user dismissal for 7 days
    try {
      const dismissedAt = Number(localStorage.getItem("berber_install_dismissed_at") || 0);
      if (dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    } catch (e) {}

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      // Delay to avoid disrupting first render
      setTimeout(() => setVisible(true), 6000);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => { setVisible(false); setDeferred(null); };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    try {
      deferred.prompt();
      await deferred.userChoice;
    } catch (e) {}
    setDeferred(null);
    setVisible(false);
  };

  const dismiss = () => {
    try { localStorage.setItem("berber_install_dismissed_at", String(Date.now())); } catch (e) {}
    setVisible(false);
  };

  if (!visible || !deferred) return null;

  return (
    <div data-testid="install-prompt"
      className="fixed bottom-24 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0f0f0f]/95 backdrop-blur-xl shadow-2xl p-4 flex items-center gap-3 slide-up">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F3E5AB] to-[#8B6914] text-black flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black">ثبّت تطبيق Berber</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">وصول أسرع وبدون إنترنت — بضغطة واحدة.</div>
          </div>
          <button data-testid="install-prompt-accept" onClick={install}
            className="px-3 py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-black active:scale-95 transition shrink-0">
            تثبيت
          </button>
          <button data-testid="install-prompt-dismiss" onClick={dismiss}
            aria-label="dismiss"
            className="w-8 h-8 rounded-lg bg-white/5 text-zinc-400 flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
