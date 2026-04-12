import React, { useCallback, useMemo, useRef, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchFutures, type FuturesData } from "../api/client";
import FuturesBigCard from "../components/FuturesBigCard";
import FuturesGrid from "../components/FuturesGrid";
import OpenPredictionCard from "../components/OpenPredictionCard";
import { predictOpenFromFutures } from "../features/prediction/openingPredictor";
import { Colors, FontFamily } from "../theme/tokens";

type GridItem = {
  name: string;
  price: number;
  changeRate: number;
};

const FALLBACK: GridItem[] = [
  { name: "NASDAQ", price: 0, changeRate: 0 },
  { name: "S&P500", price: 0, changeRate: 0 },
  { name: "KOSPI", price: 0, changeRate: 0 },
  { name: "KOSDAQ", price: 0, changeRate: 0 },
  { name: "USD-KRW", price: 0, changeRate: 0 },
  { name: "DOW", price: 0, changeRate: 0 }
];

function findPrimary(rows: FuturesData[]) {
  return (
    rows.find((item) => /KOSPI200|K200|KS200|KOSPI/i.test(item.symbol)) ??
    rows[0] ??
    null
  );
}

export default function FuturesScreen() {
  const [rows, setRows] = useState<FuturesData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("Idle");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const data = await fetchFutures();
    if (!data) {
      setRows([]);
      setLastUpdated("Failed");
      return;
    }
    setRows(data);
    setLastUpdated(new Date().toLocaleTimeString("ko-KR"));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      timerRef.current = setInterval(() => {
        void refresh();
      }, 60000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [refresh])
  );

  const primary = useMemo(() => findPrimary(rows), [rows]);
  const bigCard = useMemo(
    () => ({
      label: primary?.name ?? primary?.symbol ?? "KOSPI200",
      price: primary?.price ?? 0,
      change: primary?.change ?? 0,
      changeRate: primary?.changeRate ?? 0,
      sparkData: primary
        ? [
            primary.price - primary.change * 0.9,
            primary.price - primary.change * 0.6,
            primary.price - primary.change * 0.4,
            primary.price - primary.change * 0.2,
            primary.price
          ]
        : [0, 0, 0, 0, 0]
    }),
    [primary]
  );

  const gridItems: GridItem[] = useMemo(() => {
    if (!rows.length) return FALLBACK;
    return rows.slice(0, 6).map((item) => ({
      name: item.name || item.symbol,
      price: item.price,
      changeRate: item.changeRate
    }));
  }, [rows]);
  const prediction = useMemo(() => predictOpenFromFutures(rows), [rows]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.header}>
        <Text style={styles.title}>FUTURES</Text>
        <Text style={styles.meta}>{lastUpdated}</Text>
      </View>
      <OpenPredictionCard prediction={prediction} />
      <FuturesBigCard
        label={bigCard.label}
        price={bigCard.price}
        change={bigCard.change}
        changeRate={bigCard.changeRate}
        sparkData={bigCard.sparkData}
      />
      <FuturesGrid items={gridItems} />
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
  meta: { color: Colors.t2, fontFamily: FontFamily.mono, fontSize: 10 }
});
