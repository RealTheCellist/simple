import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Colors, FontFamily } from "../theme/tokens";
import Sparkline from "./Sparkline";

interface FuturesBigCardProps {
  label: string;
  price: number;
  change: number;
  changeRate: number;
  sparkData: number[];
}

export default function FuturesBigCard({
  label,
  price,
  change,
  changeRate,
  sparkData
}: FuturesBigCardProps) {
  const isPositive = changeRate >= 0;
  const changeColor = isPositive ? Colors.up : Colors.dn;
  const badgeColor = isPositive ? Colors.upGlow : Colors.dnGlow;
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.price}>{price.toLocaleString("ko-KR")}</Text>
      <View style={styles.changeContainer}>
        <Text style={[styles.change, { color: changeColor }]}>
          {change >= 0 ? "+" : ""}
          {change.toLocaleString("ko-KR")}
        </Text>
        <Text style={[styles.changeRate, { color: changeColor }]}>
          {changeRate >= 0 ? "+" : ""}
          {changeRate.toFixed(2)}%
        </Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]} />
      </View>
      <Sparkline data={sparkData} color={changeColor} width={Math.max(220, width - 32)} height={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    padding: 16
  },
  label: {
    fontSize: 8,
    color: Colors.t3,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    fontFamily: FontFamily.mono
  },
  price: {
    fontFamily: FontFamily.monoSemiBold,
    fontSize: 26,
    color: Colors.t0,
    marginBottom: 8
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  change: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    marginRight: 4
  },
  changeRate: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    marginRight: 8
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4
  }
});

