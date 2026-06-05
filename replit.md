# FinTrack — Savings & Expense Tracker

Premium dark-mode SaaS mobile app for tracking savings and expenses with multi-user auth, IDR/USD currency, Telegram bot admin panel, and Google Sheets sync.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `SESSION_SECRET` — Express session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo + React Native (Expo Router tabs)
- API: Express 5
- Persistence: AsyncStorage (client), `.data/users.json` (server-side user store)
- Fonts: Inter (via expo-google-fonts)

## Where things live

- `artifacts/mobile/` — Expo React Native app
  - `app/(tabs)/` — tab screens: index (dashboard), transactions, goals, profile, admin
  - `app/upgrade.tsx` — Pro upgrade screen (IDR pricing: Rp 15.000 / Rp 35.000)
  - `context/AuthContext.tsx` — auth state, tier polling, upgrade notices
  - `context/AppContext.tsx` — transactions + goals (AsyncStorage)
  - `components/UpgradeNotice.tsx` — animated real-time upgrade modal
  - `components/BadgeIcon.tsx` — dynamic tier badges (basic/pro_blue/pro_purple)
  - `hooks/useColors.ts` — dark theme token map
- `artifacts/api-server/src/` — Express API
  - `lib/user-store.ts` — **source of truth** for user tiers (in-memory + `.data/users.json`)
  - `lib/telegram-bot.ts` — Telegram bot admin: `/upgrade`, `/list` commands
  - `lib/google-sheets.ts` — Google Sheets sync
  - `routes/admin.ts` — GET /api/admin/users, POST /api/admin/upgrade
  - `routes/profile.ts` — GET/POST /api/profile/:username + ack
  - `routes/notifications.ts` — real-time upgrade notification polling

## Architecture decisions

- **No PostgreSQL** — uses AsyncStorage (client) + `.data/users.json` (server) for simplicity; no DB migrations needed.
- **User store is server-side source of truth** — tier changes from Telegram bot or admin dashboard write to `user-store.ts` which persists to `.data/users.json`; mobile polls `/api/profile/:username` on AppState focus.
- **Tier system**: `"basic" | "pro_blue" | "pro_purple"` — Basic: 30 tx/month, 3 goals; Pro Blue: unlimited + analytics; Pro Purple: everything + CSV export.
- **ESM hoisting fix**: all `process.env` reads are inside functions, never module-level constants.
- **API base URL in mobile**: `process.env["EXPO_PUBLIC_DOMAIN"] ? \`https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api\` : "/api"`.

## Product

- Dashboard: net balance, bento metrics, savings goals preview, recent transactions, analytics (Pro-gated)
- Transactions: full list with 30/month cap for Basic users
- Savings Goals: 3-goal cap for Basic users, unlimited for Pro
- Profile: account settings, Telegram Chat ID, tier badge, admin link (admin-only)
- Admin: manage users, upgrade tiers from in-app dashboard
- Telegram bot: `/upgrade <username> <tier>` and `/list` commands
- Google Sheets: auto-sync transactions

## User preferences

- IDR pricing: Rp 15.000/month (Pro Blue), Rp 35.000/month (Pro Purple)
- Premium dark-mode aesthetic throughout
- Bilingual UI (Indonesian + English mix)

## Gotchas

- Admin tab is hidden via `href: null` in `_layout.tsx` — access via Profile screen admin link
- `EXPO_PUBLIC_ADMIN_USERNAME` env var controls which username sees the admin link (default: "admin")
- Telegram bot aliases: `pro_blue`, `pro_purple`, `blue`, `biru`, `purple`, `ungu`
- Template literal types (`` `${number}%` ``) in JSX break Babel — use `as any` instead

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
