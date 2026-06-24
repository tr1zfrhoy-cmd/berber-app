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

const getTarget = (fallback = "9647812059874") =>
  cleanPhone(SUPPORT?.whatsapp_phone || fallback);

// Kept for backwards compatibility (some places still rely on the web URL,
// e.g. <a> tags inside Markdown). New code should call `openWhatsApp(user)`.
export function supportWhatsappUrl(user, phoneFallback = "9647812059874") {
  const target = getTarget(phoneFallback);
  const text = encodeURIComponent(buildText(user));
  return `https://wa.me/${target}?text=${text}`;
}

/**
 * Open WhatsApp natively on the user's device.
 *
 * Strategy (works inside a TWA, regular browser, and iOS Safari):
 *   1. Trigger the `whatsapp://` URI scheme — registered by BOTH WhatsApp
 *      and WhatsApp Business on Android (and by WhatsApp on iOS). The OS picks
 *      whichever app is installed; if both are installed it picks the user's
 *      remembered default. This bypasses Chrome Custom Tabs entirely.
 *   2. If no WhatsApp variant is installed, the page stays visible — we fall
 *      back to the public `https://wa.me/...` link after a short delay so the
 *      user can install WhatsApp from the web.
 *
 * @param {object} user      current authenticated user (used to prefill text)
 * @param {string} fallback  emergency phone number when SUPPORT.whatsapp_phone is missing
 */
export function openWhatsApp(user, fallback = "9647812059874") {
  const target = getTarget(fallback);
  const text = buildText(user);
  const encoded = encodeURIComponent(text);

  const nativeUrl = `whatsapp://send?phone=${target}&text=${encoded}`;
  const webUrl = `https://wa.me/${target}?text=${encoded}`;

  // SSR / non-browser safety (unit tests etc.)
  if (typeof window === "undefined") return;

  const start = Date.now();
  // If WhatsApp opens, the page goes background within ~600ms — cancel the web fallback.
  const fallbackTimer = setTimeout(() => {
    if (document.hidden) return;
    if (Date.now() - start > 4000) return; // user already moved on, don't hijack
    // Use _top to escape any embedded webview / iframe context.
    try { window.open(webUrl, "_blank", "noopener"); }
    catch { window.location.href = webUrl; }
  }, 1400);

  const onVisibility = () => {
    if (document.hidden) {
      clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  // Fire the native scheme. On Android TWA Chrome lets this propagate to the
  // system intent resolver (which finds com.whatsapp / com.whatsapp.w4b).
  window.location.href = nativeUrl;
}

