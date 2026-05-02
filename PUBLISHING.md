# 📦 نشر تطبيق Berber على المتاجر

## 🌐 PWA (تثبيت من المتصفح فوراً)
التطبيق جاهز كـ PWA. يمكن للمستخدم تثبيته الآن:
- **Android (Chrome)**: افتح الموقع → ثلاث نقاط → "إضافة إلى الشاشة الرئيسية"
- **iOS (Safari)**: افتح الموقع → زر المشاركة → "إضافة إلى الشاشة الرئيسية"

السمات الجاهزة:
- ✅ Manifest + أيقونة SVG ذهبية لمقص حلاق
- ✅ Service Worker يعمل أوفلاين
- ✅ إشعارات Push من المتصفح/النظام
- ✅ noindex (مخفي من جوجل تماماً)
- ✅ شاشة فتح وألوان نظام

---

## 📱 نشر كتطبيق أصلي على Google Play & App Store

### 1. تثبيت Capacitor (مرة واحدة)
```bash
cd /app/frontend
yarn add @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
yarn add @capacitor/push-notifications @capacitor/local-notifications @capacitor/geolocation @capacitor/splash-screen
```

### 2. بناء النسخة الإنتاجية
```bash
yarn build
npx cap init Berber com.berber.app --web-dir=build
npx cap add android
npx cap add ios
npx cap sync
```

### 3. توليد APK لـ Android (Google Play)
```bash
npx cap open android
# في Android Studio: Build → Generate Signed Bundle / APK
# اختر AAB (موصى به للمتجر) أو APK
```
- أنشئ keystore (مفتاح توقيع) في Android Studio.
- ارفع ملف `.aab` إلى [Play Console](https://play.google.com/console).
- يحتاج حساب مطور (25$ مرة واحدة).

### 4. توليد IPA لـ iOS (App Store)
```bash
npx cap open ios
# في Xcode: Product → Archive → Distribute App
```
- يحتاج Apple Developer Account (99$ سنوياً).
- ارفع IPA إلى [App Store Connect](https://appstoreconnect.apple.com).

### 5. للمسؤول (نشر دفعة واحدة)
```bash
yarn build && npx cap sync && npx cap copy
```

---

## 🔒 الخصوصية والأمان
- ✅ `robots.txt` يمنع جميع محركات البحث.
- ✅ Meta `noindex, nofollow` على كل الصفحات.
- ✅ `referrer = no-referrer` لمنع تسريب الروابط.
- ✅ التطبيق لا يصل لأي ميزة قبل تسجيل الدخول.

---

## 🔑 معلومات النشر السريعة
- **App ID**: `com.berber.app`
- **App Name**: Berber
- **النسخة الحالية**: 1.0.0
- **النوع**: تطبيق خدمات (Lifestyle / Business)
- **اللغة**: العربية + الإنجليزية
- **الفئة العمرية**: للجميع (4+)

---

## 🎯 خطوات سريعة للنشر
1. ✅ التطبيق + الواجهة جاهزة
2. ⏳ سجّل لدى Google Play & Apple Developer
3. ⏳ أنشئ icons بأحجام (192/512 px) من `icon.svg`
4. ⏳ صور لقطات شاشة (8 لكل متجر) - الأبعاد القياسية
5. ⏳ نص وصف + سياسة خصوصية + شروط استخدام
6. ⏳ بناء + توقيع + رفع
