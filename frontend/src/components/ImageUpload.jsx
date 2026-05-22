import React, { useRef, useState } from "react";
import { api } from "../lib/api";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { errMsg } from "../lib/errors";

/**
 * Single image picker: replaces a text URL input with a native file picker.
 * Stores the returned URL in `value` and calls onChange(url).
 */
export function AvatarUpload({ value, onChange, kind = "avatar", label = "اختر صورة", testid }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("اختر صورة من معرض الهاتف");
    upload(file);
  };

  const upload = async (file) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/upload?kind=${kind}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
      toast.success("تم رفع الصورة");
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative">
          <img src={value} alt="" className="w-16 h-16 rounded-2xl object-cover border border-[#D4AF37]/40" />
          <button type="button" onClick={() => onChange("")}
            data-testid={testid ? `${testid}-remove` : undefined}
            className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-2xl bg-black/30 border border-dashed border-white/15 flex items-center justify-center text-zinc-500">
          <ImagePlus className="w-6 h-6" />
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={pick}
        className="hidden" data-testid={testid} />
      <button type="button" onClick={() => ref.current?.click()} disabled={busy}
        data-testid={testid ? `${testid}-btn` : undefined}
        className="flex-1 py-3 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#D4AF37]/25 transition disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {busy ? "جاري الرفع..." : label}
      </button>
    </div>
  );
}

/**
 * Multi-image picker for the barber's portfolio gallery.
 * `value` is an array of URLs. onChange receives the new array.
 */
export function GalleryUpload({ value = [], onChange, max = 10, testid }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (value.length + files.length > max) {
      return toast.error(`الحد الأقصى ${max} صور`);
    }
    setBusy(true);
    const uploaded = [];
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post(`/upload?kind=portfolio`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploaded.push(data.url);
      }
      onChange([...value, ...uploaded]);
      toast.success(`تم رفع ${uploaded.length} صورة`);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {value.map((url, i) => (
          <div key={url || i} className="relative group aspect-square">
            <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-white/10" />
            <button onClick={() => remove(i)}
              data-testid={`gallery-remove-${i}`}
              className="absolute top-1 left-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-90">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => ref.current?.click()} disabled={busy}
            data-testid={testid || "gallery-add-btn"}
            className="aspect-square rounded-xl border-2 border-dashed border-white/15 bg-black/20 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition flex flex-col items-center justify-center gap-1 text-zinc-500 disabled:opacity-50">
            {busy ? <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" /> : <ImagePlus className="w-6 h-6" />}
            <span className="text-[10px] font-bold">{busy ? "..." : "أضف صورة"}</span>
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
      <div className="text-[11px] text-zinc-500 text-center">
        {value.length}/{max} صور · حد كل صورة 6MB
      </div>
    </div>
  );
}
