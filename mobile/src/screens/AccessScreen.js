import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from "react-native";
import { colors, spacing, radius } from "../utils/theme";
import { useWallet } from "../hooks/useWallet";
import ConnectPrompt from "../components/ConnectPrompt";

export default function AccessScreen() {
  const { account, BACKEND_URL } = useWallet();
  const [doctorAddr, setDoctorAddr] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  async function grantAccess() {
    if (!doctorAddr || !doctorAddr.startsWith("0x")) {
      Alert.alert("Invalid", "Enter a valid doctor wallet address");
      return;
    }
    Alert.alert("Grant Access", `Grant access to ${doctorAddr.slice(0,10)}...?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Grant", onPress: () => {
          setDoctors(prev => [...prev, doctorAddr]);
          setDoctorAddr("");
          Alert.alert("Success", "Doctor access granted! (Connect web app to sign transaction)");
        }
      }
    ]);
  }

  function revokeAccess(addr) {
    Alert.alert("Revoke Access", `Remove access for ${addr.slice(0,10)}...?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke", style: "destructive", onPress: () => {
          setDoctors(prev => prev.filter(d => d !== addr));
        }
      }
    ]);
  }

  if (!account) return <ConnectPrompt />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Access Control</Text>
      <Text style={styles.pageDesc}>Manage which doctors can view your records.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>➕ Grant Doctor Access</Text>
        <TextInput
          style={styles.input}
          placeholder="Doctor's wallet address (0x...)"
          placeholderTextColor={colors.text3}
          value={doctorAddr}
          onChangeText={setDoctorAddr}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.grantBtn} onPress={grantAccess}>
          <Text style={styles.grantBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👨‍⚕️ Authorized Doctors ({doctors.length})</Text>
        {doctors.length === 0 ? (
          <Text style={styles.emptyText}>No doctors authorized yet.</Text>
        ) : (
          doctors.map((doc, i) => (
            <View key={i} style={styles.doctorRow}>
              <Text style={styles.doctorIcon}>👨‍⚕️</Text>
              <Text style={styles.doctorAddr} numberOfLines={1}>{doc}</Text>
              <TouchableOpacity style={styles.revokeBtn} onPress={() => revokeAccess(doc)}>
                <Text style={styles.revokeBtnText}>Revoke</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Note</Text>
        <Text style={styles.infoText}>
          To sign blockchain transactions, use the MedChain web app at medical-chain-project.vercel.app with MetaMask.
          This mobile app lets you view and manage access on the go.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  pageTitle: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 6, paddingTop: spacing.sm },
  pageDesc: { fontSize: 14, color: colors.text2, marginBottom: spacing.lg },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, fontSize: 13, fontFamily: "monospace", marginBottom: spacing.sm },
  grantBtn: { backgroundColor: colors.teal, borderRadius: radius.sm, padding: 12, alignItems: "center" },
  grantBtnText: { color: colors.bg, fontSize: 14, fontWeight: "700" },
  emptyText: { color: colors.text3, fontSize: 13 },
  doctorRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  doctorIcon: { fontSize: 20 },
  doctorAddr: { flex: 1, fontSize: 12, color: colors.text2, fontFamily: "monospace" },
  revokeBtn: { backgroundColor: "rgba(255,83,112,0.1)", borderWidth: 1, borderColor: "rgba(255,83,112,0.3)", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  revokeBtnText: { color: colors.red, fontSize: 12, fontWeight: "600" },
  infoBox: { backgroundColor: "rgba(0,229,196,0.08)", borderWidth: 1, borderColor: "rgba(0,229,196,0.2)", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xl },
  infoTitle: { fontSize: 14, fontWeight: "700", color: colors.teal, marginBottom: 6 },
  infoText: { fontSize: 13, color: colors.text2, lineHeight: 20 },
});
