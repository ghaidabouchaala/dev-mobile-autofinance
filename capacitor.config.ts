import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor config for building AutoFinance Mobile as a native iOS/Android app.
// See NATIVE_MOBILE.md for build steps.
const config: CapacitorConfig = {
  appId: "com.autofinance.mobile",
  appName: "AutoFinance",
  webDir: "dist",
  server: {
    // When developing against Lovable preview, uncomment and set to your
    // preview URL to hot-reload the native shell against live web changes:
    // url: "https://id-preview--67ea133b-e51c-4ec5-a945-ec9f159404c9.lovable.app",
    // cleartext: true,
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
