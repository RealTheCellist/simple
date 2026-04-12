import React, { useMemo } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Colors, FontFamily } from "../theme/tokens";
import { useHistory } from "../hooks/useHistory";

function dateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function HistoryScreen() {
  const { logs, clearAll, refresh } = useHistory();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const summary = useMemo(() => {
    const today = dateKey(new Date().toISOString());
    const todayCount = logs.filter((item) => dateKey(item.time) === today).length;
    return {
      total: logs.length,
      today: todayCount
    };
  }, [logs]);

  const onClear = () => {
    Alert.alert("Clear History", "Delete all logs?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => void clearAll() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>HISTORY</Text>
        <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
          <Text style={styles.clearText}>CLR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: Colors.up }]}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>TOTAL</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: Colors.amber }]}>{summary.today}</Text>
          <Text style={styles.summaryLabel}>TODAY</Text>
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item, index) => `${item.time}_${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>NO HISTORY LOGS</Text>}
        renderItem={({ item }) => {
          const isAbove = item.operator === "above";
          const color = isAbove ? Colors.up : Colors.dn;
          return (
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTicker}>{item.ticker}</Text>
                <Text style={styles.rowTime}>{new Date(item.time).toLocaleString("ko-KR")}</Text>
              </View>
              <View style={styles.right}>
                <Text style={[styles.rowCondition, { color }]}>
                  {item.operator.toUpperCase()} {item.target.toLocaleString("ko-KR")}
                </Text>
                <Text style={styles.rowPrice}>{item.price.toLocaleString("ko-KR")}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: { color: Colors.t0, fontSize: 16, fontFamily: FontFamily.monoSemiBold },
  clearBtn: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 6,
    minWidth: 44,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  clearText: { color: Colors.t1, fontFamily: FontFamily.mono, fontSize: 10 },
  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 8,
    padding: 12
  },
  summaryValue: { fontSize: 22, fontFamily: FontFamily.monoSemiBold, marginBottom: 4 },
  summaryLabel: { color: Colors.t2, fontSize: 10, fontFamily: FontFamily.mono },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { color: Colors.t2, marginTop: 24, textAlign: "center", fontFamily: FontFamily.mono },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  rowBody: { flex: 1 },
  rowTicker: { color: Colors.t0, fontSize: 12, fontFamily: FontFamily.monoSemiBold, marginBottom: 2 },
  rowTime: { color: Colors.t3, fontSize: 9, fontFamily: FontFamily.mono },
  right: { alignItems: "flex-end" },
  rowCondition: { fontSize: 10, fontFamily: FontFamily.mono, marginBottom: 2 },
  rowPrice: { color: Colors.t1, fontSize: 10, fontFamily: FontFamily.mono }
});

