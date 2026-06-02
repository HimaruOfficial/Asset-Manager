import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type TransactionType = "income" | "expense";
export type TransactionCategory =
  | "salary" | "freelance" | "investment" | "gift" | "other_income"
  | "food" | "transport" | "housing" | "health" | "entertainment"
  | "shopping" | "education" | "utilities" | "other_expense";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  targetUserId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AppContextValue {
  transactions: Transaction[];
  goals: SavingsGoal[];
  notifications: Notification[];
  addTransaction: (t: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (g: Omit<SavingsGoal, "id" | "createdAt">) => Promise<void>;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  markNotificationsRead: (userId: string) => Promise<void>;
  addNotification: (n: Omit<Notification, "id" | "createdAt">) => Promise<void>;
  getUnreadCount: (userId: string) => number;
}

const AppContext = createContext<AppContextValue | null>(null);

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const TRANSACTIONS_KEY = "@fintrack:transactions";
const GOALS_KEY = "@fintrack:goals";
const NOTIFICATIONS_KEY = "@fintrack:notifications";

function seedData(userId: string): { transactions: Transaction[]; goals: SavingsGoal[]; notifications: Notification[] } {
  const now = new Date();
  const transactions: Transaction[] = [
    { id: generateId(), userId, type: "income", category: "salary", amount: 5500, description: "Monthly Salary", date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), createdAt: new Date().toISOString() },
    { id: generateId(), userId, type: "income", category: "freelance", amount: 850, description: "Design Project", date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(), createdAt: new Date().toISOString() },
    { id: generateId(), userId, type: "expense", category: "housing", amount: 1400, description: "Rent", date: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(), createdAt: new Date().toISOString() },
    { id: generateId(), userId, type: "expense", category: "food", amount: 280, description: "Groceries & Dining", date: new Date(now.getFullYear(), now.getMonth(), 8).toISOString(), createdAt: new Date().toISOString() },
    { id: generateId(), userId, type: "expense", category: "transport", amount: 120, description: "Fuel & Transit", date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(), createdAt: new Date().toISOString() },
    { id: generateId(), userId, type: "expense", category: "entertainment", amount: 65, description: "Netflix & Spotify", date: new Date(now.getFullYear(), now.getMonth(), 12).toISOString(), createdAt: new Date().toISOString() },
    { id: generateId(), userId, type: "income", category: "investment", amount: 320, description: "Dividend Income", date: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(), createdAt: new Date().toISOString() },
    { id: generateId(), userId, type: "expense", category: "shopping", amount: 210, description: "Clothing & Accessories", date: new Date(now.getFullYear(), now.getMonth(), 18).toISOString(), createdAt: new Date().toISOString() },
  ];
  const goals: SavingsGoal[] = [
    { id: generateId(), userId, name: "Emergency Fund", targetAmount: 10000, currentAmount: 6200, deadline: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString(), color: "#10B981", createdAt: new Date().toISOString() },
    { id: generateId(), userId, name: "Vacation — Tokyo", targetAmount: 3500, currentAmount: 1200, deadline: new Date(now.getFullYear() + 1, 2, 1).toISOString(), color: "#3B82F6", createdAt: new Date().toISOString() },
    { id: generateId(), userId, name: "New MacBook Pro", targetAmount: 2800, currentAmount: 2100, color: "#8B5CF6", createdAt: new Date().toISOString() },
  ];
  const notifications: Notification[] = [
    { id: generateId(), targetUserId: userId, message: "Welcome to FinTrack! Start logging your transactions.", isRead: false, createdAt: new Date().toISOString() },
    { id: generateId(), targetUserId: userId, message: "Your Emergency Fund is 62% complete. Keep going!", isRead: false, createdAt: new Date().toISOString() },
  ];
  return { transactions, goals, notifications };
}

export function AppProvider({ children, userId }: { children: React.ReactNode; userId: string | null }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setGoals([]);
      setNotifications([]);
      return;
    }
    (async () => {
      const [tRaw, gRaw, nRaw] = await Promise.all([
        AsyncStorage.getItem(TRANSACTIONS_KEY),
        AsyncStorage.getItem(GOALS_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
      ]);
      let t: Transaction[] = tRaw ? JSON.parse(tRaw) : [];
      let g: SavingsGoal[] = gRaw ? JSON.parse(gRaw) : [];
      let n: Notification[] = nRaw ? JSON.parse(nRaw) : [];
      const userT = t.filter((x) => x.userId === userId);
      const userG = g.filter((x) => x.userId === userId);
      const userN = n.filter((x) => x.targetUserId === userId);
      if (userT.length === 0 && userG.length === 0) {
        const seed = seedData(userId);
        t = [...t, ...seed.transactions];
        g = [...g, ...seed.goals];
        n = [...n, ...seed.notifications];
        await Promise.all([
          AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(t)),
          AsyncStorage.setItem(GOALS_KEY, JSON.stringify(g)),
          AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(n)),
        ]);
        setTransactions(seed.transactions);
        setGoals(seed.goals);
        setNotifications(seed.notifications);
      } else {
        setTransactions(userT);
        setGoals(userG);
        setNotifications(userN);
      }
    })();
  }, [userId]);

  const saveTransactions = async (updated: Transaction[]) => {
    setTransactions(updated.filter((x) => x.userId === userId));
    const raw = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    const all: Transaction[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((x) => x.userId !== userId);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([...filtered, ...updated.filter((x) => x.userId === userId)]));
  };

  const saveGoals = async (updated: SavingsGoal[]) => {
    setGoals(updated.filter((x) => x.userId === userId));
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    const all: SavingsGoal[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((x) => x.userId !== userId);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify([...filtered, ...updated.filter((x) => x.userId === userId)]));
  };

  const saveNotifications = async (updated: Notification[]) => {
    setNotifications(updated.filter((x) => x.targetUserId === userId));
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const all: Notification[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter((x) => x.targetUserId !== userId);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([...filtered, ...updated.filter((x) => x.targetUserId === userId)]));
  };

  const addTransaction = useCallback(async (t: Omit<Transaction, "id" | "createdAt">) => {
    const newT: Transaction = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [newT, ...transactions];
    await saveTransactions(updated);
  }, [transactions, userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    await saveTransactions(updated);
  }, [transactions, userId]);

  const addGoal = useCallback(async (g: Omit<SavingsGoal, "id" | "createdAt">) => {
    const newG: SavingsGoal = { ...g, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [...goals, newG];
    await saveGoals(updated);
  }, [goals, userId]);

  const updateGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    await saveGoals(updated);
  }, [goals, userId]);

  const deleteGoal = useCallback(async (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    await saveGoals(updated);
  }, [goals, userId]);

  const addNotification = useCallback(async (n: Omit<Notification, "id" | "createdAt">) => {
    const newN: Notification = { ...n, id: generateId(), createdAt: new Date().toISOString() };
    const updated = [newN, ...notifications];
    await saveNotifications(updated);
  }, [notifications, userId]);

  const markNotificationsRead = useCallback(async (uid: string) => {
    const updated = notifications.map((n) => n.targetUserId === uid ? { ...n, isRead: true } : n);
    await saveNotifications(updated);
  }, [notifications, userId]);

  const getUnreadCount = useCallback((uid: string) => {
    return notifications.filter((n) => n.targetUserId === uid && !n.isRead).length;
  }, [notifications]);

  return (
    <AppContext.Provider value={{ transactions, goals, notifications, addTransaction, deleteTransaction, addGoal, updateGoal, deleteGoal, markNotificationsRead, addNotification, getUnreadCount }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
