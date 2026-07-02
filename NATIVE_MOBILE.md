# AutoFinance Mobile — Native iOS & Android

This project is a **Capacitor** shell around the AutoFinance web app.
It shares the same Supabase backend as the desktop web app
(`jpgqxztxaqgvvuqzahpo.supabase.co`), so users, RLS, contracts, dealers,
and payments are all the same data.

## What's inside

- **Web app**: TanStack Start (React) — runs in the preview and in production
- **Mobile shell**: Capacitor 8 for iOS and Android
- **Auth**: Supabase email/password using the existing web-app users

## Priority screens shipped (v1)

- Sign In (`/auth`)
- Dashboard (`/dashboard`) — KPI cards + recent contracts
- Contracts list (`/contracts`) — filter + search
- Contract detail (`/contracts/:id`)

The bottom tab bar also shows Dealers, Payments, and Documents as
placeholder tabs ready to fill in the next milestone.

## Build the native apps locally

You cannot build iOS/Android inside Lovable's sandbox — Xcode and Android
Studio are required. Do this on your laptop:

```bash
# 1. Clone/export the project locally, then install
bun install

# 2. Build the web assets
bun run build

# 3. Add native platforms (only once)
npx cap add ios
npx cap add android

# 4. Copy the web build into the native projects
npx cap sync

# 5. Open in the native IDEs
npx cap open ios       # requires macOS + Xcode
npx cap open android   # requires Android Studio
```

From there, run on a simulator or a physical device from Xcode / Android
Studio, or archive for the App Store / Google Play.

## Live reload against Lovable preview

For faster iteration you can point the native shell at the live Lovable
preview URL instead of bundling the web build:

1. Edit `capacitor.config.ts` and uncomment the `server.url` line.
2. Run `npx cap sync`, then `npx cap run ios` (or `android`).
3. Every change you make in Lovable will hot-reload inside the native app.

Remember to re-comment `server.url` before doing a production build.
