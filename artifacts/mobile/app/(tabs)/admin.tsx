import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeIcon } from "@/components/BadgeIcon";
import { useAuth, type BadgeTier } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const ADMIN_USERNAME = (process.env["EXPO_PUBLIC_ADMIN_USERNAME"] ?? "admin").toLowerCase();

interface RemoteUser {
  username: string;
  displayName: string;
  tier: BadgeTier;
  badge_type: string;
  registeredAt: string;
  upgradedAt?: string;
}

function getApiBase(): string {
  return process.env["EXPO_PUBLIC_DOMAIN"]
    ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`
    : "/api";
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, upgradeUser } = useAuth();
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upgradingId, setUpgradingId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const isAdmin = user?.username?.toLowerCase() === ADMIN_USERNAME;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/admin/users`);
      const data = (await res.json()) as { success: boolean; users: RemoteUser[] };
      if (data.success) setRemoteUsers(data.users);
    } catch {/* ignore */}
  }, []);

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, [fetchUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleUpgrade = (targetUsername: string, tier: BadgeTier) => {
    const label = tier === "pro_blue" ? "Pro Blue" : tier === "pro_purple" ? "Pro Purple" : "Basic";
    Alert.alert(
      `Upgrade @${targetUsername}`,
      `Set tier to ${label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setUpgradingId(targetUsername);
            try {
              const badge = tier === "pro_blue" ? "Verified Blue" : tier === "pro_purple" ? "Verified Purple" : "New Member";
              const res = await fetch(`${getApiBase()}/admin/upgrade`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: targetUsername, tier }),
              });
              const data = (await res.json()) as { success: boolean };
              if (data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Also update local AsyncStorage in case this is the current user
                await upgradeUser(targetUsername, tier, badge);
                await fetchUsers();
              }
            } catch {/* ignore */}
            setUpgradingId(null);
          },
        },
      ],
    );
  };

  if (!isAdmin) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={40} color={colors.mutedForeground} />
        <Text style={[styles.noAccessTitle, { color: colors.foreground }]}>Admin Only</Text>
        <Text style={[styles.noAccessSub, { color: colors.mutedForeground }]}>
          This screen is restricted to administrators.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={remoteUsers}
        keyExtractor={(u) => u.username}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[styles.list, { paddingTop: topPad + 16, paddingBottom: 120 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>Admin Dashboard</Text>
              <Text style={[styles.sub, { color: colors.mutedForeground }]}>{remoteUsers.length} registered users</Text>
            </View>
            <TouchableOpacity
              style={[styles.refreshBtn, { borderColor: colors.border }]}
              onPress={handleRefresh}
            >
              <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="users" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No users registered yet</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const tierColor =
            item.tier === "pro_purple" ? colors.badgePurple :
            item.tier === "pro_blue" ? colors.badgeBlue :
            colors.mutedForeground;
          const isUpgrading = upgradingId === item.username;

          return (
            <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: tierColor + "20" }]}>
                  <Text style={[styles.avatarText, { color: tierColor }]}>
                    {item.username[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.usernameRow}>
                    <Text style={[styles.username, { color: colors.foreground }]}>@{item.username}</Text>
                    <BadgeIcon tier={item.tier as BadgeTier} badgeType={item.badge_type} size={14} />
                  </View>
                  <Text style={[styles.badgeLabel, { color: tierColor }]}>{item.badge_type}</Text>
                  {item.upgradedAt && (
                    <Text style={[styles.upgradeDate, { color: colors.mutedForeground }]}>
                      Upgraded {new Date(item.upgradedAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>

              {isUpgrading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 10 }} />
              ) : (
                <View style={styles.actions}>
                  {item.tier !== "pro_blue" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.badgeBlue + "20", borderColor: colors.badgeBlue + "50" }]}
                      onPress={() => handleUpgrade(item.username, "pro_blue")}
                      activeOpacity={0.7}
                    >
                      <Feather name="check-circle" size={13} color={colors.badgeBlue} />
                      <Text style={[styles.actionBtnText, { color: colors.badgeBlue }]}>Blue</Text>
                    </TouchableOpacity>
                  )}
                  {item.tier !== "pro_purple" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.badgePurple + "20", borderColor: colors.badgePurple + "50" }]}
                      onPress={() => handleUpgrade(item.username, "pro_purple")}
                      activeOpacity={0.7}
                    >
                      <Feather name="check-circle" size={13} color={colors.badgePurple} />
                      <Text style={[styles.actionBtnText, { color: colors.badgePurple }]}>Purple</Text>
                    </TouchableOpacity>
                  )}
                  {item.tier !== "basic" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.mutedForeground + "20", borderColor: colors.border }]}
                      onPress={() => handleUpgrade(item.username, "basic")}
                      activeOpacity={0.7}
                    >
                      <Feather name="x-circle" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Basic</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  list: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 48, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", gap: 10, marginTop: 40 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  userCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, gap: 12 },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  username: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  badgeLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  upgradeDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  noAccessTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  noAccessSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
