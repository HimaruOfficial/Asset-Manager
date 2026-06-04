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
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";

const GOAL_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B",
  "#EF4444", "#EC4899", "#14B8A6", "#F97316",
];

export default function AddGoalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addGoal } = useApp();
  const { inputPrefix, currency, format } = useCurrency();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDay, setDeadlineDay] = useState("");
  const [deadlineMonth, setDeadlineMonth] = useState("");
  const [deadlineYear, setDeadlineYear] = useState(String(new Date().getFullYear() + 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formattedDeadline = (): string => {
    if (!hasDeadline) return "";
    const d = deadlineDay.padStart(2, "0");
    const m = deadlineMonth.padStart(2, "0");
    const y = deadlineYear || String(new Date().getFullYear() + 1);
    return `${y}-${m}-${d}`;
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Goal name is required"); return; }
    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) { setError("Enter a valid target amount"); return; }
    const current = parseFloat(currentAmount) || 0;
    if (current > target) { setError("Current amount can't exceed target"); return; }
    if (hasDeadline) {
      const d = parseInt(deadlineDay), m = parseInt(deadlineMonth), y = parseInt(deadlineYear);
      if (!deadlineDay || !deadlineMonth || !deadlineYear || isNaN(d) || isNaN(m) || isNaN(y)
          || d < 1 || d > 31 || m < 1 || m > 12 || y < new Date().getFullYear()) {
        setError("Enter a valid deadline date (DD / MM / YYYY)");
        return;
      }
    }
    if (!user) return;
    setLoading(true);
    setError("");
    const deadline = formattedDeadline();
    await addGoal({ userId: user.id, name: name.trim(), targetAmount: target, currentAmount: current, color, deadline: deadline || undefined });

    // Fire-and-forget: sync to Google Sheets savings_goals sheet
    try {
      const apiBase = process.env["EXPO_PUBLIC_DOMAIN"]
        ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`
        : "/api";
      fetch(`${apiBase}/sync/goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          goal_name: name.trim(),
          target_amount: target,
          current_amount: current,
          deadline,
        }),
      }).catch(() => {/* non-critical */});
    } catch {/* non-critical */}

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const pct =
    targetAmount && currentAmount
      ? Math.min(Math.round((parseFloat(currentAmount) / parseFloat(targetAmount)) * 100), 100)
      : 0;

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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>New Savings Goal</Text>
          <View style={[styles.currencyBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.currencyBadgeText, { color: colors.mutedForeground }]}>{currency}</Text>
          </View>
        </View>

        {/* Live preview card */}
        <View style={[styles.previewCard, { backgroundColor: color + "15", borderColor: color + "30" }]}>
          <View style={styles.previewTop}>
            <View style={[styles.previewDot, { backgroundColor: color }]} />
            <Text style={[styles.previewName, { color: colors.foreground }]}>{name || "Goal Name"}</Text>
          </View>
          <Text style={[styles.previewAmount, { color: colors.foreground }]}>
            {inputPrefix} {currentAmount || "0"}{" "}
            <Text style={[styles.previewOf, { color: colors.mutedForeground }]}>
              of {inputPrefix} {targetAmount || "0"}
            </Text>
          </Text>
          <View style={[styles.previewTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.previewFill, { width: `${pct}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[styles.previewPct, { color: color }]}>{pct}% saved</Text>
        </View>

        {/* Goal Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Goal Name</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Emergency Fund, Vacation..."
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        {/* Target Amount */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Target Amount ({inputPrefix})
          </Text>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder={currency === "IDR" ? "10000000" : "10000"}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Current Amount */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            Already Saved ({inputPrefix})
          </Text>
          <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              value={currentAmount}
              onChangeText={setCurrentAmount}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Deadline */}
        <View style={styles.field}>
          <View style={styles.deadlineHeader}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Deadline (Optional)</Text>
            <TouchableOpacity
              style={[
                styles.deadlineToggle,
                { backgroundColor: hasDeadline ? colors.primary + "20" : colors.card, borderColor: hasDeadline ? colors.primary + "50" : colors.border },
              ]}
              onPress={() => { Haptics.selectionAsync(); setHasDeadline(!hasDeadline); }}
              activeOpacity={0.7}
            >
              <Feather name={hasDeadline ? "calendar" : "plus"} size={13} color={hasDeadline ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.deadlineToggleText, { color: hasDeadline ? colors.primary : colors.mutedForeground }]}>
                {hasDeadline ? "Remove" : "Set date"}
              </Text>
            </TouchableOpacity>
          </View>
          {hasDeadline && (
            <View style={[styles.dateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.dateSegment}>
                <Text style={[styles.dateSegmentLabel, { color: colors.mutedForeground }]}>DD</Text>
                <TextInput
                  style={[styles.dateSegmentInput, { color: colors.foreground }]}
                  value={deadlineDay}
                  onChangeText={(v) => setDeadlineDay(v.replace(/\D/g, "").slice(0, 2))}
                  placeholder="01"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={[styles.dateSep, { backgroundColor: colors.border }]} />
              <View style={styles.dateSegment}>
                <Text style={[styles.dateSegmentLabel, { color: colors.mutedForeground }]}>MM</Text>
                <TextInput
                  style={[styles.dateSegmentInput, { color: colors.foreground }]}
                  value={deadlineMonth}
                  onChangeText={(v) => setDeadlineMonth(v.replace(/\D/g, "").slice(0, 2))}
                  placeholder="12"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={[styles.dateSep, { backgroundColor: colors.border }]} />
              <View style={[styles.dateSegment, { flex: 2 }]}>
                <Text style={[styles.dateSegmentLabel, { color: colors.mutedForeground }]}>YYYY</Text>
                <TextInput
                  style={[styles.dateSegmentInput, { color: colors.foreground }]}
                  value={deadlineYear}
                  onChangeText={(v) => setDeadlineYear(v.replace(/\D/g, "").slice(0, 4))}
                  placeholder="2026"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <Feather name="calendar" size={16} color={colors.primary} style={{ marginLeft: 6 }} />
            </View>
          )}
        </View>

        {/* Color picker */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Color</Text>
          <View style={styles.colorRow}>
            {GOAL_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                onPress={() => { Haptics.selectionAsync(); setColor(c); }}
              >
                {color === c && <Feather name="check" size={12} color="white" />}
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
          style={[styles.submitBtn, { backgroundColor: color, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitText}>Create Goal</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  currencyBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  currencyBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  previewCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20, gap: 10 },
  previewTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewDot: { width: 10, height: 10, borderRadius: 5 },
  previewName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  previewAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  previewOf: { fontSize: 14, fontFamily: "Inter_400Regular" },
  previewTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  previewFill: { height: 4, borderRadius: 2 },
  previewPct: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  field: { marginBottom: 16, gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  inputBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 52, justifyContent: "center" },
  textInput: { fontSize: 15, fontFamily: "Inter_400Regular" },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colorDotSelected: { transform: [{ scale: 1.15 }] },
  deadlineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  deadlineToggle: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  deadlineToggleText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  dateRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 0 },
  dateSegment: { flex: 1, alignItems: "center", gap: 2 },
  dateSegmentLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
  dateSegmentInput: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center", minWidth: 36, padding: 0 },
  dateSep: { width: 1, height: 32, marginHorizontal: 4 },
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
