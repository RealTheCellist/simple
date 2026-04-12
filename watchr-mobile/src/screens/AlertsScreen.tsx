import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, FontFamily } from "../theme/tokens";
import { loadStoredWatchlist } from "../hooks/useWatchlist";
import { useAlerts } from "../hooks/useAlerts";
import { requestPermission } from "../notifications/alertNotify";
import type { AlertOperator } from "../types/alerts";

export default function AlertsScreen() {
  const { alerts, addAlert, removeAlert, toggleAlert, refresh } = useAlerts();
  const [tickerOptions, setTickerOptions] = useState<string[]>([]);
  const [ticker, setTicker] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [operator, setOperator] = useState<AlertOperator>("above");

  const loadTickers = useCallback(async () => {
    const items = await loadStoredWatchlist();
    setTickerOptions(items);
    if (!ticker && items.length) setTicker(items[0]);
  }, [ticker]);

  useFocusEffect(
    useCallback(() => {
      void loadTickers();
      void refresh();
    }, [loadTickers, refresh])
  );

  useEffect(() => {
    void requestPermission();
  }, []);

  const addDisabled = useMemo(() => !ticker || !targetPrice || Number(targetPrice) <= 0, [targetPrice, ticker]);

  const onAdd = async () => {
    if (addDisabled) return;
    await addAlert({
      ticker,
      operator,
      price: Number(targetPrice),
      enabled: true,
      lastFiredAt: 0
    });
    setTargetPrice("");
    await refresh();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.header}>
        <Text style={styles.title}>ALERTS</Text>
        <Text style={styles.meta}>{alerts.length} total</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Ticker</Text>
        <View style={styles.tickerRow}>
          {tickerOptions.length === 0 ? (
            <Text style={styles.noTicker}>Add watchlist ticker first</Text>
          ) : (
            tickerOptions.map((item) => {
              const active = item === ticker;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.tickerChip, active && styles.tickerChipActive]}
                  onPress={() => setTicker(item)}
                >
                  <Text style={[styles.tickerChipText, active && styles.tickerChipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <Text style={styles.cardLabel}>Target Price</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 80000"
          placeholderTextColor={Colors.t2}
          value={targetPrice}
          onChangeText={setTargetPrice}
        />

        <View style={styles.opRow}>
          <TouchableOpacity
            style={[styles.opButton, operator === "above" && styles.opButtonUp]}
            onPress={() => setOperator("above")}
          >
            <Text style={[styles.opButtonText, operator === "above" && styles.opButtonTextUp]}>ABOVE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.opButton, operator === "below" && styles.opButtonDown]}
            onPress={() => setOperator("below")}
          >
            <Text style={[styles.opButtonText, operator === "below" && styles.opButtonTextDown]}>BELOW</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.addButton, addDisabled && styles.addButtonDisabled]} onPress={onAdd}>
          <Text style={styles.addButtonText}>ADD ALERT</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>NO ACTIVE ALERTS</Text>}
        renderItem={({ item }) => {
          const isAbove = item.operator === "above";
          const sideColor = isAbove ? Colors.up : Colors.dn;
          const enabled = item.enabled !== false;
          return (
            <View style={styles.alertRow}>
              <View style={[styles.sideBar, { backgroundColor: sideColor }]} />
              <View style={styles.alertBody}>
                <Text style={styles.alertTicker}>{item.ticker}</Text>
                <Text style={styles.alertDesc}>
                  {item.operator.toUpperCase()} {Number(item.price).toLocaleString("ko-KR")}
                </Text>
              </View>
              <TouchableOpacity style={styles.smallBtn} onPress={() => void toggleAlert(item.id)}>
                <Text style={styles.smallBtnText}>{enabled ? "PAUSE" : "PLAY"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn} onPress={() => void removeAlert(item.id)}>
                <Text style={styles.smallBtnText}>DEL</Text>
              </TouchableOpacity>
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
  meta: { color: Colors.t2, fontFamily: FontFamily.mono, fontSize: 10 },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg1
  },
  cardLabel: { color: Colors.t2, fontFamily: FontFamily.mono, fontSize: 10, marginBottom: 8 },
  tickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  noTicker: { color: Colors.t2, fontFamily: FontFamily.mono, fontSize: 11 },
  tickerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.line
  },
  tickerChipActive: {
    borderColor: Colors.amber,
    backgroundColor: "rgba(245,166,35,0.12)"
  },
  tickerChipText: { color: Colors.t1, fontSize: 11, fontFamily: FontFamily.mono },
  tickerChipTextActive: { color: Colors.amber },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 8,
    backgroundColor: Colors.bg2,
    color: Colors.t0,
    paddingHorizontal: 12,
    marginBottom: 12
  },
  opRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  opButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: "center",
    justifyContent: "center"
  },
  opButtonUp: { borderColor: Colors.up, backgroundColor: Colors.upGlow },
  opButtonDown: { borderColor: Colors.dn, backgroundColor: Colors.dnGlow },
  opButtonText: { color: Colors.t1, fontFamily: FontFamily.mono, fontSize: 11 },
  opButtonTextUp: { color: Colors.up },
  opButtonTextDown: { color: Colors.dn },
  addButton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.amber,
    alignItems: "center",
    justifyContent: "center"
  },
  addButtonDisabled: { opacity: 0.45 },
  addButtonText: { color: Colors.bg, fontFamily: FontFamily.monoSemiBold, fontSize: 11 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  empty: { color: Colors.t2, fontFamily: FontFamily.mono, marginTop: 20, textAlign: "center" },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 8,
    marginBottom: 8
  },
  sideBar: { width: 3, alignSelf: "stretch" },
  alertBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 10 },
  alertTicker: { color: Colors.t0, fontFamily: FontFamily.monoSemiBold, fontSize: 12, marginBottom: 3 },
  alertDesc: { color: Colors.t2, fontFamily: FontFamily.mono, fontSize: 10 },
  smallBtn: {
    height: 30,
    minWidth: 46,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6
  },
  smallBtnText: { color: Colors.t1, fontFamily: FontFamily.mono, fontSize: 9 }
});

