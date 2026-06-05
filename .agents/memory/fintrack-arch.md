---
name: FinTrack architecture
description: Core persistence and tier system decisions for the FinTrack savings app.
---

## Rule
No PostgreSQL. Use AsyncStorage (client) + `.data/users.json` (server) for all persistence.

**Why:** Keeps the stack simple, no DB migrations, no connection pooling needed for a small-user SaaS.

**How to apply:** Tier changes → write to `user-store.ts` (persists to `.data/users.json`). Client data (transactions, goals) → AsyncStorage only. Mobile polls `/api/profile/:username` on AppState focus to detect tier upgrades.

## Tier system
- `"basic"` — 30 tx/month, 3 goals max, no analytics
- `"pro_blue"` — unlimited tx/goals + analytics  
- `"pro_purple"` — everything + CSV export

## Admin access
- Admin tab hidden via `href: null`; visible via Profile screen (admin username only)
- `EXPO_PUBLIC_ADMIN_USERNAME` env var (default: "admin")
- Telegram bot aliases: `pro_blue`, `pro_purple`, `blue`, `biru`, `purple`, `ungu`
