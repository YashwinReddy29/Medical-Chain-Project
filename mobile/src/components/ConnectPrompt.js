import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "../utils/theme";

export default function ConnectPrompt() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔗</Text>
      <Text style={styles.title}>Connect Wallet</Text>
      <Text style={styles.desc}>Go to the Profile tab to connect your wallet address.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 8 },
  desc: { fontSize: 14, color: colors.text2, textAlign: "center", lineHeight: 22 },
});
