import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Linking,
} from "react-native";
import { colors, spacing, radius } from "../utils/theme";
import { useWallet } from "../hooks/useWallet";
import ConnectPrompt from "../components/ConnectPrompt";

const RECORD_TYPES = {
  lab: { label: "Lab Results", icon: "🧪" },
  imaging: { label: "Imaging", icon: "🩻" },
  prescription: { label: "Prescription", icon: "💊" },
  report: { label: "Report", icon: "📋" },
  vaccine: { label: "Vaccination", icon: "💉" },
  other: { label: "Other", icon: "📄" },
};

function RecordCard({ record }) {
  const typeInfo = RECORD_TYPES[record.recordType] || RECORD_TYPES.other;
  const date = new Date(Number(record.timestamp) * 1000).toLocaleDateString();

  function openIPFS() {
    Linking.openURL(`https://gateway.pinata.cloud/ipfs/${record.ipfsHash}`);
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>{typeInfo.icon}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{record.fileName}</Text>
          <Text style={styles.cardType}>{typeInfo.label}</Text>
        </View>
        <View style={[styles.activeBadge, !record.active && styles.inactiveBadge]}>
          <Text style={styles.activeBadgeText}>{record.active ? "Active" : "Deleted"}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>🏥 {record.hospital?.slice(0,10)}…</Text>
        <Text style={styles.metaText}>🕐 {date}</Text>
      </View>
      <Text style={styles.hashText} numberOfLines={1}>
        IPFS: {record.ipfsHash?.slice(0, 24)}…
      </Text>
      <TouchableOpacity style={styles.viewBtn} onPress={openIPFS}>
        <Text style={styles.viewBtnText}>🔗 View on IPFS</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RecordsScreen() {
  const { account, records, loading, loadRecords } = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { if (account) loadRecords(); }, [account]);

  async function onRefresh() {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  }

  if (!account) return <ConnectPrompt />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <Text style={styles.headerSub}>{records.length} records found</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={colors.teal} size="large" style={{ marginTop: 40 }} />
      ) : records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyText}>No records yet</Text>
          <Text style={styles.emptySub}>Pull down to refresh</Text>
        </View>
      ) : (
        records.map((r, i) => <RecordCard key={i} record={r} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  header: { marginBottom: spacing.lg, paddingTop: spacing.sm },
  headerTitle: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 },
  headerSub: { fontSize: 13, color: colors.text3 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm },
  cardIcon: { width: 44, height: 44, backgroundColor: colors.surface2, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: spacing.sm },
  cardIconText: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: "700", color: colors.text },
  cardType: { fontSize: 12, color: colors.teal, marginTop: 2 },
  activeBadge: { backgroundColor: "rgba(0,230,118,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(0,230,118,0.3)" },
  inactiveBadge: { backgroundColor: "rgba(255,83,112,0.15)", borderColor: "rgba(255,83,112,0.3)" },
  activeBadgeText: { fontSize: 10, color: colors.green, fontWeight: "700" },
  cardMeta: { flexDirection: "row", gap: 12, marginBottom: 6 },
  metaText: { fontSize: 11, color: colors.text3 },
  hashText: { fontSize: 10, color: colors.text3, fontFamily: "monospace", marginBottom: spacing.sm },
  viewBtn: { backgroundColor: "rgba(0,229,196,0.1)", borderRadius: radius.sm, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(0,229,196,0.3)" },
  viewBtnText: { color: colors.teal, fontSize: 13, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, color: colors.text2, fontWeight: "600" },
  emptySub: { fontSize: 13, color: colors.text3, marginTop: 6 },
});
