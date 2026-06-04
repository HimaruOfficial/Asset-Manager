import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeIcon } from "@/components/BadgeIcon";
import { BadgeTier, useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const TIER_LABELS: Record<BadgeTier, string> = {
  basic: "Basic",
  pro_blue: "Pro (Blue)",
  pro_purple: "Pro (Purple)",
};

const TIER_COLORS: Record<BadgeTier, string> = {
  basic: "#6B7280",
  pro_blue: "#3B82F6",
  pro_purple: "#8B5CF6",
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [editingTelegram, setEditingTelegram] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [telegramId, setTelegramId] = useState(user?.telegramChatId ?? "");
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ displayName: displayName.trim(), telegramChatId: telegramId.trim() || undefined });
    setSaving(false);
    setEditingName(false);
    setEditingTelegram(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const handleTestTelegram = async () => {
    const chatId = telegramId.trim() || user?.telegramChatId?.trim();
    if (!chatId) {
      Alert.alert("No Chat ID", "Enter your Telegram Chat ID first, then save it before testing.");
      return;
    }
    setTestingTelegram(true);
    try {
      const apiBase = process.env["EXPO_PUBLIC_DOMAIN"]
        ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`
        : "/api";
      const res = await fetch(`${apiBase}/notifications/telegram/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      const json = (await res.json()) as { success: boolean; tokenConfigured: boolean };
      if (json.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("✅ Connected!", "Test message sent to your Telegram. Check your chat.");
      } else if (!json.tokenConfigured) {
        Alert.alert("Bot Not Configured", "The server's TELEGRAM_BOT_TOKEN is missing. Check your .env file.");
      } else {
        Alert.alert("Send Failed", "Bot token is set but the message couldn't be delivered. Double-check your Chat ID.");
      }
    } catch {
      Alert.alert("Connection Error", "Could not reach the API server. Make sure it's running.");
    } finally {
      setTestingTelegram(false);
    }
  };

  const tierColor = user ? TIER_COLORS[user.tier] : colors.mutedForeground;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: tierColor + "25", borderColor: tierColor + "50" }]}>
          <Text style={[styles.avatarText, { color: tierColor }]}>
            {user?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.foreground }]}>{user?.displayName}</Text>
            {user && <BadgeIcon tier={user.tier} badgeType={user.badge_type} size={20} />}
          </View>
          <Text style={[styles.username, { color: colors.mutedForeground }]}>@{user?.username}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tierColor + "20", borderColor: tierColor + "40" }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>{user ? TIER_LABELS[user.tier] : ""}</Text>
          </View>
        </View>
      </View>

      {/* Profile Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Profile</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Display Name</Text>
            </View>
            {editingName ? (
              <TextInput
                style={[styles.inlineInput, { color: colors.foreground, borderBottomColor: colors.primary }]}
                value={displayName}
                onChangeText={setDisplayName}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} style={styles.rowValue}>
                <Text style={[styles.rowValueText, { color: colors.foreground }]}>{user?.displayName}</Text>
                <Feather name="edit-2" size={13} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="at-sign" size={16} color={colors.mutedForeground} />
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Username</Text>
            </View>
            <Text style={[styles.rowValueText, { color: colors.foreground }]}>@{user?.username}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Email</Text>
            </View>
            <Text style={[styles.rowValueText, { color: colors.foreground }]}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Integrations */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Integrations</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Feather name="send" size={16} color={colors.mutedForeground} />
              <View>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Telegram Chat ID</Text>
                <Text style={[styles.rowHint, { color: colors.mutedForeground }]}>Get notified on new transactions</Text>
              </View>
            </View>
          </View>
          <View style={[styles.telegramInput, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {editingTelegram ? (
              <TextInput
                style={[styles.telegramField, { color: colors.foreground }]}
                value={telegramId}
                onChangeText={setTelegramId}
                placeholder="e.g. 123456789"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={() => setEditingTelegram(true)} style={{ flex: 1 }}>
                <Text style={[styles.telegramField, { color: telegramId ? colors.foreground : colors.mutedForeground }]}>
                  {telegramId || "Tap to add Telegram Chat ID"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.testTelegramBtn,
              {
                backgroundColor: (telegramId || user?.telegramChatId) ? "#229ED920" : colors.border + "60",
                borderColor: (telegramId || user?.telegramChatId) ? "#229ED950" : colors.border,
                opacity: testingTelegram ? 0.6 : 1,
              },
            ]}
            onPress={handleTestTelegram}
            disabled={testingTelegram}
            activeOpacity={0.75}
          >
            {testingTelegram ? (
              <ActivityIndicator size="small" color="#229ED9" />
            ) : (
              <Feather name="send" size={14} color={(telegramId || user?.telegramChatId) ? "#229ED9" : colors.mutedForeground} />
            )}
            <Text style={[styles.testTelegramText, { color: (telegramId || user?.telegramChatId) ? "#229ED9" : colors.mutedForeground }]}>
              {testingTelegram ? "Sending…" : "Test Telegram Connection"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save button */}
      {(editingName || editingTelegram) && (
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="white" size="small" /> : (
            <>
              <Feather name="check" size={16} color="white" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Upgrade */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {user?.tier === "basic" && (
            <>
              <TouchableOpacity style={styles.row} onPress={() => router.push("/upgrade")}>
                <View style={styles.rowLeft}>
                  <Feather name="star" size={16} color={colors.badgeBlue} />
                  <Text style={[styles.rowLabel, { color: colors.badgeBlue }]}>Upgrade to Pro</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <Feather name="log-out" size={16} color={colors.expense} />
              <Text style={[styles.rowLabel, { color: colors.expense }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  avatarSection: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  userInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  displayName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  username: { fontSize: 14, fontFamily: "Inter_400Regular" },
  tierBadge: { alignSelf: "flex-start", borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  tierText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  rowHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  rowValue: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValueText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  inlineInput: { fontSize: 14, fontFamily: "Inter_400Regular", borderBottomWidth: 1, minWidth: 120, paddingBottom: 2 },
  divider: { height: 1, marginHorizontal: 14 },
  telegramInput: { marginHorizontal: 14, marginBottom: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  telegramField: { fontSize: 15, fontFamily: "Inter_400Regular" },
  testTelegramBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 14, marginBottom: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1 },
  testTelegramText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 14, marginBottom: 20 },
  saveBtnText: { color: "white", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
