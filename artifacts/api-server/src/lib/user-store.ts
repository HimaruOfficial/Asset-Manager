// Server-side user store — in-memory with JSON file persistence.
// Acts as the source-of-truth for tier/badge upgrades so the Telegram bot
// and Admin Dashboard both write here, and the mobile app polls /api/profile/:username
// to pick up changes without requiring a full PostgreSQL setup.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type UserTier = "basic" | "pro_blue" | "pro_purple";

export interface StoredUser {
  username: string;
  displayName: string;
  email: string;
  tier: UserTier;
  badge_type: string;
  registeredAt: string;
  upgradedAt?: string;
  upgradeNotified: boolean;
}

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "users.json");

const store = new Map<string, StoredUser>();

function load(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, "utf-8");
      const arr = JSON.parse(raw) as StoredUser[];
      for (const u of arr) store.set(u.username.toLowerCase(), u);
    }
  } catch (err) {
    console.error("[UserStore] Failed to load:", err);
  }
}

function persist(): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify([...store.values()], null, 2), "utf-8");
  } catch (err) {
    console.error("[UserStore] Failed to save:", err);
  }
}

// Load on module init
load();

export function registerUser(username: string, displayName: string, email: string): void {
  const key = username.toLowerCase();
  if (!store.has(key)) {
    store.set(key, {
      username: key,
      displayName,
      email,
      tier: "basic",
      badge_type: "New Member",
      registeredAt: new Date().toISOString(),
      upgradeNotified: true,
    });
    persist();
  }
}

export function upgradeUser(username: string, tier: UserTier, badge_type: string): void {
  const key = username.toLowerCase();
  const existing = store.get(key);
  store.set(key, {
    username: key,
    displayName: existing?.displayName ?? username,
    email: existing?.email ?? "",
    tier,
    badge_type,
    registeredAt: existing?.registeredAt ?? new Date().toISOString(),
    upgradedAt: new Date().toISOString(),
    upgradeNotified: false, // mobile polls this; flip to true after they see it
  });
  persist();
}

export function getUser(username: string): StoredUser | undefined {
  return store.get(username.toLowerCase());
}

export function getAllUsers(): StoredUser[] {
  return [...store.values()].sort((a, b) => a.username.localeCompare(b.username));
}

export function markNotified(username: string): void {
  const key = username.toLowerCase();
  const u = store.get(key);
  if (u) {
    store.set(key, { ...u, upgradeNotified: true });
    persist();
  }
}
