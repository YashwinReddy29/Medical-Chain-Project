import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { colors, spacing, radius } from "../utils/theme";

export default function UploadScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📤</Text>
      <Text style={styles.title}>Upload Records</Text>
      <Text style={styles.desc}>
        File uploads require MetaMask to sign the blockchain transaction.
        Use the MedChain web app to upload records.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => Linking.openURL("https://medical-chain-project.vercel.app")}
      >
        <Text style={styles.btnText}>🌐 Open Web App</Text>
      </TouchableOpacity>

      <View style={styles.stepsBox}>
        <Text style={styles.stepsTitle}>How to upload:</Text>
        {[
          "1. Open the web app link above",
          "2. Connect MetaMask wallet",
          "3. Go to Upload tab",
          "4. Select patient address + file",
          "5. Confirm transaction in MetaMask",
        ].map((step, i) => (
          <Text key={i} style={styles.step}>{step}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 56, marginBottom: spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.sm },
  desc: { fontSize: 14, color: colors.text2, textAlign: "center", lineHeight: 22, marginBottom: spacing.lg, maxWidth: 300 },
  btn: { backgroundColor: colors.teal, borderRadius: radius.md, paddingHorizontal: 32, paddingVertical: 14, marginBottom: spacing.xl },
  btnText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
  stepsBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, width: "100%" },
  stepsTitle: { fontSize: 14, fontWeight: "700", color: colors.text2, marginBottom: spacing.sm },
  step: { fontSize: 13, color: colors.text2, paddingVertical: 4, lineHeight: 20 },
});
