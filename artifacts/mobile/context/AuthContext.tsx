import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

export type BadgeTier = "basic" | "pro_blue" | "pro_purple";

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  tier: BadgeTier;
  badge_type?: string;
  telegramChatId?: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  users: User[];
  isLoading: boolean;
  pendingUpgradeNotice: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, displayName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "displayName" | "telegramChatId">>) => Promise<void>;
  upgradeUser: (username: string, tier: BadgeTier, badge_type: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearUpgradeNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "@fintrack:users";
const SESSION_KEY = "@fintrack:session";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getApiBase(): string {
  return process.env["EXPO_PUBLIC_DOMAIN"]
    ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`
    : "/api";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUpgradeNotice, setPendingUpgradeNotice] = useState<string | null>(null);
  const lastKnownTierRef = useRef<BadgeTier | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [usersRaw, sessionRaw] = await Promise.all([
          AsyncStorage.getItem(USERS_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        const storedUsers: User[] = usersRaw ? (JSON.parse(usersRaw) as User[]) : [];
        const migrated = storedUsers.map((u) => ({ ...u, telegramChatId: u.telegramChatId ?? undefined }));
        await saveUsers(migrated);
        if (sessionRaw) {
          const sessionId = JSON.parse(sessionRaw) as string;
          const found = migrated.find((u) => u.id === sessionId);
          if (found) {
            setUser(found);
            lastKnownTierRef.current = found.tier;
          }
        }
      } catch (e) {
        console.error("Gagal memuat data user:", e);
      }
      setIsLoading(false);
    })();
  }, []);

  // Poll server for tier upgrades whenever app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (next: AppStateStatus) => {
      if (next === "active") {
        refreshProfile().catch(() => {/* non-critical */});
      }
    };
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveUsers = async (updated: User[]) => {
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  const refreshProfile = useCallback(async () => {
    const currentUser = user;
    if (!currentUser) return;
    try {
      const res = await fetch(`${getApiBase()}/profile/${currentUser.username}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        success: boolean;
        found: boolean;
        tier: BadgeTier;
        badge_type: string;
        upgradeNotified: boolean;
        upgradedAt?: string;
      };
      if (!data.success || !data.found) return;

      const serverTier = data.tier;
      const prev = lastKnownTierRef.current;

      // Tier was upgraded on the server and not yet acknowledged
      if (serverTier !== prev && !data.upgradeNotified) {
        const badgeLabel =
          serverTier === "pro_purple" ? "Pro Purple ✦" :
          serverTier === "pro_blue" ? "Pro Blue ✓" : "Basic";

        setPendingUpgradeNotice(
          `🎉 Selamat! Akun kamu telah diupgrade ke ${badgeLabel}! Badge baru kamu sudah aktif.`,
        );

        // Update local user record
        const updatedUser: User = { ...currentUser, tier: serverTier, badge_type: data.badge_type };
        setUser(updatedUser);
        lastKnownTierRef.current = serverTier;

        const raw = await AsyncStorage.getItem(USERS_KEY);
        const stored: User[] = raw ? (JSON.parse(raw) as User[]) : [];
        await saveUsers(stored.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

        // Acknowledge to server
        fetch(`${getApiBase()}/profile/${currentUser.username}/ack`, { method: "POST" }).catch(() => {/* non-critical */});
      } else if (serverTier !== currentUser.tier) {
        // Silently sync tier even without notification
        const updatedUser: User = { ...currentUser, tier: serverTier, badge_type: data.badge_type };
        setUser(updatedUser);
        lastKnownTierRef.current = serverTier;
        const raw = await AsyncStorage.getItem(USERS_KEY);
        const stored: User[] = raw ? (JSON.parse(raw) as User[]) : [];
        await saveUsers(stored.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      }
    } catch {/* non-critical */}
  }, [user]);

  const login = async (username: string, password: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const storedUsers: User[] = raw ? (JSON.parse(raw) as User[]) : [];
    const pwKey = `@fintrack:pw:${username.toLowerCase()}`;
    const storedPw = await AsyncStorage.getItem(pwKey);
    if (!storedPw || storedPw !== password) {
      const found = storedUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!found) return { success: false, error: "Username not found" };
      return { success: false, error: "Incorrect password" };
    }
    const found = storedUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!found) return { success: false, error: "User not found" };
    setUser(found);
    setUsers(storedUsers);
    lastKnownTierRef.current = found.tier;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(found.id));
    // Immediately check server for any pending upgrades
    setTimeout(() => refreshProfile().catch(() => {}), 500);
    return { success: true };
  };

  const register = async (username: string, displayName: string, email: string, password: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const storedUsers: User[] = raw ? (JSON.parse(raw) as User[]) : [];
    const exists = storedUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (exists) return { success: false, error: "Username already taken" };
    const newUser: User = {
      id: generateId(),
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      displayName,
      email,
      tier: "basic",
      createdAt: new Date().toISOString(),
    };
    const updated = [...storedUsers, newUser];
    await saveUsers(updated);
    await AsyncStorage.setItem(`@fintrack:pw:${newUser.username}`, password);
    setUser(newUser);
    lastKnownTierRef.current = "basic";
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newUser.id));

    // Register on server so admin dashboard shows this user
    fetch(`${getApiBase()}/notifications/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUser.username, displayName: newUser.displayName, email: newUser.email }),
    }).catch(() => {/* non-critical */});

    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    lastKnownTierRef.current = null;
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  const updateProfile = async (updates: Partial<Pick<User, "displayName" | "telegramChatId">>) => {
    if (!user) return;
    const updated: User = { ...user, ...updates };
    setUser(updated);
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const storedUsers: User[] = raw ? (JSON.parse(raw) as User[]) : [];
    await saveUsers(storedUsers.map((u) => (u.id === updated.id ? updated : u)));
  };

  const upgradeUser = async (username: string, tier: BadgeTier, badge_type: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const storedUsers: User[] = raw ? (JSON.parse(raw) as User[]) : [];
    const updated = storedUsers.map((u) =>
      u.username.toLowerCase() === username.toLowerCase() ? { ...u, tier, badge_type } : u,
    );
    await saveUsers(updated);
    if (user?.username.toLowerCase() === username.toLowerCase()) {
      const next = { ...user, tier, badge_type };
      setUser(next);
      lastKnownTierRef.current = tier;
    }
  };

  const clearUpgradeNotice = () => setPendingUpgradeNotice(null);

  return (
    <AuthContext.Provider value={{
      user, users, isLoading, pendingUpgradeNotice,
      login, register, logout, updateProfile,
      upgradeUser, refreshProfile, clearUpgradeNotice,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
