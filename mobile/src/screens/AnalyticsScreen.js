import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../utils/theme";
import { useWallet } from "../hooks/useWallet";
import ConnectPrompt from "../components/ConnectPrompt";

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color || colors.teal }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { account, records } = useWallet();
  const [stats, setStats] = useState({ total: 0, active: 0, deleted: 0, byType: [] });

  useEffect(() => {
    if (!records.length) return;
    const active = records.filter(r => r.active);
    const deleted = records.filter(r => !r.active);
    const typeMap = {};
    active.forEach(r => { const t = r.recordType || "other"; typeMap[t] = (typeMap[t] || 0) + 1; });
    const typeLabels = { lab:"Lab",imaging:"Imaging",prescription:"Rx",report:"Report",vaccine:"Vaccine",other:"Other" };
    const byType = Object.entries(typeMap).map(([k,v]) => ({ label: typeLabels[k]||k, value: v }));
    setStats({ total: records.length, active: active.length, deleted: deleted.length, byType });
  }, [records]);

  if (!account) return <ConnectPrompt />;

  const maxType = Math.max(...stats.byType.map(t => t.value), 1);
  const typeColors = [colors.teal, "#4fc3f7", "#ffd166", "#ff5370", "#00e676", "#b39ddb"];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Analytics</Text>

      <View style={styles.statGrid}>
        <StatCard icon="📋" label="Total" value={stats.total} />
        <StatCard icon="✅" label="Active" value={stats.active} />
        <StatCard icon="🗑️" label="Deleted" value={stats.deleted} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Records by Type</Text>
        {stats.byType.length === 0 ? (
          <Text style={styles.emptyText}>No records to display</Text>
        ) : (
          stats.byType.map((t, i) => (
            <BarRow key={i} label={t.label} value={t.value} max={maxType} color={typeColors[i % typeColors.length]} />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        {[
          { label: "Most common type", value: stats.byType[0]?.label || "—" },
          { label: "Active rate", value: stats.total ? `${Math.round(stats.active/stats.total*100)}%` : "—" },
          { label: "Network", value: "Sepolia" },
        ].map((item, i) => (
          <View key={i} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text style={styles.summaryValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  pageTitle: { fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: spacing.lg, paddingTop: spacing.sm },
  statGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.teal },
  statLabel: { fontSize: 11, color: colors.text2, marginTop: 2 },
  section: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.text2, marginBottom: spacing.md },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.sm, gap: 8 },
  barLabel: { width: 70, fontSize: 12, color: colors.text2 },
  barTrack: { flex: 1, height: 20, backgroundColor: colors.bg2, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barValue: { width: 24, fontSize: 12, color: colors.text, fontWeight: "600", textAlign: "right" },
  emptyText: { color: colors.text3, fontSize: 13 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { fontSize: 13, color: colors.text2 },
  summaryValue: { fontSize: 13, color: colors.text, fontWeight: "600" },
});
