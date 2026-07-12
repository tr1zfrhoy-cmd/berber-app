import type { CapacitorConfig } from '@capacitor/cli';

// ---------------------------------------------------------------------------
// Berber · حلاق دلفري  ·  Native shell configuration (Android + iOS)
// ---------------------------------------------------------------------------
// This file drives Capacitor when the app is built as a real native
// mobile binary (APK / AAB / IPA). The React front-end is bundled
// inside `build/` and runs inside a native WebView + Capacitor bridge,
// giving us direct access to native APIs (haptics, share sheet, GPS,
// splash, status bar, etc.).
//
// IMPORTANT — Production URL:
//   All /api/* calls go to the deployed FastAPI backend at
//   REACT_APP_BACKEND_URL. We do NOT set `server.url` here because
//   we want the web bundle to be shipped INSIDE the APK (offline
//   capable), and the app already calls the correct absolute API URL
//   through axios (see src/lib/api.js).
//
// To rebuild after editing web code, from `/app/frontend`:
//   yarn build && npx cap sync
// ---------------------------------------------------------------------------

const config: CapacitorConfig = {
  appId: 'com.berber.app',
  appName: 'Berber',
  webDir: 'build',

  android: {
    // Use https scheme so mixed-content is not blocked when calling https backend
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#000000',
  },

  ios: {
    contentInset: 'always',
    backgroundColor: '#000000',
    preferredContentMode: 'mobile',
    limitsNavigationsToAppBoundDomains: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: false,       // JS calls SplashScreen.hide() when app is ready
      launchFadeOutDuration: 400,
      backgroundColor: '#000000',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',               // dark content on gold/light background — overridden at runtime
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
    Preferences: {
      group: 'BerberAppPrefs',
    },
    Geolocation: {
      // permission text is set in Info.plist / AndroidManifest.xml
    },
  },
};

export default config;
