import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoalCard } from "@/components/GoalCard";
import { SavingsGoal, useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";

const BASIC_GOAL_LIMIT = 3;

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, deleteGoal, updateGoal } = useApp();
  const { user } = useAuth();
  const { format, inputPrefix, currency } = useCurrency();
  const [fundGoal, setFundGoal] = useState<SavingsGoal | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const isPro = user?.tier === "pro_blue" || user?.tier === "pro_purple";
  const atBasicLimit = !isPro && goals.length >= BASIC_GOAL_LIMIT;

  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.currentAmount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.targetAmount, 0), [goals]);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleDelete = (id: string) => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this savings goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteGoal(id);
        },
      },
    ]);
  };

  const handleAddFunds = async () => {
    if (!fundGoal) return;
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) return;
    await updateGoal(fundGoal.id, { currentAmount: fundGoal.currentAmount + amt });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFundGoal(null);
    setFundAmount("");
  };

  const handleNewGoal = () => {
    if (atBasicLimit) {
      Alert.alert(
        "🔒 Batas Tercapai",
        `Paket Basic hanya mendukung ${BASIC_GOAL_LIMIT} savings goals. Upgrade ke Pro untuk goals tak terbatas!`,
        [
          { text: "Nanti saja", style: "cancel" },
          { text: "Upgrade Sekarang", onPress: () => router.push("/upgrade") },
        ],
      );
      return;
    }
    router.push("/add-goal");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingTop: topPad + 16, paddingBottom: 120 }]}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>Savings Goals</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: atBasicLimit ? colors.mutedForeground + "40" : colors.primary }]}
                onPress={handleNewGoal}
              >
                <Feather name={atBasicLimit ? "lock" : "plus"} size={18} color="white" />
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
                  Paket Basic: {goals.length}/{BASIC_GOAL_LIMIT} goals ·{" "}
                  <Text style={{ color: colors.badgeBlue }}>Upgrade untuk unlimited →</Text>
                </Text>
              </TouchableOpacity>
            )}

            {/* Overview card */}
            <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.overviewTop}>
                <View>
                  <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Total Saved</Text>
                  <Text style={[styles.overviewAmount, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
                    {format(totalSaved)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Overall Progress</Text>
                  <Text style={[styles.overviewPct, { color: colors.primary }]}>{overallPct}%</Text>
                </View>
              </View>
              <View style={[styles.overviewTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.overviewFill,
                    { width: `${overallPct}%` as `${number}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <Text style={[styles.overviewTarget, { color: colors.mutedForeground }]}>
                Target: {format(totalTarget)} · {goals.length} goal{goals.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {goals.length === 0 && (
              <View style={[styles.empty, { borderColor: colors.border }]}>
                <Feather name="target" size={40} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No savings goals</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Set a goal and start tracking your savings
                </Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  onPress={handleNewGoal}
                >
                  <Feather name="plus" size={14} color="white" />
                  <Text style={styles.emptyBtnText}>Create First Goal</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <GoalCard goal={item} onDelete={handleDelete} onAddFunds={setFundGoal} />
        )}
      />

      {/* Add Funds Modal */}
      <Modal
        visible={!!fundGoal}
        animationType="fade"
        transparent
        onRequestClose={() => setFundGoal(null)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Funds</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Adding to: <Text style={{ color: colors.foreground }}>{fundGoal?.name}</Text>
            </Text>
            <View style={[styles.amountInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.dollarSign, { color: colors.mutedForeground }]}>{inputPrefix}</Text>
              <TextInput
                style={[styles.amountField, { color: colors.foreground }]}
                value={fundAmount}
                onChangeText={setFundAmount}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Text style={[styles.modalHint, { color: colors.mutedForeground }]}>
              Currency: {currency} · Current: {fundGoal ? format(fundGoal.currentAmount) : ""}
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => { setFundGoal(null); setFundAmount(""); }}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: colors.primary }]}
                onPress={handleAddFunds}
              >
                <Text style={styles.modalConfirmText}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  overviewCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 20, gap: 12 },
  overviewTop: { flexDirection: "row", justifyContent: "space-between" },
  overviewLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  overviewAmount: { fontSize: 24, fontFamily: "Inter_700Bold" },
  overviewPct: { fontSize: 22, fontFamily: "Inter_700Bold" },
  overviewTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  overviewFill: { height: 6, borderRadius: 3 },
  overviewTarget: { fontSize: 12, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", padding: 48, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  emptyBtnText: { color: "white", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalBox: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 24, gap: 14 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  amountInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 56, gap: 6 },
  dollarSign: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  amountField: { flex: 1, fontSize: 24, fontFamily: "Inter_700Bold" },
  modalHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalCancel: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalConfirm: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalConfirmText: { color: "white", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
