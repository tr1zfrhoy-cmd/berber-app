// -----------------------------------------------------------------------------
// Native adapter — thin layer that uses Capacitor plugins when the app runs
// inside a real native shell (APK / IPA) and gracefully falls back to
// standard Web APIs when running as a PWA in the browser.
//
// The whole app never imports Capacitor directly — always call these helpers,
// so the same JS bundle keeps working in both worlds.
// -----------------------------------------------------------------------------
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { Geolocation } from "@capacitor/geolocation";
import { Preferences } from "@capacitor/preferences";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App as CapApp } from "@capacitor/app";
import { Network } from "@capacitor/network";

/** True when we are running inside a Capacitor-wrapped native app (APK / IPA). */
export const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch (e) { return false; }
};

/** Short strong haptic — used for new-order notifications on the barber side. */
export const vibrateHeavy = async () => {
  try {
    if (isNative()) {
      await Haptics.notification({ type: NotificationType.Success });
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  } catch (e) { /* silent */ }
};

/** Light tap feedback for buttons & confirmations. */
export const vibrateLight = async () => {
  try {
    if (isNative()) await Haptics.impact({ style: ImpactStyle.Light });
    else if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
  } catch (e) { /* silent */ }
};

/** Native share sheet on Android / iOS · falls back to Web Share API · then clipboard. */
export const shareNative = async ({ title, text, url }) => {
  try {
    if (isNative()) {
      await Share.share({ title, text, url, dialogTitle: title });
      return { ok: true, via: "native" };
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text, url });
      return { ok: true, via: "web-share" };
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      return { ok: true, via: "clipboard" };
    }
    return { ok: false, via: "none" };
  } catch (e) {
    if (e?.message?.toLowerCase()?.includes("cancel")) return { ok: false, via: "cancelled" };
    return { ok: false, via: "error", error: e };
  }
};

/** High-accuracy GPS reading — Capacitor when native, browser geolocation otherwise. */
export const getPosition = async () => {
  if (isNative()) {
    const perm = await Geolocation.requestPermissions();
    if (perm.location === "denied") throw new Error("PERMISSION_DENIED");
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
    return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("UNSUPPORTED"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
};

/**
 * Persistent key/value storage.
 * On native → Capacitor Preferences (survives app uninstall optionally, always survives cache clear).
 * On web    → localStorage.
 */
export const storage = {
  async get(key) {
    try {
      if (isNative()) return (await Preferences.get({ key })).value;
      return localStorage.getItem(key);
    } catch (e) { return null; }
  },
  async set(key, value) {
    try {
      if (isNative()) return Preferences.set({ key, value: String(value) });
      return localStorage.setItem(key, String(value));
    } catch (e) { /* ignore quota */ }
  },
  async remove(key) {
    try {
      if (isNative()) return Preferences.remove({ key });
      return localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
  },
};

/** Hide the native splash screen (called from React root once first paint is done). */
export const hideNativeSplash = async () => {
  try { if (isNative()) await SplashScreen.hide({ fadeOutDuration: 400 }); } catch (e) {}
};

/** Set native status bar to the app's gold-on-black identity. */
export const setupStatusBar = async () => {
  try {
    if (!isNative()) return;
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#000000" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) { /* ignore on iOS where overlaysWebView is web-only */ }
};

/**
 * Native hardware back-button handling on Android.
 * If the user is at the root, minimise the app. Otherwise let history back run.
 * Returns an unsubscribe function.
 */
export const wireHardwareBack = () => {
  try {
    if (!isNative()) return () => {};
    const sub = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });
    return () => { try { sub.remove(); } catch (e) {} };
  } catch (e) { return () => {}; }
};

/** Observe online / offline network transitions via Capacitor when available. */
export const subscribeNetwork = (cb) => {
  try {
    if (isNative()) {
      const sub = Network.addListener("networkStatusChange", (s) => cb(s.connected));
      Network.getStatus().then((s) => cb(s.connected)).catch(() => {});
      return () => { try { sub.remove(); } catch (e) {} };
    }
  } catch (e) {}
  const on = () => cb(true), off = () => cb(false);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
};
