import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export function UpgradeNotice() {
  const colors = useColors();
  const { pendingUpgradeNotice, clearUpgradeNotice, user } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isVisible = !!pendingUpgradeNotice;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [isVisible, scaleAnim, opacityAnim]);

  if (!isVisible) return null;

  const isPurple = user?.tier === "pro_purple";
  const accentColor = isPurple ? colors.badgePurple : colors.badgeBlue;
  const tierLabel = isPurple ? "Pro Purple ✦" : "Pro Blue ✓";

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={clearUpgradeNotice}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: accentColor + "60",
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glow ring */}
          <View style={[styles.glowRing, { backgroundColor: accentColor + "15", borderColor: accentColor + "30" }]}>
            <Text style={styles.emoji}>🎉</Text>
          </View>

          <Text style={[styles.heading, { color: colors.foreground }]}>Akun Diupgrade!</Text>
          <Text style={[styles.tier, { color: accentColor }]}>{tierLabel}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {pendingUpgradeNotice}
          </Text>

          <View style={[styles.featureChips, { backgroundColor: accentColor + "10" }]}>
            {(isPurple
              ? ["Badge ungu ✦", "Export CSV", "Fitur eksklusif"]
              : ["Badge biru ✓", "Analytics lengkap", "Unlimited goals"]
            ).map((f) => (
              <View key={f} style={[styles.chip, { borderColor: accentColor + "40" }]}>
                <Feather name="check" size={11} color={accentColor} />
                <Text style={[styles.chipText, { color: accentColor }]}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: accentColor }]}
            onPress={clearUpgradeNotice}
            activeOpacity={0.85}
          >
            <Text style={styles.closeBtnText}>Keren, terima kasih! 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 28,
    alignItems: "center",
    gap: 14,
  },
  glowRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emoji: { fontSize: 36 },
  heading: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "center" },
  tier: { fontSize: 17, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  featureChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", borderRadius: 12, padding: 12, width: "100%" },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  closeBtn: { width: "100%", height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  closeBtnText: { color: "white", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
