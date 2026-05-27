/**
 * Silent image download — fetches the image as a Blob and writes it to the
 * user's device. Uses the modern File System Access API (showSaveFilePicker)
 * when available (Chrome / Edge / TWA on Android), and falls back to the
 * classic `<a download>` trick on older browsers and iOS Safari.
 *
 * Returns true on success, false if the user aborted the OS save dialog.
 * Throws on network/HTTP failure so the caller can show a toast.
 */
export async function downloadImage(url, filename = "berber.jpg") {
  if (!url) throw new Error("no url");

  // Fetch the image binary. credentials: 'omit' because portfolio images are public.
  const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();

  // Derive a safer filename + extension from the blob's MIME type.
  const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const safeName = filename.replace(/[^\w\-.]+/g, "_").replace(/\.(jpg|jpeg|png|webp)?$/i, "") + `.${ext}`;

  // Modern path — opens the OS file picker, fully silent, no Chrome download bar.
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: safeName,
        types: [{
          description: "صورة",
          accept: { [blob.type || "image/jpeg"]: [`.${ext}`] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e) {
      if (e?.name === "AbortError") return false;     // user cancelled
      // any other failure → fall through to legacy method
    }
  }

  // Legacy path — Chrome's built-in download manager (works in TWA + iOS).
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = safeName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
  return true;
}
