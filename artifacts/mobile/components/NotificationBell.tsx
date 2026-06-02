import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export function NotificationBell() {
  const colors = useColors();
  const { user } = useAuth();
  const { notifications, markNotificationsRead, getUnreadCount } = useApp();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const unread = user ? getUnreadCount(user.id) : 0;
  const myNotifs = user
    ? [...notifications].filter((n) => n.targetUserId === user.id).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  const handleOpen = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
    if (user && unread > 0) {
      await markNotificationsRead(user.id);
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handleOpen} style={styles.btn}>
        <Feather name="bell" size={22} color={colors.foreground} />
        {unread > 0 && (
          <View style={[styles.dot, { backgroundColor: colors.expense }]}>
            <Text style={styles.dotText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? 67 : insets.top + 16 }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Notifications</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          {myNotifs.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="bell-off" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={myNotifs}
              keyExtractor={(n) => n.id}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.notifItem,
                    {
                      backgroundColor: item.isRead ? colors.card : colors.primary + "15",
                      borderColor: item.isRead ? colors.border : colors.primary + "40",
                    },
                  ]}
                >
                  <View style={[styles.notifIcon, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="bell" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifMessage, { color: colors.foreground }]}>{item.message}</Text>
                    <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                      {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  dotText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "white",
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  notifIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifMessage: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
