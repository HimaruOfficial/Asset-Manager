import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Transaction } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_ICONS: Record<string, string> = {
  salary: "briefcase",
  freelance: "code",
  investment: "trending-up",
  gift: "gift",
  other_income: "plus-circle",
  food: "coffee",
  transport: "navigation",
  housing: "home",
  health: "heart",
  entertainment: "play",
  shopping: "shopping-bag",
  education: "book",
  utilities: "zap",
  other_expense: "minus-circle",
};

const CATEGORY_LABELS: Record<string, string> = {
  salary: "Salary",
  freelance: "Freelance",
  investment: "Investment",
  gift: "Gift",
  other_income: "Other Income",
  food: "Food & Dining",
  transport: "Transport",
  housing: "Housing",
  health: "Health",
  entertainment: "Entertainment",
  shopping: "Shopping",
  education: "Education",
  utilities: "Utilities",
  other_expense: "Other",
};

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export function TransactionItem({ transaction, onDelete }: Props) {
  const colors = useColors();
  const isIncome = transaction.type === "income";
  const iconName = CATEGORY_ICONS[transaction.category] ?? "circle";
  const iconColor = isIncome ? colors.income : colors.expense;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.(transaction.id);
  };

  const date = new Date(transaction.date);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor + "20" }]}>
        <Feather name={iconName as any} size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>
          {CATEGORY_LABELS[transaction.category]} · {dateStr}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: iconColor }]}>
          {isIncome ? "+" : "-"}${transaction.amount.toLocaleString()}
        </Text>
        {onDelete && (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  category: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
