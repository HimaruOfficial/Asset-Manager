import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TransactionItem } from "@/components/TransactionItem";
import { useApp } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "income" | "expense";

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction } = useApp();
  const { format } = useCurrency();
  const [filter, setFilter] = useState<Filter>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }, [transactions]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: topPad + 16, paddingBottom: 120 }]}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>Transactions</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/add-transaction")}
              >
                <Feather name="plus" size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* Summary row */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: colors.income + "15", borderColor: colors.income + "30" }]}>
                <Feather name="arrow-down-left" size={14} color={colors.income} />
                <Text style={[styles.summaryAmount, { color: colors.income }]} numberOfLines={1} adjustsFontSizeToFit>
                  {format(totals.income)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Income</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.expense + "15", borderColor: colors.expense + "30" }]}>
                <Feather name="arrow-up-right" size={14} color={colors.expense} />
                <Text style={[styles.summaryAmount, { color: colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
                  {format(totals.expense)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Expenses</Text>
              </View>
            </View>

            {/* Filter tabs */}
            <View style={[styles.filterRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(["all", "income", "expense"] as Filter[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterTab,
                    filter === f && {
                      backgroundColor:
                        f === "income" ? colors.income : f === "expense" ? colors.expense : colors.primary,
                    },
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: filter === f ? "white" : colors.mutedForeground },
                    ]}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filtered.length === 0 && (
              <View style={[styles.empty, { borderColor: colors.border }]}>
                <Feather name="inbox" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No transactions</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {filter === "all" ? "Tap + to log your first one" : `No ${filter} transactions yet`}
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TransactionItem transaction={item} onDelete={deleteTransaction} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  summaryAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  filterRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: {
    alignItems: "center",
    padding: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 10,
    marginTop: 16,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
