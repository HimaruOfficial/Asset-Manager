import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type Currency = "USD" | "IDR";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amount: number) => string;
  formatCompact: (amount: number) => string;
  symbol: string;
  inputPrefix: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const CURRENCY_KEY = "@fintrack:currency";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatIDR(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `Rp ${formatted}`;
}

function formatUSDCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

function formatIDRCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}Jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}Rb`;
  return `Rp ${amount.toFixed(0)}`;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    AsyncStorage.getItem(CURRENCY_KEY).then((v) => {
      if (v === "IDR" || v === "USD") setCurrencyState(v);
    });
  }, []);

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    await AsyncStorage.setItem(CURRENCY_KEY, c);
  };

  const format = (amount: number) =>
    currency === "IDR" ? formatIDR(amount) : formatUSD(amount);

  const formatCompact = (amount: number) =>
    currency === "IDR" ? formatIDRCompact(amount) : formatUSDCompact(amount);

  const symbol = currency === "IDR" ? "Rp" : "$";
  const inputPrefix = currency === "IDR" ? "Rp" : "$";

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, formatCompact, symbol, inputPrefix }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
