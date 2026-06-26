import { SUPPORT } from "./api";

const buildText = (user) => {
  const name = user?.name || "";
  const phone = user?.phone || "";
  if (user?.role === "barber") {
    return `مرحباً، أنا الحلاق ${name}، رقم الهاتف: ${phone}. أريد شحن محفظتي، أرجو تزويدي بتفاصيل الماستر كارد.`;
  }
  if (user?.role === "customer") {
    return `مرحباً، أنا الزبون ${name}، رقم الهاتف: ${phone}. أريد حلاقاً إلى موقعي.`;
  }
  return `مرحباً، أنا ${name || "مستخدم Berber"}، رقم الهاتف: ${phone}.`;
};

const cleanPhone = (raw) => (raw || "").toString().replace(/[^\d]/g, "");

const getTarget = (fallback = "9647512614831") =>
  cleanPhone(SUPPORT?.whatsapp_phone || fallback);

// Kept for backwards compatibility (some places still rely on the web URL,
// e.g. <a> tags inside Markdown). New code should call `openWhatsApp(user)`.
export function supportWhatsappUrl(user, phoneFallback = "9647512614831") {
  const target = getTarget(phoneFallback);
  const text = encodeURIComponent(buildText(user));
  return `https://wa.me/${target}?text=${text}`;
}

/**
 * Open WhatsApp natively on the user's device.
 *
 * Robust strategy that works inside TWA, Chrome Custom Tabs, in-app WebViews,
 * older Android (4.4+), and legacy desktop browsers:
 *
 *   1. Try `whatsapp://send?...` first — both WhatsApp and WhatsApp Business
 *      register this URI scheme on Android & iOS. Triggers the system intent
 *      resolver. No popup is opened; we only ever assign `window.location.href`.
 *   2. Watch `document.visibilitychange`. If the app launches successfully the
 *      page goes background ⇒ we cancel the pending fallback timer so we don't
 *      navigate twice (which is what was causing the "Pop-up blocked (2)" toast).
 *   3. If after ~1.4s the page is still visible (= no WA app installed), we
 *      perform a same-tab navigation to `https://wa.me/...`. We deliberately use
 *      `window.location.href = ...` instead of `window.open(..., '_blank')`
 *      because `_blank` outside a click handler is what the browser blocks.
 *
 * Defensive coding: feature-detects `document.hidden`, guards against double
 * invocation, and never throws — older WebViews that don't support a scheme
 * just sit silently and the web fallback takes over.
 */
export function openWhatsApp(user, fallback = "9647512614831") {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  var target = getTarget(fallback);
  var text = buildText(user);
  var encoded = encodeURIComponent(text);

  var nativeUrl = "whatsapp://send?phone=" + target + "&text=" + encoded;
  var webUrl = "https://wa.me/" + target + "?text=" + encoded;

  var done = false;
  var fallbackTimer = null;

  function cleanup() {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    try { document.removeEventListener("visibilitychange", onVisibility); } catch (e) {}
    try { window.removeEventListener("pagehide", onLeave); } catch (e) {}
    try { window.removeEventListener("blur", onLeave); } catch (e) {}
  }

  function onVisibility() {
    // Older browsers may not implement `document.hidden`; fall back to checking
    // visibilityState if available.
    var hidden = false;
    try {
      if (typeof document.hidden === "boolean") hidden = document.hidden;
      else if (document.visibilityState) hidden = document.visibilityState !== "visible";
    } catch (e) {}
    if (hidden) {
      done = true;     // native app opened — stop the fallback
      cleanup();
    }
  }

  function onLeave() {
    // Some Android WebViews don't fire visibilitychange but DO fire pagehide/blur
    // right before handing off to the system app.
    done = true;
    cleanup();
  }

  function runFallback() {
    fallbackTimer = null;
    if (done) return;
    // Same-tab navigation — not blocked by popup filters.
    try {
      window.location.href = webUrl;
    } catch (e) {
      // Last-ditch: do nothing rather than throwing on an exotic legacy WebView.
    }
  }

  try { document.addEventListener("visibilitychange", onVisibility); } catch (e) {}
  try { window.addEventListener("pagehide", onLeave); } catch (e) {}
  try { window.addEventListener("blur", onLeave); } catch (e) {}

  // Schedule the web fallback. 1400ms is long enough for the OS intent resolver
  // to take focus on slow devices but short enough to stay snappy.
  fallbackTimer = setTimeout(runFallback, 1400);

  // Fire the native scheme. Same-tab navigation — never opens a popup.
  try {
    window.location.href = nativeUrl;
  } catch (e) {
    // If even location assignment fails (very legacy WebView), trigger the
    // fallback immediately.
    cleanup();
    try { window.location.href = webUrl; } catch (e2) {}
  }
}

