import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeIcon } from "@/components/BadgeIcon";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { TransactionItem } from "@/components/TransactionItem";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { transactions, goals } = useApp();
  const { format } = useCurrency();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const net = income - expenses;
    const savings = goals.reduce((s, g) => s + g.currentAmount, 0);
    return { income, expenses, net, savings };
  }, [transactions, goals]);

  const isPro = user?.tier === "pro_blue" || user?.tier === "pro_purple";

  // Category breakdown for Pro analytics
  const categoryBreakdown = useMemo(() => {
    if (!isPro) return [];
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === "expense") map[t.category] = (map[t.category] ?? 0) + t.amount;
    }
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? Math.round((amt / total) * 100) : 0 }));
  }, [transactions, isPro]);

  const recent = transactions.slice(0, 5);
  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const netIsPositive = stats.net >= 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: 120 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning,</Text>
            <View style={styles.userRow}>
              <Text style={[styles.displayName, { color: colors.foreground }]}>
                @{user?.username}
              </Text>
              {user && <BadgeIcon tier={user.tier} badgeType={user.badge_type} size={18} />}
            </View>
          </View>
          <View style={styles.headerRight}>
            <CurrencySwitcher />
            <NotificationBell />
          </View>
        </View>

        {/* Net Balance Card */}
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: (netIsPositive ? colors.income : colors.expense) + "12",
              borderColor: (netIsPositive ? colors.income : colors.expense) + "30",
            },
          ]}
        >
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>
            Net Balance · {monthName}
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: netIsPositive ? colors.income : colors.expense },
            ]}
          >
            {netIsPositive ? "+" : "-"}{format(Math.abs(stats.net))}
          </Text>
          {transactions.length === 0 && (
            <View style={[styles.emptyHint, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Feather name="info" size={13} color={colors.primary} />
              <Text style={[styles.emptyHintText, { color: colors.mutedForeground }]}>
                Tap + to log your first transaction
              </Text>
            </View>
          )}
        </View>

        {/* Bento Grid — Metrics */}
        <View style={styles.bentoGrid}>
          <View style={[styles.bentoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.income + "20" }]}>
              <Feather name="arrow-down-left" size={16} color={colors.income} />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
              {format(stats.income)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Income</Text>
          </View>

          <View style={[styles.bentoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.expense + "20" }]}>
              <Feather name="arrow-up-right" size={16} color={colors.expense} />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
              {format(stats.expenses)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Expenses</Text>
          </View>

          <View style={[styles.bentoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.savingsBlue + "20" }]}>
              <Feather name="target" size={16} color={colors.savingsBlue} />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
              {format(stats.savings)}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Saved</Text>
          </View>
        </View>

        {/* Savings Goals Preview */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Savings Goals</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/goals")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {goals.slice(0, 2).map((goal) => {
              const pct = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
              return (
                <View
                  key={goal.id}
                  style={[styles.goalRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.goalRowLeft}>
                    <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
                      <Text style={[styles.goalAmount, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {format(goal.currentAmount)} / {format(goal.targetAmount)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.goalBarWrap}>
                    <Text style={[styles.goalPct, { color: goal.color }]}>{pct}%</Text>
                    <View style={[styles.goalTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.goalFill, { width: `${pct}%` as any, backgroundColor: goal.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/transactions")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions yet</Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/add-transaction")}
              >
                <Feather name="plus" size={14} color="white" />
                <Text style={styles.emptyBtnText}>Add First Transaction</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recent.map((t) => <TransactionItem key={t.id} transaction={t} />)
          )}
        </View>

        {/* Analytics Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Analytics</Text>
            {isPro && (
              <View style={[styles.proBadge, { backgroundColor: colors.badgeBlue + "20", borderColor: colors.badgeBlue + "40" }]}>
                <Text style={[styles.proBadgeText, { color: colors.badgeBlue }]}>Pro</Text>
              </View>
            )}
          </View>

          {isPro ? (
            <View style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.analyticsSubLabel, { color: colors.mutedForeground }]}>Top Expense Categories</Text>
              {categoryBreakdown.length === 0 ? (
                <Text style={[styles.analyticsEmpty, { color: colors.mutedForeground }]}>No expense data yet</Text>
              ) : (
                categoryBreakdown.map(({ cat, amt, pct }) => (
                  <View key={cat} style={styles.catRow}>
                    <View style={styles.catLabelRow}>
                      <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                      <Text style={[styles.catAmt, { color: colors.mutedForeground }]}>{pct}%</Text>
                    </View>
                    <View style={[styles.catTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.catFill, { width: `${pct}%` as any, backgroundColor: colors.expense }]} />
                    </View>
                    <Text style={[styles.catValue, { color: colors.expense }]}>{format(amt)}</Text>
                  </View>
                ))
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.lockedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/upgrade")}
              activeOpacity={0.8}
            >
              <View style={[styles.lockIcon, { backgroundColor: colors.badgeBlue + "20" }]}>
                <Feather name="lock" size={22} color={colors.badgeBlue} />
              </View>
              <Text style={[styles.lockedTitle, { color: colors.foreground }]}>Analytics & Charts</Text>
              <Text style={[styles.lockedSub, { color: colors.mutedForeground }]}>
                Lihat breakdown pengeluaran, grafik bulanan, dan insight keuangan mendalam.
              </Text>
              <View style={[styles.unlockBtn, { backgroundColor: colors.badgeBlue + "20", borderColor: colors.badgeBlue + "40" }]}>
                <Feather name="star" size={13} color={colors.badgeBlue} />
                <Text style={[styles.unlockBtnText, { color: colors.badgeBlue }]}>Upgrade ke Pro untuk membuka →</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/add-transaction")}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  balanceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    gap: 8,
  },
  balanceLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  balanceAmount: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyHintText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bentoGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  bentoCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  goalRowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  goalAmount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  goalBarWrap: { alignItems: "flex-end", gap: 4, minWidth: 70 },
  goalPct: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  goalTrack: { width: 70, height: 4, borderRadius: 2, overflow: "hidden" },
  goalFill: { height: 4, borderRadius: 2 },
  emptyState: {
    alignItems: "center",
    padding: 36,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: "white", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  proBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  proBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  analyticsCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  analyticsSubLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  analyticsEmpty: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 8 },
  catRow: { gap: 4 },
  catLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  catName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  catAmt: { fontSize: 12, fontFamily: "Inter_400Regular" },
  catTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  catFill: { height: 5, borderRadius: 3 },
  catValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  lockedCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  lockIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  lockedTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  lockedSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  unlockBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  unlockBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
