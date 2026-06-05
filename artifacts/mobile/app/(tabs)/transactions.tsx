import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
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
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "income" | "expense";

const BASIC_TX_LIMIT = 30;

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction } = useApp();
  const { user } = useAuth();
  const { format } = useCurrency();
  const [filter, setFilter] = useState<Filter>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const isPro = user?.tier === "pro_blue" || user?.tier === "pro_purple";

  // Count this month's transactions for limit check
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [transactions]);

  const atLimit = !isPro && thisMonthCount >= BASIC_TX_LIMIT;

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }, [transactions]);

  const handleNewTransaction = () => {
    if (atLimit) {
      Alert.alert(
        "🔒 Batas Bulanan Tercapai",
        `Paket Basic dibatasi ${BASIC_TX_LIMIT} transaksi per bulan. Upgrade ke Pro untuk transaksi tak terbatas!`,
        [
          { text: "Nanti saja", style: "cancel" },
          { text: "Upgrade Sekarang", onPress: () => router.push("/upgrade") },
        ],
      );
      return;
    }
    router.push("/add-transaction");
  };

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
                style={[styles.addBtn, { backgroundColor: atLimit ? colors.mutedForeground + "40" : colors.primary }]}
                onPress={handleNewTransaction}
              >
                <Feather name={atLimit ? "lock" : "plus"} size={18} color="white" />
              </TouchableOpacity>
            </View>

            {/* Basic limit banner */}
            {!isPro && (
              <TouchableOpacity
                style={[styles.limitBanner, { backgroundColor: colors.card, borderColor: colors.badgeBlue + "40" }]}
                onPress={() => router.push("/upgrade")}
                activeOpacity={0.8}
              >
                <Feather name="info" size={14} color={colors.badgeBlue} />
                <Text style={[styles.limitBannerText, { color: colors.mutedForeground }]}>
                  Paket Basic: {thisMonthCount}/{BASIC_TX_LIMIT} transaksi bulan ini ·{" "}
                  <Text style={{ color: colors.badgeBlue }}>Upgrade untuk unlimited →</Text>
                </Text>
              </TouchableOpacity>
            )}

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
                  <Text style={[styles.filterText, { color: filter === f ? "white" : colors.mutedForeground }]}>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  limitBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  limitBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  summaryAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  filterRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, marginBottom: 16, gap: 4 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", padding: 48, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", gap: 10, marginTop: 16 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
