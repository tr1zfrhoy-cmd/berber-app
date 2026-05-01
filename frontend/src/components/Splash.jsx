import React, { useEffect, useState } from "react";
import { Scissors } from "lucide-react";

export default function Splash({ onDone }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 18 + 6;
        if (next >= 100) { clearInterval(t); setTimeout(onDone, 350); return 100; }
        return next;
      });
    }, 180);
    return () => clearInterval(t);
  }, [onDone]);

  return (
    <div data-testid="splash-screen" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] grain overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none"
           style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.18), transparent 60%)" }} />
      <div className="relative z-10 flex flex-col items-center gap-6 scale-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full pulse-gold" />
          <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-[#D4AF37] to-[#8B6914] gold-border">
            <Scissors className="w-12 h-12 text-black" strokeWidth={2.4} />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-black gold-text tracking-tight">حلاق دلفري</h1>
          <p className="mt-2 text-sm text-zinc-400 tracking-widest">BARBER · DELIVERY · LUXURY</p>
        </div>
        <div className="w-64 h-[3px] rounded-full bg-zinc-900 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#8B6914] via-[#D4AF37] to-[#F3E5AB] transition-all duration-200"
               style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-zinc-500">جاري التحميل... {Math.floor(progress)}%</div>
      </div>
    </div>
  );
}
