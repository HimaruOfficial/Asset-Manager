import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type BadgeTier = "basic" | "pro_blue" | "pro_purple";

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  tier: BadgeTier;
  telegramChatId?: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, displayName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "displayName" | "telegramChatId">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = "@fintrack:users";
const SESSION_KEY = "@fintrack:session";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersRaw, sessionRaw] = await Promise.all([
          AsyncStorage.getItem(USERS_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        const storedUsers: User[] = usersRaw ? JSON.parse(usersRaw) : [];
        setUsers(storedUsers);
        if (sessionRaw) {
          const sessionId = JSON.parse(sessionRaw);
          const found = storedUsers.find((u) => u.id === sessionId);
          if (found) setUser(found);
        }
      } catch {}
      setIsLoading(false);
    })();
  }, []);

  const saveUsers = async (updated: User[]) => {
    setUsers(updated);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  const login = async (username: string, password: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const storedUsers: User[] = raw ? JSON.parse(raw) : [];
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
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(found.id));
    return { success: true };
  };

  const register = async (username: string, displayName: string, email: string, password: string) => {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const storedUsers: User[] = raw ? JSON.parse(raw) : [];
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
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newUser.id));

    // Fire-and-forget: notify backend of new registration (Telegram + Sheets sync)
    try {
      const apiBase = process.env["EXPO_PUBLIC_DOMAIN"]
        ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`
        : "/api";
      fetch(`${apiBase}/notifications/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUser.username,
          displayName: newUser.displayName,
          email: newUser.email,
        }),
      }).catch(() => {/* non-critical */});
    } catch {/* non-critical */}

    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  const updateProfile = async (updates: Partial<Pick<User, "displayName" | "telegramChatId">>) => {
    if (!user) return;
    const updated: User = { ...user, ...updates };
    setUser(updated);
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const storedUsers: User[] = raw ? JSON.parse(raw) : [];
    const newUsers = storedUsers.map((u) => (u.id === updated.id ? updated : u));
    await saveUsers(newUsers);
  };

  return (
    <AuthContext.Provider value={{ user, users, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
