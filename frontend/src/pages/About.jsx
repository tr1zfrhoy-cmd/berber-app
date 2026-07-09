import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Scissors, MapPin, Clock, Users, Award, Sparkles, Star, Heart, PhoneCall } from "lucide-react";

/**
 * "About Us" page — fully offline capable.
 * Content is bundled inside the JS chunk so it renders even without network.
 */
export default function About() {
  return (
    <div className="px-5 pt-6 pb-8 space-y-6" data-testid="about-page">
      <div className="flex items-center gap-3">
        <Link to={-1} className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </Link>
        <div>
          <p className="text-zinc-400 text-sm">تعرّف على</p>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Scissors className="w-6 h-6 text-[#D4AF37]" /> Berber
          </h1>
        </div>
      </div>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1208] via-[#0a0a0a] to-[#050505] border border-[#D4AF37]/20 p-6 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#F3E5AB] to-[#8B6914] flex items-center justify-center shadow-[0_10px_40px_rgba(212,175,55,0.4)]">
          <Scissors className="w-9 h-9 text-black" />
        </div>
        <h2 className="text-2xl font-black mb-2">
          <span className="gold-text">حلاق دلفري</span>
        </h2>
        <p className="text-sm text-zinc-400 leading-7">
          الحلاق الفاخر يجيك لباب بيتك.
        </p>
      </div>

      {/* Story */}
      <section className="rounded-2xl bg-[#121212] border border-white/5 p-5 space-y-3 leading-8">
        <h3 className="font-black text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" /> قصّتنا
        </h3>
        <p className="text-sm text-zinc-300">
          <b className="text-white">Berber</b> فكرة عراقية أصيلة، طلعت من حاجة يومية يعرفها كل زلمة: تريد تحلق شعرك، بس السالون بعيد، أو الوقت ما يسمح، أو المزاج يريد راحة البيت.
        </p>
        <p className="text-sm text-zinc-300">
          فقلنا: ليش ما نقلبها؟ بدل ما تروح للحلاق، خلي الحلاق ييجيك! جمعنا أحسن حلاقين بغداد بمنصة واحدة، مدرّبين وأدواتهم معقّمة، ويوصلونك بأقصر وقت — تحلق بحضرة أهلك أو أصدقاءك، وأنت مرتاح بديوانك.
        </p>
        <p className="text-sm text-zinc-300">
          هدفنا بسيط: <b className="text-[#D4AF37]">نخليك أنيق بدون ما تخسر وقتك</b>. لأنه الوقت غالي، وهيبتك أغلى.
        </p>
      </section>

      {/* Numbers */}
      <section className="grid grid-cols-2 gap-3">
        <Stat icon={<Users className="w-5 h-5" />} n="+500" label="حلاق محترف" />
        <Stat icon={<Scissors className="w-5 h-5" />} n="+15,000" label="قصّة شعر" />
        <Stat icon={<Star className="w-5 h-5" />} n="4.9" label="تقييم العملاء" />
        <Stat icon={<Clock className="w-5 h-5" />} n="24/7" label="دعم فوري" />
      </section>

      {/* Values */}
      <section className="rounded-2xl bg-[#121212] border border-white/5 p-5 space-y-4">
        <h3 className="font-black text-base flex items-center gap-2">
          <Award className="w-4 h-4 text-[#D4AF37]" /> ليش تختار Berber؟
        </h3>
        <ValueRow icon={<Sparkles className="w-4 h-4" />} title="جودة عالية" text="حلاقين مدرّبين وأدوات معقّمة، خبرة سنين بيدك." />
        <ValueRow icon={<Clock className="w-4 h-4" />} title="سرعة" text="من ضغطة زر إلى وصول الحلاق ببابك — بأقل من نص ساعة بالمعدّل." />
        <ValueRow icon={<MapPin className="w-4 h-4" />} title="تغطية بغداد" text="من الرصافة للكرخ، ومن الكرادة للمنصور — إحنا وياك بكل مكان." />
        <ValueRow icon={<Heart className="w-4 h-4" />} title="أسعار عادلة" text="ما كو مفاجآت. السعر واضح قبل ما تحجز، ودفع نقدي مباشرة للحلاق." />
      </section>

      {/* CTA */}
      <Link to="/app/contact" data-testid="about-contact-cta"
        className="block w-full py-4 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#8B6914] text-black font-black text-center transition active:scale-95">
        <PhoneCall className="inline w-4 h-4 ml-1" /> تواصل معنا
      </Link>

      {/* App version */}
      <div className="text-center text-[11px] text-zinc-500 pt-2">
        الإصدار 1.0.0 · © {new Date().getFullYear()} Berber
      </div>
    </div>
  );
}

const Stat = ({ icon, n, label }) => (
  <div className="rounded-2xl bg-[#121212] border border-white/5 p-4 text-center">
    <div className="w-9 h-9 mx-auto mb-2 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">{icon}</div>
    <div className="text-xl font-black gold-text">{n}</div>
    <div className="text-[11px] text-zinc-400 mt-1">{label}</div>
  </div>
);

const ValueRow = ({ icon, title, text }) => (
  <div className="flex gap-3">
    <div className="w-9 h-9 shrink-0 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">{icon}</div>
    <div>
      <div className="text-sm font-bold mb-0.5">{title}</div>
      <div className="text-xs text-zinc-400 leading-6">{text}</div>
    </div>
  </div>
);
