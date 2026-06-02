import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TransactionCategory, TransactionType, useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";

const INCOME_CATEGORIES: { value: TransactionCategory; label: string; icon: string }[] = [
  { value: "salary", label: "Salary", icon: "briefcase" },
  { value: "freelance", label: "Freelance", icon: "code" },
  { value: "investment", label: "Investment", icon: "trending-up" },
  { value: "gift", label: "Gift", icon: "gift" },
  { value: "other_income", label: "Other", icon: "plus-circle" },
];

const EXPENSE_CATEGORIES: { value: TransactionCategory; label: string; icon: string }[] = [
  { value: "food", label: "Food", icon: "coffee" },
  { value: "transport", label: "Transport", icon: "navigation" },
  { value: "housing", label: "Housing", icon: "home" },
  { value: "health", label: "Health", icon: "heart" },
  { value: "entertainment", label: "Fun", icon: "play" },
  { value: "shopping", label: "Shopping", icon: "shopping-bag" },
  { value: "education", label: "Education", icon: "book" },
  { value: "utilities", label: "Utilities", icon: "zap" },
  { value: "other_expense", label: "Other", icon: "minus-circle" },
];

const CATEGORY_LABELS: Record<string, string> = {
  salary: "Salary", freelance: "Freelance", investment: "Investment", gift: "Gift",
  other_income: "Other Income", food: "Food & Dining", transport: "Transport",
  housing: "Housing", health: "Health", entertainment: "Entertainment",
  shopping: "Shopping", education: "Education", utilities: "Utilities", other_expense: "Other",
};

export default function AddTransactionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addTransaction } = useApp();
  const { inputPrefix, currency, format } = useCurrency();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("other_expense");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const activeColor = type === "income" ? colors.income : colors.expense;

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    setCategory(t === "income" ? "salary" : "other_expense");
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }
    if (!description.trim()) { setError("Add a description"); return; }
    if (!user) return;
    setLoading(true);
    setError("");

    await addTransaction({
      userId: user.id,
      type,
      category,
      amount: amt,
      description: description.trim(),
      date: new Date().toISOString(),
    });

    // Fire-and-forget: Telegram notification via API server
    try {
      const apiBase = process.env["EXPO_PUBLIC_DOMAIN"]
        ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`
        : "/api";
      await fetch(`${apiBase}/notifications/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          telegramChatId: user.telegramChatId,
          type,
          amount: amt,
          currency,
          description: description.trim(),
          category: CATEGORY_LABELS[category] ?? category,
          formattedAmount: format(amt),
        }),
      });
    } catch {
      // Non-critical — never block the user
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: botPad + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>New Transaction</Text>
          <View style={[styles.currencyBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.currencyBadgeText, { color: colors.mutedForeground }]}>{currency}</Text>
          </View>
        </View>

        {/* Type Toggle */}
        <View style={[styles.typeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.typeTab, type === "expense" && { backgroundColor: colors.expense }]}
            onPress={() => handleTypeChange("expense")}
          >
            <Feather name="arrow-up-right" size={15} color={type === "expense" ? "white" : colors.mutedForeground} />
            <Text style={[styles.typeTabText, { color: type === "expense" ? "white" : colors.mutedForeground }]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, type === "income" && { backgroundColor: colors.income }]}
            onPress={() => handleTypeChange("income")}
          >
            <Feather name="arrow-down-left" size={15} color={type === "income" ? "white" : colors.mutedForeground} />
            <Text style={[styles.typeTabText, { color: type === "income" ? "white" : colors.mutedForeground }]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={[styles.amountBox, { backgroundColor: activeColor + "10", borderColor: activeColor + "30" }]}>
          <Text style={[styles.currencySign, { color: activeColor }]}>{inputPrefix}</Text>
          <TextInput
            style={[styles.amountInput, { color: activeColor }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={activeColor + "60"}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat.value ? activeColor : colors.card,
                    borderColor: category === cat.value ? activeColor : colors.border,
                  },
                ]}
                onPress={() => { Haptics.selectionAsync(); setCategory(cat.value); }}
              >
                <Feather
                  name={cat.icon as any}
                  size={13}
                  color={category === cat.value ? "white" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: category === cat.value ? "white" : colors.mutedForeground },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.expense + "15", borderColor: colors.expense + "40" }]}>
            <Feather name="alert-circle" size={14} color={colors.expense} />
            <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: activeColor, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitText}>Save Transaction</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  currencyBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  currencyBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 20,
  },
  typeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeTabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 4,
  },
  currencySign: { fontSize: 26, fontFamily: "Inter_700Bold" },
  amountInput: { flex: 1, fontSize: 42, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  field: { marginBottom: 20, gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 52, justifyContent: "center" },
  textInput: { fontSize: 15, fontFamily: "Inter_400Regular" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  submitBtn: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  submitText: { color: "white", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
