// Convert any axios/fastapi error into a safe display string.
const OFFLINE_MSG = "عذراً، لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة وإعادة المحاولة 🔌";

const isNetworkError = (err) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (err?.code === "ERR_NETWORK" || err?.code === "ECONNABORTED") return true;
  // axios sets message="Network Error" when the browser blocks the request
  if (err?.message === "Network Error") return true;
  // No HTTP response reached us (blocked / offline / DNS fail)
  if (err && !err.response && err.request) return true;
  return false;
};

export function errMsg(err, fallback = "حدث خطأ، حاول مرة أخرى") {
  if (isNetworkError(err)) return OFFLINE_MSG;
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    const m = d[0]?.msg;
    return typeof m === "string" ? m : fallback;
  }
  if (d && typeof d === "object") return d.msg || fallback;
  const m = err?.message;
  // Never surface raw English SDK messages to Arabic users.
  if (!m || /^[\x00-\x7F]+$/.test(m)) return fallback;
  return m;
}

// Dev-only diagnostic logger. Stripped from production console.
export function logErr(label, err) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(label, err);
  }
}
