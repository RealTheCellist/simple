import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { OpenPrediction } from "../features/prediction/openingPredictor";
import { Colors, FontFamily } from "../theme/tokens";

type Props = {
  prediction: OpenPrediction | null;
};

function signed(value: number, digits = 2) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function toneByScore(score: number) {
  if (score >= 12) return Colors.up;
  if (score <= -12) return Colors.dn;
  return Colors.amber;
}

export default function OpenPredictionCard({ prediction }: Props) {
  if (!prediction) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>OPEN PREDICTION</Text>
        <Text style={styles.empty}>데이터 수집 중</Text>
      </View>
    );
  }

  const tone = toneByScore(prediction.score);
  const gaugeWidth = `${((prediction.score + 100) / 2).toFixed(1)}%` as `${number}%`;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.title}>OPEN PREDICTION</Text>
        <Text style={styles.confidence}>CONF {Math.round(prediction.confidence)}%</Text>
      </View>
      <Text style={[styles.headline, { color: tone }]}>{prediction.headline}</Text>
      <Text style={styles.meta}>
        SCORE {signed(prediction.score, 1)} · COVERAGE {Math.round(prediction.coverage * 100)}%
      </Text>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeFill, { width: gaugeWidth, backgroundColor: tone }]} />
      </View>
      {prediction.contributors.map((item) => (
        <Text key={item.key} style={styles.reason}>
          {item.label} {signed(item.changeRate)}% · 기여 {signed(item.contributionScore, 1)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.line2,
    backgroundColor: Colors.bg1
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  title: {
    color: Colors.t2,
    fontSize: 9,
    letterSpacing: 1.2,
    fontFamily: FontFamily.mono
  },
  confidence: {
    color: Colors.teal,
    fontSize: 10,
    fontFamily: FontFamily.mono
  },
  headline: {
    fontSize: 15,
    fontFamily: FontFamily.sansBold,
    marginBottom: 6
  },
  meta: {
    color: Colors.t2,
    fontSize: 10,
    marginBottom: 8,
    fontFamily: FontFamily.mono
  },
  gaugeTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.bg3,
    overflow: "hidden",
    marginBottom: 10
  },
  gaugeFill: {
    height: "100%"
  },
  reason: {
    color: Colors.t1,
    fontSize: 11,
    fontFamily: FontFamily.sans,
    marginTop: 2
  },
  empty: {
    color: Colors.t2,
    fontSize: 12,
    fontFamily: FontFamily.sans
  }
});
