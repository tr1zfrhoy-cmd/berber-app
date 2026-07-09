import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors, MapPin, Star, ChevronLeft } from "lucide-react";

const SLIDES = [
  {
    icon: <Scissors className="w-14 h-14" />,
    title: "احجز حلاقك المفضل",
    body: "اختار الخدمة اللي تحتاجها، شوف الحلاقين القريبين، واحجز بضغطة واحدة.",
    color: "from-[#F3E5AB] to-[#D4AF37]",
  },
  {
    icon: <MapPin className="w-14 h-14" />,
    title: "يوصلك أينما كنت",
    body: "الحلاق ييجيك ببابك خلال دقائق. لا مواصلات، لا انتظار، لا زحمة.",
    color: "from-[#D4AF37] to-[#8B6914]",
  },
  {
    icon: <Star className="w-14 h-14 fill-current" />,
    title: "قيّم وشارك تجربتك",
    body: "بعد كل خدمة قيّم الحلاق، وساعد باقي الزبائن يختاروا الأفضل.",
    color: "from-emerald-400 to-emerald-700",
  },
];

/**
 * First-run onboarding — 3 swipeable slides.
 * Uses localStorage to remember completion. `App.js` redirects here when
 * `onboarded` is not set. Fully offline; every asset is bundled.
 */
export default function Onboarding() {
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);

  const finish = () => {
    try { localStorage.setItem("berber_onboarded", "1"); } catch (e) {}
    nav("/auth", { replace: true });
  };

  const next = () => {
    if (idx < SLIDES.length - 1) setIdx(idx + 1);
    else finish();
  };

  const slide = SLIDES[idx];

  return (
    <div className="min-h-screen bg-[#050505] grain flex flex-col" data-testid="onboarding-page">
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button data-testid="onboarding-skip" onClick={finish}
          className="text-xs text-zinc-400 hover:text-white transition">
          تخطّي
        </button>
      </div>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slide.color} text-black flex items-center justify-center shadow-[0_20px_60px_rgba(212,175,55,0.35)] fade-in`}
          key={`icon-${idx}`}>
          {slide.icon}
        </div>
        <h1 className="text-2xl font-black" key={`title-${idx}`}>{slide.title}</h1>
        <p className="text-sm text-zinc-400 leading-8 max-w-xs" key={`body-${idx}`}>
          {slide.body}
        </p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`slide-${i}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-[#D4AF37]" : "w-1.5 bg-white/20"}`} />
        ))}
      </div>

      {/* CTA */}
      <div className="p-6 pt-0">
        <button data-testid="onboarding-next" onClick={next}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#8B6914] text-black font-black active:scale-95 transition flex items-center justify-center gap-2">
          {idx === SLIDES.length - 1 ? "ابدأ الآن" : (<>التالي <ChevronLeft className="w-4 h-4" /></>)}
        </button>
      </div>
    </div>
  );
}
