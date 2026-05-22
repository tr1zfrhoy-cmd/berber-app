// Convert any axios/fastapi error into a safe display string.
export function errMsg(err, fallback = "حدث خطأ، حاول مرة أخرى") {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    const m = d[0]?.msg;
    return typeof m === "string" ? m : fallback;
  }
  if (d && typeof d === "object") return d.msg || fallback;
  return err?.message || fallback;
}

// Dev-only diagnostic logger. Stripped from production console.
export function logErr(label, err) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(label, err);
  }
}
