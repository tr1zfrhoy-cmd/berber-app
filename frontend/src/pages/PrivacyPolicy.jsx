import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });

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

      <div className="rounded-2xl bg-[#121212] border border-white/5 p-5 leading-relaxed text-sm space-y-5">
        <Section title="مقدمة">
          نحن في تطبيق <b>Berber</b> نلتزم بحماية خصوصية مستخدمينا (الزبائن والحلاقين). توضّح هذه السياسة
          أنواع البيانات التي نجمعها، وكيفية استخدامها وحمايتها، وحقوقك تجاه بياناتك.
          باستخدامك للتطبيق فإنك توافق على ما ورد في هذه السياسة.
        </Section>

        <Section title="١. البيانات التي نجمعها">
          <List items={[
            "بيانات الحساب: الاسم الكامل، رقم الهاتف، كلمة المرور (مشفرة).",
            "بيانات الموقع الجغرافي: نطلب موقعك لتحديد الحلاقين القريبين منك ولإيصال الخدمة لباب بيتك.",
            "بيانات الخدمة: تفاصيل الحجوزات، الأسعار، التقييمات، والمحادثات مع الدعم.",
            "بيانات الحلاق: الصورة الشخصية، معرض الأعمال، نبذة عن الحلاق، رصيد المحفظة.",
            "البيانات التقنية: نوع الجهاز، نظام التشغيل، عنوان IP، وأوقات الاستخدام (لأغراض الأمان).",
          ]} />
        </Section>

        <Section title="٢. كيفية استخدام البيانات">
          <List items={[
            "تنفيذ خدمة الحجز وإيصال الحلاق إلى موقعك.",
            "تواصل الحلاق مع الزبون عبر الهاتف لتأكيد الموقع.",
            "حساب العمولات وإدارة محفظة الحلاق.",
            "تحسين تجربة المستخدم وتطوير ميزات جديدة.",
            "حماية المنصة من الاحتيال وسوء الاستخدام.",
            "إرسال إشعارات عن الطلبات الجديدة وحالة الحجز.",
          ]} />
        </Section>

        <Section title="٣. مشاركة البيانات">
          <p>لا نبيع بياناتك لأي طرف ثالث. نشارك جزءاً محدوداً منها فقط في الحالات التالية:</p>
          <List items={[
            "بين الزبون والحلاق لإتمام الحجز (الاسم، الهاتف، العنوان).",
            "مع الإدارة لمعالجة الشكاوى وإدارة المحفظة.",
            "عند طلب رسمي من جهة قضائية أو حكومية مختصة.",
          ]} />
        </Section>

        <Section title="٤. تخزين البيانات وحمايتها">
          <List items={[
            "البيانات مخزّنة على خوادم آمنة بنظام تشفير حديث.",
            "كلمات المرور مشفّرة بـ bcrypt (لا يمكن استرجاعها كنص واضح).",
            "جلسات الدخول مؤمّنة عبر JWT.",
            "نطبّق إجراءات أمنية قياسية لمنع الوصول غير المصرّح به.",
          ]} />
        </Section>

        <Section title="٥. حقوقك">
          <List items={[
            "حق الوصول: يمكنك الاطلاع على بياناتك في صفحة الإعدادات.",
            "حق التعديل: يمكنك تحديث الاسم، الهاتف، الصورة، والموقع في أي وقت.",
            "حق الحذف: يمكنك طلب حذف حسابك وكل بياناتك بمراسلة الدعم على واتساب.",
            "حق التحكم بالإشعارات: يمكنك تفعيلها أو إيقافها من إعدادات جهازك.",
          ]} />
        </Section>

        <Section title="٦. الإشعارات والموقع">
          نطلب صلاحيات الموقع والإشعارات لتقديم الخدمة بأفضل شكل. يمكنك رفضها أو إلغاؤها في أي وقت
          من إعدادات نظام التشغيل، علماً أن بعض الميزات قد تتأثر.
        </Section>

        <Section title="٧. حماية الأطفال">
          التطبيق غير موجّه للأطفال دون 13 سنة. لا نجمع بيانات منهم عمداً.
        </Section>

        <Section title="٨. التغييرات على هذه السياسة">
          قد نُحدّث هذه السياسة من وقت لآخر. سنُشعرك بالتغييرات الجوهرية عبر التطبيق أو الواتساب.
          الاستمرار في استخدام التطبيق بعد التحديث يُعدّ موافقة على السياسة الجديدة.
        </Section>

        <Section title="٩. التواصل معنا">
          لأي استفسار أو طلب يخص خصوصيتك، يرجى التواصل معنا عبر:
          <List items={[
            "واتساب: 07812059874",
            "بريد إلكتروني: tr1zfrhoy@gmail.com",
          ]} />
        </Section>

        <p className="text-xs text-zinc-500 pt-2 border-t border-white/5">
          © {new Date().getFullYear()} Berber. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div>
    <h2 className="font-black text-base text-[#D4AF37] mb-2">{title}</h2>
    <div className="text-zinc-300 leading-7">{children}</div>
  </div>
);

const List = ({ items }) => (
  <ul className="mt-2 space-y-1.5 list-none">
    {items.map((t, i) => (
      <li key={i} className="flex gap-2">
        <span className="text-[#D4AF37] flex-shrink-0">•</span>
        <span>{t}</span>
      </li>
    ))}
  </ul>
);
