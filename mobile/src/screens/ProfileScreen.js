import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from "react-native";
import { colors, spacing, radius } from "../utils/theme";
import { useWallet } from "../hooks/useWallet";

export default function ProfileScreen() {
  const { account, connectWallet, disconnect, isHospital } = useWallet();
  const [inputAddress, setInputAddress] = useState("");

  async function handleConnect() {
    if (!inputAddress || !inputAddress.startsWith("0x")) {
      Alert.alert("Invalid Address", "Please enter a valid Ethereum address starting with 0x");
      return;
    }
    const ok = await connectWallet(inputAddress.trim());
    if (ok) Alert.alert("Connected!", "Wallet connected successfully");
  }

  function handleDisconnect() {
    Alert.alert("Disconnect", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Disconnect", style: "destructive", onPress: disconnect },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🏥</Text>
        <Text style={styles.heroTitle}>MedChain</Text>
        <Text style={styles.heroSub}>Decentralized Medical Records</Text>
      </View>

      {!account ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect Wallet</Text>
          <Text style={styles.sectionDesc}>
            Enter your Ethereum wallet address to access your medical records.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor={colors.text3}
            value={inputAddress}
            onChangeText={setInputAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.connectBtn} onPress={handleConnect}>
            <Text style={styles.connectBtnText}>🔗 Connect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={styles.walletCard}>
            <View style={styles.walletRow}>
              <Text style={styles.walletLabel}>Connected Wallet</Text>
              {isHospital && (
                <View style={styles.hospitalBadge}>
                  <Text style={styles.hospitalBadgeText}>🏥 Hospital</Text>
                </View>
              )}
            </View>
            <Text style={styles.walletAddress}>{account}</Text>
            <View style={styles.connectedDot}>
              <View style={styles.dot} />
              <Text style={styles.connectedText}>Connected to Sepolia</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Info</Text>
            {[
              { label: "Network", value: "Ethereum Sepolia" },
              { label: "Encryption", value: "AES-256 + RSA-2048" },
              { label: "Storage", value: "IPFS via Pinata" },
              { label: "Role", value: isHospital ? "Hospital" : "Patient" },
            ].map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
            <Text style={styles.disconnectBtnText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>MedChain v1.0.0 • Sepolia Testnet</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { alignItems: "center", paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  heroIcon: { fontSize: 48, marginBottom: spacing.sm },
  heroTitle: { fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -1 },
  heroSub: { fontSize: 13, color: colors.text3, marginTop: 4 },
  section: { padding: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 },
  sectionDesc: { fontSize: 14, color: colors.text2, lineHeight: 20, marginBottom: spacing.md },
  input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, fontSize: 14, fontFamily: "monospace", marginBottom: spacing.md },
  connectBtn: { backgroundColor: colors.teal, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  connectBtnText: { color: colors.bg, fontSize: 16, fontWeight: "700" },
  walletCard: { margin: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: "rgba(0,229,196,0.3)", borderRadius: radius.lg, padding: spacing.lg },
  walletRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  walletLabel: { fontSize: 12, color: colors.text3, textTransform: "uppercase", letterSpacing: 0.5 },
  hospitalBadge: { backgroundColor: "rgba(0,229,196,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(0,229,196,0.3)" },
  hospitalBadgeText: { fontSize: 12, color: colors.teal, fontWeight: "700" },
  walletAddress: { fontSize: 13, color: colors.text, fontFamily: "monospace", marginBottom: spacing.sm },
  connectedDot: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  connectedText: { fontSize: 12, color: colors.text3 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 14, color: colors.text2 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: "600" },
  disconnectBtn: { margin: spacing.lg, backgroundColor: "rgba(255,83,112,0.1)", borderWidth: 1, borderColor: "rgba(255,83,112,0.3)", borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  disconnectBtnText: { color: colors.red, fontSize: 15, fontWeight: "700" },
  footer: { alignItems: "center", padding: spacing.xl },
  footerText: { fontSize: 12, color: colors.text3 },
});
