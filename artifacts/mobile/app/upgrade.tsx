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
  "Badge biru ✓ di samping @username kamu",
  "Notifikasi transaksi prioritas via Telegram",
  "Unlimited transaksi & kategori kustom",
  "Analytics keuangan & grafik lengkap",
  "Unlimited savings goals",
];

const PURPLE_FEATURES = [
  "Semua keuntungan Pro Blue",
  "Badge eksklusif ungu ✦ di @username",
  "Export data ke CSV",
  "Akses fitur terbaru lebih awal",
  "Channel support admin langsung",
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
        <Text style={[styles.title, { color: colors.foreground }]}>Upgrade ke Pro</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Buka fitur premium & dapatkan badge verifikasi
        </Text>
      </View>

      {/* Warning Banner */}
      <View style={[styles.warningBanner, { backgroundColor: "#F59E0B15", borderColor: "#F59E0B40" }]}>
        <Feather name="alert-triangle" size={16} color="#F59E0B" />
        <Text style={[styles.warningText, { color: "#F59E0B" }]}>
          ⚠️ Penting: Harap tuliskan Username Anda di catatan/pesan saat melakukan pembayaran di SociaBuzz agar proses upgrade bisa langsung diproses!
        </Text>
      </View>

      {/* Pro Blue Card */}
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.badgeBlue + "60" }]}>
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <View style={[styles.badgeDot, { backgroundColor: colors.badgeBlue }]} />
            <Text style={[styles.planName, { color: colors.foreground }]}>Pro</Text>
            <View style={[styles.tierBadge, { backgroundColor: colors.badgeBlue + "20", borderColor: colors.badgeBlue + "50" }]}>
              <Text style={[styles.tierBadgeText, { color: colors.badgeBlue }]}>Blue</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color: colors.foreground }]}>Rp 15.000</Text>
            <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>/bulan</Text>
          </View>
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
          onPress={() => Linking.openURL("https://sociabuzz.com/himaruofficialgaming")}
          activeOpacity={0.85}
        >
          <Feather name="external-link" size={15} color="white" />
          <Text style={styles.upgradeBtnText}>Upgrade via SociaBuzz</Text>
        </TouchableOpacity>
      </View>

      {/* Pro Purple Card */}
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.badgePurple + "60" }]}>
        <View style={[styles.popularBadge, { backgroundColor: colors.badgePurple }]}>
          <Text style={styles.popularText}>PALING EKSKLUSIF</Text>
        </View>
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <View style={[styles.badgeDot, { backgroundColor: colors.badgePurple }]} />
            <Text style={[styles.planName, { color: colors.foreground }]}>Pro</Text>
            <View style={[styles.tierBadge, { backgroundColor: colors.badgePurple + "20", borderColor: colors.badgePurple + "50" }]}>
              <Text style={[styles.tierBadgeText, { color: colors.badgePurple }]}>Purple</Text>
            </View>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color: colors.foreground }]}>Rp 35.000</Text>
            <Text style={[styles.planPeriod, { color: colors.mutedForeground }]}>/bulan</Text>
          </View>
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
          onPress={() => Linking.openURL("https://sociabuzz.com/himaruofficialgaming")}
          activeOpacity={0.85}
        >
          <Feather name="external-link" size={15} color="white" />
          <Text style={styles.upgradeBtnText}>Upgrade via SociaBuzz</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Comparison */}
      <View style={[styles.compareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.compareTitle, { color: colors.foreground }]}>Perbandingan Paket</Text>
        <View style={styles.compareRow}>
          <Text style={[styles.compareFeature, { color: colors.mutedForeground }]}>Transaksi/bulan</Text>
          <Text style={[styles.compareBasic, { color: colors.mutedForeground }]}>30</Text>
          <Text style={[styles.comparePro, { color: colors.badgeBlue }]}>∞</Text>
          <Text style={[styles.comparePro, { color: colors.badgePurple }]}>∞</Text>
        </View>
        <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
        <View style={styles.compareRow}>
          <Text style={[styles.compareFeature, { color: colors.mutedForeground }]}>Savings Goals</Text>
          <Text style={[styles.compareBasic, { color: colors.mutedForeground }]}>3</Text>
          <Text style={[styles.comparePro, { color: colors.badgeBlue }]}>∞</Text>
          <Text style={[styles.comparePro, { color: colors.badgePurple }]}>∞</Text>
        </View>
        <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
        <View style={styles.compareRow}>
          <Text style={[styles.compareFeature, { color: colors.mutedForeground }]}>Analytics</Text>
          <Text style={[styles.compareBasic, { color: colors.mutedForeground }]}>✗</Text>
          <Text style={[styles.comparePro, { color: colors.badgeBlue }]}>✓</Text>
          <Text style={[styles.comparePro, { color: colors.badgePurple }]}>✓</Text>
        </View>
        <View style={[styles.compareDivider, { backgroundColor: colors.border }]} />
        <View style={styles.compareRow}>
          <Text style={[styles.compareFeature, { color: colors.mutedForeground }]}>Export CSV</Text>
          <Text style={[styles.compareBasic, { color: colors.mutedForeground }]}>✗</Text>
          <Text style={[styles.compareBasic, { color: colors.mutedForeground }]}>✗</Text>
          <Text style={[styles.comparePro, { color: colors.badgePurple }]}>✓</Text>
        </View>
        <View style={styles.compareHeaderRow}>
          <Text style={[styles.compareFeature, { color: "transparent" }]}>-</Text>
          <Text style={[styles.compareHeaderLabel, { color: colors.mutedForeground }]}>Basic</Text>
          <Text style={[styles.compareHeaderLabel, { color: colors.badgeBlue }]}>Blue</Text>
          <Text style={[styles.compareHeaderLabel, { color: colors.badgePurple }]}>Purple</Text>
        </View>
      </View>

      {/* Donate Section */}
      <View style={[styles.donateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.donateTop}>
          <Text style={styles.donateEmoji}>☕</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.donateTitle, { color: colors.foreground }]}>Donasi kepada Creator</Text>
            <Text style={[styles.donateSubtitle, { color: colors.mutedForeground }]}>
              Suka aplikasi ini? Traktir kopi buat developer-nya 😊
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.donateBtn, { borderColor: colors.primary + "60" }]}
          onPress={() => Linking.openURL("https://sociabuzz.com/himaruofficialgaming")}
          activeOpacity={0.8}
        >
          <Feather name="heart" size={15} color={colors.primary} />
          <Text style={[styles.donateBtnText, { color: colors.primary }]}>Donasi via SociaBuzz</Text>
          <Feather name="external-link" size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  back: { marginBottom: 4 },
  headerSection: { alignItems: "center", gap: 12, marginBottom: 8 },
  crownBox: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  warningBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 19 },
  planCard: { borderRadius: 16, borderWidth: 1.5, padding: 20, gap: 16, overflow: "hidden" },
  popularBadge: { position: "absolute", top: 0, right: 0, paddingHorizontal: 12, paddingVertical: 5, borderBottomLeftRadius: 12 },
  popularText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "white", letterSpacing: 0.5 },
  planHeader: { gap: 6 },
  planTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeDot: { width: 10, height: 10, borderRadius: 5 },
  planName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  tierBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  tierBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  planPrice: { fontSize: 26, fontFamily: "Inter_700Bold" },
  planPeriod: { fontSize: 14, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  features: { gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14 },
  upgradeBtnText: { color: "white", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  compareCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 0 },
  compareTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 14 },
  compareHeaderRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  compareHeaderLabel: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  compareRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  compareDivider: { height: 1 },
  compareFeature: { flex: 2, fontSize: 13, fontFamily: "Inter_400Regular" },
  compareBasic: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  comparePro: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  donateCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
  donateTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  donateEmoji: { fontSize: 32 },
  donateTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  donateSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  donateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 12, borderWidth: 1.5 },
  donateBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
