import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Currency, useCurrency } from "@/context/CurrencyContext";
import { useColors } from "@/hooks/useColors";

export function CurrencySwitcher() {
  const colors = useColors();
  const { currency, setCurrency } = useCurrency();

  const toggle = (c: Currency) => {
    if (c === currency) return;
    Haptics.selectionAsync();
    setCurrency(c);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.tab, currency === "IDR" && { backgroundColor: colors.primary }]}
        onPress={() => toggle("IDR")}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, { color: currency === "IDR" ? "white" : colors.mutedForeground }]}>
          IDR
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, currency === "USD" && { backgroundColor: colors.primary }]}
        onPress={() => toggle("USD")}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, { color: currency === "USD" ? "white" : colors.mutedForeground }]}>
          USD
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
