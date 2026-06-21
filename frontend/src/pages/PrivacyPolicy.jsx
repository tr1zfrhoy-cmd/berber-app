import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";
import { api } from "../lib/api";
import Markdown from "../components/Markdown";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get("/legal/privacy")
      .then(({ data }) => { if (!cancelled) setText(data?.text || ""); })
      .catch(() => { if (!cancelled) setText(""); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="px-5 pt-6 pb-6 space-y-5" data-testid="privacy-page">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#D4AF37]" /> سياسة الخصوصية
          </h1>
          <p className="text-xs text-zinc-500 mt-1">آخر تحديث: {today}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#121212] border border-white/5 p-5 leading-relaxed text-sm">
        {loading ? (
          <p className="text-center text-zinc-500 py-6">جاري التحميل…</p>
        ) : !text ? (
          <p className="text-center text-zinc-500 py-6">تعذّر تحميل السياسة، حاول لاحقاً.</p>
        ) : (
          <Markdown text={text} testid="privacy-markdown" />
        )}

        <p className="text-xs text-zinc-500 pt-3 mt-3 border-t border-white/5">
          © {new Date().getFullYear()} Berber. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
