import type { CapacitorConfig } from "@capacitor/cli";

// AutoFinance Mobile — native shell that loads the live web app.
// The web app is an SSR TanStack Start project with server functions, so it
// must be served from Lovable (or wherever you host it) rather than bundled
// offline into the APK. Change `server.url` to your production URL when you
// publish (e.g. https://autofinance.lovable.app).
const config: CapacitorConfig = {
  appId: "com.autofinance.mobile",
  appName: "AutoFinance",
  webDir: "dist",
  server: {
    // Live published URL for the AutoFinance web app.
    url: "https://autofinance-mobile.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
