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
  isLoading: boolean;
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

export function AppProvider({ children, userId }: { children: React.ReactNode; userId: string | null }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setGoals([]);
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    (async () => {
      const [tRaw, gRaw, nRaw] = await Promise.all([
        AsyncStorage.getItem(TRANSACTIONS_KEY),
        AsyncStorage.getItem(GOALS_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
      ]);
      const t: Transaction[] = tRaw ? JSON.parse(tRaw) : [];
      const g: SavingsGoal[] = gRaw ? JSON.parse(gRaw) : [];
      const n: Notification[] = nRaw ? JSON.parse(nRaw) : [];

      setTransactions(t.filter((x) => x.userId === userId));
      setGoals(g.filter((x) => x.userId === userId));
      setNotifications(n.filter((x) => x.targetUserId === userId));
      setIsLoading(false);
    })();
  }, [userId]);

  const saveTransactions = async (userUpdated: Transaction[]) => {
    setTransactions(userUpdated);
    const raw = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    const all: Transaction[] = raw ? JSON.parse(raw) : [];
    const others = all.filter((x) => x.userId !== userId);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([...others, ...userUpdated]));
  };

  const saveGoals = async (userUpdated: SavingsGoal[]) => {
    setGoals(userUpdated);
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    const all: SavingsGoal[] = raw ? JSON.parse(raw) : [];
    const others = all.filter((x) => x.userId !== userId);
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify([...others, ...userUpdated]));
  };

  const saveNotifications = async (userUpdated: Notification[]) => {
    setNotifications(userUpdated);
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    const all: Notification[] = raw ? JSON.parse(raw) : [];
    const others = all.filter((x) => x.targetUserId !== userId);
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([...others, ...userUpdated]));
  };

  const addTransaction = useCallback(async (t: Omit<Transaction, "id" | "createdAt">) => {
    const newT: Transaction = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    await saveTransactions([newT, ...transactions]);
  }, [transactions, userId]);

  const deleteTransaction = useCallback(async (id: string) => {
    await saveTransactions(transactions.filter((t) => t.id !== id));
  }, [transactions, userId]);

  const addGoal = useCallback(async (g: Omit<SavingsGoal, "id" | "createdAt">) => {
    const newG: SavingsGoal = { ...g, id: generateId(), createdAt: new Date().toISOString() };
    await saveGoals([...goals, newG]);
  }, [goals, userId]);

  const updateGoal = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    await saveGoals(goals.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  }, [goals, userId]);

  const deleteGoal = useCallback(async (id: string) => {
    await saveGoals(goals.filter((g) => g.id !== id));
  }, [goals, userId]);

  const addNotification = useCallback(async (n: Omit<Notification, "id" | "createdAt">) => {
    const newN: Notification = { ...n, id: generateId(), createdAt: new Date().toISOString() };
    await saveNotifications([newN, ...notifications]);
  }, [notifications, userId]);

  const markNotificationsRead = useCallback(async (uid: string) => {
    await saveNotifications(notifications.map((n) => (n.targetUserId === uid ? { ...n, isRead: true } : n)));
  }, [notifications, userId]);

  const getUnreadCount = useCallback((uid: string) =>
    notifications.filter((n) => n.targetUserId === uid && !n.isRead).length,
    [notifications]
  );

  return (
    <AppContext.Provider value={{
      transactions, goals, notifications, isLoading,
      addTransaction, deleteTransaction,
      addGoal, updateGoal, deleteGoal,
      markNotificationsRead, addNotification, getUnreadCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
