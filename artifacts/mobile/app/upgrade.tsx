import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const BLUE_FEATURES = [
  "Blue verification badge next to your @username",
  "Priority transaction notifications via Telegram",
  "Advanced financial analytics & insights",
  "Unlimited savings goals",
  "Export transactions to CSV",
];

const PURPLE_FEATURES = [
  "Everything in Pro (Blue)",
  "Exclusive Purple verification badge",
  "Early access to new features",
  "Direct admin support channel",
  "Custom dashboard themes",
];

export default function UpgradeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.headerSection}>
        <View style={[styles.crownBox, { backgroundColor: colors.badgeBlue + "20", borderColor: colors.badgeBlue + "40" }]}>
          <Feather name="star" size={30} color={colors.badgeBlue} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Upgrade to Pro</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Unlock premium features and get your verified badge
        </Text>
      </View>

      {/* Warning Banner */}
      <View style={[styles.warningBanner, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B40" }]}>
        <Feather name="alert-triangle" size={16} color="#F59E0B" />
        <Text style={[styles.warningText, { color: "#F59E0B" }]}>
          Important: When upgrading via SociaBuzz, please write your exact @username in the message so our admin can instantly verify and activate your badge.
        </Text>
      </View>

      {/* Pro Blue Card */}
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.badgeBlue + "60" }]}>
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <View style={[styles.badgeDot, { backgroundColor: colors.badgeBlue }]} />
            <Text style={[styles.planName, { color: colors.foreground }]}>Pro</Text>
            <View style={[styles.blueBadge, { backgroundColor: colors.badgeBlue + "20", borderColor: colors.badgeBlue + "50" }]}>
              <Text style={[styles.blueBadgeText, { color: colors.badgeBlue }]}>Blue</Text>
            </View>
          </View>
          <Text style={[styles.planPrice, { color: colors.foreground }]}>$9.99<Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>/mo</Text></Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.features}>
          {BLUE_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureCheck, { backgroundColor: colors.badgeBlue + "20" }]}>
                <Feather name="check" size={12} color={colors.badgeBlue} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.upgradeBtn, { backgroundColor: colors.badgeBlue }]}
          onPress={() => Linking.openURL("#")}
          activeOpacity={0.85}
        >
          <Feather name="external-link" size={15} color="white" />
          <Text style={styles.upgradeBtnText}>Upgrade via SociaBuzz</Text>
        </TouchableOpacity>
      </View>

      {/* Pro Purple Card */}
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.badgePurple + "60" }]}>
        <View style={[styles.popularBadge, { backgroundColor: colors.badgePurple }]}>
          <Text style={styles.popularText}>MOST EXCLUSIVE</Text>
        </View>
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <View style={[styles.badgeDot, { backgroundColor: colors.badgePurple }]} />
            <Text style={[styles.planName, { color: colors.foreground }]}>Pro</Text>
            <View style={[styles.blueBadge, { backgroundColor: colors.badgePurple + "20", borderColor: colors.badgePurple + "50" }]}>
              <Text style={[styles.blueBadgeText, { color: colors.badgePurple }]}>Purple</Text>
            </View>
          </View>
          <Text style={[styles.planPrice, { color: colors.foreground }]}>$19.99<Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>/mo</Text></Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.features}>
          {PURPLE_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureCheck, { backgroundColor: colors.badgePurple + "20" }]}>
                <Feather name="check" size={12} color={colors.badgePurple} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.upgradeBtn, { backgroundColor: colors.badgePurple }]}
          onPress={() => Linking.openURL("#")}
          activeOpacity={0.85}
        >
          <Feather name="external-link" size={15} color="white" />
          <Text style={styles.upgradeBtnText}>Upgrade via SociaBuzz</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  back: { marginBottom: 20 },
  headerSection: { alignItems: "center", gap: 12, marginBottom: 24 },
  crownBox: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  warningBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  warningText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
  planCard: { borderRadius: 16, borderWidth: 1.5, padding: 20, marginBottom: 16, gap: 16, overflow: "hidden" },
  popularBadge: { position: "absolute", top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 5, borderBottomLeftRadius: 12 },
  popularText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "white", letterSpacing: 0.5 },
  planHeader: { gap: 6 },
  planTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeDot: { width: 10, height: 10, borderRadius: 5 },
  planName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  blueBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  blueBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  planPrice: { fontSize: 28, fontFamily: "Inter_700Bold" },
  planPeriod: { fontSize: 14, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  features: { gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14 },
  upgradeBtnText: { color: "white", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
