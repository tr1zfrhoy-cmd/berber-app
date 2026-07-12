# 📱 دليل بناء تطبيق Berber Native (Android + iOS)

> **الحالة الحالية**: تم إعداد Capacitor 6 بالكامل داخل المشروع.  
> فولدر `android/` و `ios/` جاهزان.  
> يحتاج فقط جهاز عندك فيه أدوات البناء لإنتاج APK / IPA.

---

## 1️⃣ ما الذي تم إعداده هنا؟

- ✅ Capacitor 6 مثبّت (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`)
- ✅ 7 plugins أصلية:
  - `@capacitor/app` — إدارة دورة حياة التطبيق + زر الرجوع
  - `@capacitor/splash-screen` — سبلاش أصلي (سواد ذهبي)
  - `@capacitor/status-bar` — ستاتس بار داكن
  - `@capacitor/haptics` — اهتزازات أصلية عند وصول طلب جديد
  - `@capacitor/share` — قائمة مشاركة الأصلية للجهاز
  - `@capacitor/geolocation` — GPS دقيق
  - `@capacitor/preferences` — تخزين محلي أصلي
  - `@capacitor/network` — كشف اتصال الشبكة الأصلي
- ✅ `capacitor.config.ts` مضبوط بـ `appId=com.berber.app`, `webDir=build`
- ✅ فولدر `android/` مع صلاحيات الموقع/الاهتزاز/الإشعارات + `<queries>` للـ WhatsApp intent
- ✅ فولدر `ios/` مع `NSLocationWhenInUseUsageDescription` بالعربية
- ✅ طبقة `src/lib/native.js` تتبدّل تلقائياً بين APIs الأصلية والويب
- ✅ Splash / Share / Vibrate / GPS / Storage كلها تستدعي Capacitor إذا كنا داخل APK

---

## 2️⃣ ماذا يحتاج جهازك لبناء APK؟

- Node 20+
- **Android Studio** (يحمل معه Android SDK + Gradle + JDK 17)
- (اختياري) macOS مع **Xcode 15+** لبناء IPA

---

## 3️⃣ خطوات بناء APK (Android) خطوة بخطوة

### الطريقة أ — عبر Android Studio (الأسهل)

```bash
# على جهازك المحلي (Windows / Mac / Linux)
git clone <your-repo>
cd frontend
yarn install
yarn build          # ينتج مجلد build/
npx cap sync        # ينسخ build/ إلى android/app/src/main/assets/public/
npx cap open android   # يفتح Android Studio على المشروع
```

داخل Android Studio:
1. انتظر Gradle sync أول مرة (~5 دقائق).
2. **Build → Generate Signed Bundle / APK → APK**
3. **Create new keystore** (إن كانت أول مرة):
   - Path: `~/keystores/berber.jks`
   - **احفظ كلمة السر بمكان آمن!** لا يمكن استرجاعها.
   - Alias: `berber`
   - Validity: 30 سنة
   - أدخل اسمك ودولة وعنوان.
4. اختر **release** → **V1 و V2 signature**
5. النتيجة: `android/app/release/app-release.apk`

### الطريقة ب — سطر الأوامر مباشرة

```bash
cd android
./gradlew assembleRelease
# النتيجة: android/app/build/outputs/apk/release/app-release-unsigned.apk
# ثم وقّع الملف بيدك:
zipalign -v -p 4 app-release-unsigned.apk app-release-aligned.apk
apksigner sign --ks ~/keystores/berber.jks --out app-release.apk app-release-aligned.apk
```

---

## 4️⃣ خطوات بناء IPA (iOS) — يحتاج macOS + Xcode

```bash
yarn build
npx cap sync ios
npx cap open ios       # يفتح Xcode
```

داخل Xcode:
1. **Signing & Capabilities** → اختر فريقك (Apple Developer Account مطلوب)
2. **Product → Archive**
3. **Distribute App → App Store Connect / Ad-hoc**

---

## 5️⃣ رفع الـ APK على Uptodown

1. اذهب إلى https://en.uptodown.com/publishing
2. **Upload New App**
3. ارفع `app-release.apk`
4. عبّئ بالعربية:
   - **العنوان**: Berber · حلاق دلفري
   - **الوصف**: تطبيق حلاقة دلفري فاخر لبغداد. اطلب حلاقك المفضل عند بابك بضغطة زر.
   - **الفئة**: Lifestyle
   - **السن**: 3+
5. لقطات شاشة (على الأقل 4): من الصفحة الرئيسية، الحجز، الحلاق، الإعدادات.
6. **Digital Asset Links** — إذا سألوا عن SHA-256 للتوقيع:
   ```bash
   keytool -list -v -keystore ~/keystores/berber.jks -alias berber
   ```
   انسخ سطر `SHA-256:` والصقه في `/app/frontend/public/.well-known/assetlinks.json`
   ثم اعمل Deploy جديد على Emergent.

---

## 6️⃣ أوامر Capacitor السريعة (من داخل مجلد frontend)

| الأمر | الوظيفة |
|-------|--------|
| `yarn cap:sync` | build + sync لكل الملفات إلى android/ و ios/ |
| `yarn cap:android` | build + sync + افتح Android Studio |
| `yarn cap:ios` | build + sync + افتح Xcode |
| `npx cap doctor` | فحص شامل لكل شي |
| `npx cap update android` | ترقية plugins بعد `yarn upgrade` |

**قاعدة ذهبية**: كل مرة تغيّر شي في كود React → لازم تعيد `yarn build && npx cap sync` قبل بناء APK جديد.

---

## 7️⃣ ماذا فعلنا لضمان قبول Uptodown هذه المرة؟

- ❌ **قديم**: تطبيق TWA (Trusted Web Activity) — يقرأ URL من الإنترنت → مرفوض كـ "web wrapper".
- ✅ **جديد**: Capacitor يضمّن كل ملفات الويب داخل APK نفسه (`android/app/src/main/assets/public/`). التطبيق يشتغل بالكامل من الملفات المدمجة، بينما استدعاءات `/api/*` فقط تذهب للخادم.
- ✅ **APIs أصلية**: haptics, share sheet, native GPS, preferences — كلها تُستدعى من Capacitor bridge وليس WebView APIs.
- ✅ **Manifest صحيح**: صلاحيات الأندرويد مضبوطة + `<queries>` للـ intents.
- ✅ **iOS Info.plist**: usage descriptions بالعربية للـ App Store review team.

---

## 8️⃣ (اختياري) GitHub Actions لبناء APK تلقائي

إذا رفعت المشروع على GitHub، أنشئ `.github/workflows/android.yml`:

```yaml
name: Android Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - run: yarn install --frozen-lockfile
        working-directory: frontend
      - run: yarn build
        working-directory: frontend
      - run: npx cap sync android
        working-directory: frontend
      - run: ./gradlew assembleRelease
        working-directory: frontend/android
      - uses: actions/upload-artifact@v4
        with:
          name: berber-apk
          path: frontend/android/app/build/outputs/apk/release/*.apk
```

سيبني لك APK بعد كل commit تلقائياً.

---

## 9️⃣ استكشاف الأخطاء الشائعة

| مشكلة | الحل |
|-------|------|
| `SDK location not found` | ضع `sdk.dir=/path/to/Android/Sdk` في `android/local.properties` |
| `Gradle sync failed` | افتح `android/build.gradle` وتأكد `compileSdkVersion` = 34 |
| APK يفتح شاشة بيضاء | تأكد `yarn build` نجح ثم `npx cap sync` قبل البناء |
| `/api/*` يرجع فشل شبكة داخل APK | تأكد `REACT_APP_BACKEND_URL` في `.env` يشير للـ Emergent host (وليس preview) |

---

**بالتوفيق!** ✂️🌹  
أي سؤال إضافي — رجعلي في المحادثة.
