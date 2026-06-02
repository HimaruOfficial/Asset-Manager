import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SavingsGoal } from "@/context/AppContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  goal: SavingsGoal;
  onDelete?: (id: string) => void;
  onAddFunds?: (goal: SavingsGoal) => void;
}

export function GoalCard({ goal, onDelete, onAddFunds }: Props) {
  const colors = useColors();
  const { format } = useCurrency();
  const progress = Math.min(goal.currentAmount / goal.targetAmount, 1);
  const percentage = Math.round(progress * 100);
  const remaining = goal.targetAmount - goal.currentAmount;

  const deadline = goal.deadline
    ? new Date(goal.deadline).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: goal.color }]} />
          <Text style={[styles.name, { color: colors.foreground }]}>{goal.name}</Text>
        </View>
        <View style={styles.actions}>
          {onAddFunds && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAddFunds(goal); }}
              style={[styles.addBtn, { borderColor: goal.color + "40", backgroundColor: goal.color + "15" }]}
            >
              <Feather name="plus" size={14} color={goal.color} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(goal.id); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="trash-2" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.amounts}>
        <Text style={[styles.current, { color: colors.foreground }]}>
          {format(goal.currentAmount)}
        </Text>
        <Text style={[styles.target, { color: colors.mutedForeground }]}>
          of {format(goal.targetAmount)}
        </Text>
      </View>

      <View style={[styles.trackBg, { backgroundColor: colors.border }]}>
        <View style={[styles.trackFill, { width: `${percentage}%` as any, backgroundColor: goal.color }]} />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.percentage, { color: goal.color }]}>{percentage}% saved</Text>
        <View style={styles.footerRight}>
          {deadline && (
            <Text style={[styles.deadline, { color: colors.mutedForeground }]}>
              <Feather name="calendar" size={11} color={colors.mutedForeground} /> {deadline}
            </Text>
          )}
          <Text style={[styles.remaining, { color: colors.mutedForeground }]}>
            {format(remaining)} left
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  addBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  amounts: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  current: { fontSize: 22, fontFamily: "Inter_700Bold" },
  target: { fontSize: 14, fontFamily: "Inter_400Regular" },
  trackBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  trackFill: { height: 6, borderRadius: 3 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  percentage: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  footerRight: { alignItems: "flex-end", gap: 2 },
  deadline: { fontSize: 12, fontFamily: "Inter_400Regular" },
  remaining: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
