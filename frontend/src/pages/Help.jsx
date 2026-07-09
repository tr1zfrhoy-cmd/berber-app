import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, HelpCircle, ChevronDown } from "lucide-react";

const FAQ = [
  {
    q: "كيف أحجز حلاق؟",
    a: "من الصفحة الرئيسية اختر الخدمة (حلاقة رجالية، حلاقة أطفال، إلخ)، ثم حدد موقعك على الخريطة، واضغط تأكيد الحجز. الحلاقين القريبين سيصلهم الطلب فوراً وأول من يقبله يبدأ برحلته إليك."
  },
  {
    q: "كم تستغرق الخدمة عادةً؟",
    a: "من لحظة الحجز حتى وصول الحلاق: بين 15 و 45 دقيقة حسب موقعك وحركة المرور. الحلاقة نفسها تأخذ 20-40 دقيقة حسب نوع القصّة."
  },
  {
    q: "كيف يعمل نظام العمولة للحلاقين؟",
    a: "الحلاق يشحن محفظته من الإدارة (شحن مسبق)، وعند قبول أي طلب تُخصم عمولة ثابتة (500 د.ع افتراضياً) من محفظته. الزبون يدفع كامل السعر نقداً للحلاق بعد انتهاء الخدمة."
  },
  {
    q: "هل الأسعار ثابتة؟",
    a: "نعم، الأسعار محددة ومعلنة داخل التطبيق قبل الحجز. ما كو مفاجآت ولا رسوم إضافية. السعر يشمل خدمة الحلاق فقط، والأدوات على حسابه."
  },
  {
    q: "كيف أعدّل معلومات حسابي؟",
    a: "من الشاشة الرئيسية اضغط على أيقونة الإعدادات (الترس) في أسفل الشاشة. تقدر تحدّث اسمك، رقمك، صورتك الشخصية، وموقعك، وتغيير كلمة المرور من نفس الصفحة."
  },
  {
    q: "أنا حلاق — كيف أنضمّ إلى المنصة؟",
    a: "عند إنشاء حساب جديد، اختر 'حلاق' كنوع الحساب. سيتم مراجعة طلبك من الإدارة وتفعيله خلال 24 ساعة. تواصل مع الدعم على واتساب لتسريع التفعيل."
  },
  {
    q: "كيف أُبلغ عن مشكلة مع حلاق؟",
    a: "من قائمة 'أعمال الحلاقين' يمكنك الضغط على أيقونة العَلَم على أي صورة للإبلاغ. للشكاوى الجدية تواصل مباشرة مع الدعم على واتساب أو بالبريد الإلكتروني."
  },
  {
    q: "هل يعمل التطبيق بدون إنترنت؟",
    a: "الحجز وقبول الطلبات يحتاجون إنترنت. لكن صفحات 'من نحن' و 'اتصل بنا' و 'الأسئلة الشائعة' تعمل بدون إنترنت. كذلك تقدر تفتح ملفك الشخصي وتشوف حجوزاتك السابقة أوفلاين."
  },
  {
    q: "هل بياناتي آمنة؟",
    a: "نعم. كلمة المرور مشفّرة بـ bcrypt، والاتصالات كلها عبر HTTPS. ما نشارك بياناتك مع أي طرف ثالث. للتفاصيل الكاملة، طالع سياسة الخصوصية."
  },
  {
    q: "كيف أُلغي حسابي نهائياً؟",
    a: "تواصل مع الدعم عبر واتساب مع طلب حذف نهائي. سيتم حذف كل بياناتك من قواعدنا خلال 48 ساعة، ولا يمكن استرجاعها بعد الحذف."
  },
];

export default function Help() {
  const [open, setOpen] = useState(0);

  return (
    <div className="px-5 pt-6 pb-8 space-y-5" data-testid="help-page">
      <div className="flex items-center gap-3">
        <Link to={-1} className="w-10 h-10 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </Link>
        <div>
          <p className="text-zinc-400 text-sm">مركز المساعدة</p>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#D4AF37]" /> الأسئلة الشائعة
          </h1>
        </div>
      </div>

      <p className="text-sm text-zinc-400 leading-7 px-1">
        جمعنا لك أجوبة الأسئلة الأكثر شيوعاً. لو ما لقيت جوابك، تواصل مع الدعم مباشرة.
      </p>

      <div className="space-y-2">
        {FAQ.map((item, i) => (
          <div key={item.q} data-testid={`faq-item-${i}`}
            className="rounded-2xl bg-[#121212] border border-white/5 overflow-hidden">
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition">
              <span className="w-7 h-7 shrink-0 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-black flex items-center justify-center">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-bold">{item.q}</span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${open === i ? "rotate-180 text-[#D4AF37]" : ""}`} />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-xs text-zinc-300 leading-7 border-t border-white/5 pt-3">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <Link to="/app/contact" data-testid="help-contact-link"
        className="block w-full py-4 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#8B6914] text-black font-black text-center active:scale-95 transition">
        ما لقيت جوابك؟ تواصل مع الدعم
      </Link>
    </div>
  );
}
