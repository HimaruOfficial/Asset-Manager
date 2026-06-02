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
import { NotificationBell } from "@/components/NotificationBell";
import { TransactionItem } from "@/components/TransactionItem";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { transactions, goals } = useApp();

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

  const recent = transactions.slice(0, 5);

  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: 120 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning,</Text>
            <View style={styles.userRow}>
              <Text style={[styles.displayName, { color: colors.foreground }]}>
                @{user?.username}
              </Text>
              {user && <BadgeIcon tier={user.tier} size={18} />}
            </View>
          </View>
          <NotificationBell />
        </View>

        {/* Net Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Net Balance · {monthName}</Text>
          <Text style={[styles.balanceAmount, { color: stats.net >= 0 ? colors.income : colors.expense }]}>
            {stats.net >= 0 ? "+" : ""}${Math.abs(stats.net).toLocaleString()}
          </Text>
          <View style={styles.glowLine}>
            <View style={[styles.glow, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Bento Grid — Metrics */}
        <View style={styles.bentoGrid}>
          <View style={[styles.bentoCard, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.income + "20" }]}>
              <Feather name="arrow-down-left" size={16} color={colors.income} />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              ${stats.income.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Income</Text>
          </View>

          <View style={[styles.bentoCard, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.expense + "20" }]}>
              <Feather name="arrow-up-right" size={16} color={colors.expense} />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              ${stats.expenses.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Expenses</Text>
          </View>

          <View style={[styles.bentoCard, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.savingsBlue + "20" }]}>
              <Feather name="target" size={16} color={colors.savingsBlue} />
            </View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>
              ${stats.savings.toLocaleString()}
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
                <View key={goal.id} style={[styles.goalRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.goalRowLeft}>
                    <View style={[styles.goalDot, { backgroundColor: goal.color }]} />
                    <View>
                      <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
                      <Text style={[styles.goalAmount, { color: colors.mutedForeground }]}>
                        ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
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
            </View>
          ) : (
            recent.map((t) => <TransactionItem key={t.id} transaction={t} />)
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  balanceCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16, overflow: "hidden" },
  balanceLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  balanceAmount: { fontSize: 38, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  glowLine: { marginTop: 16, height: 1, overflow: "hidden" },
  glow: { height: 1, opacity: 0.3 },
  bentoGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  bentoCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  goalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  goalRowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  goalAmount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  goalBarWrap: { alignItems: "flex-end", gap: 4, minWidth: 80 },
  goalPct: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  goalTrack: { width: 80, height: 4, borderRadius: 2, overflow: "hidden" },
  goalFill: { height: 4, borderRadius: 2 },
  emptyState: { alignItems: "center", padding: 32, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  fab: { position: "absolute", bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
});
