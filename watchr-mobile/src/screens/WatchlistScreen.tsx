import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Colors, FontFamily } from "../theme/tokens";
import { useWatchlist } from "../hooks/useWatchlist";
import MarketStrip from "../components/MarketStrip";
import TickerRow from "../components/TickerRow";

const MARKET_STRIP = [
  { name: "KOSPI", price: 2651.32, changeRate: 0.48 },
  { name: "KOSDAQ", price: 842.11, changeRate: -0.27 },
  { name: "NQ FUT", price: 18641.5, changeRate: 0.62 },
  { name: "USD/KRW", price: 1378.4, changeRate: -0.12 }
];

export default function WatchlistScreen() {
  const { tickers, prices, addTicker, removeTicker } = useWatchlist();
  const [tickerInput, setTickerInput] = useState("");

  const sortedTickers = useMemo(() => [...tickers], [tickers]);

  const onAdd = () => {
    const value = tickerInput.trim();
    if (!value) return;
    void addTicker(value);
    setTickerInput("");
  };

  const onDelete = (ticker: string) => {
    Alert.alert("Remove Ticker", `${ticker} will be removed from watchlist.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => void removeTicker(ticker) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <Text style={styles.title}>WATCHLIST</Text>
        <Text style={styles.subTitle}>Live</Text>
      </View>

      <MarketStrip items={MARKET_STRIP} />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ticker (e.g. 005930.KS, AAPL)"
          placeholderTextColor={Colors.t2}
          value={tickerInput}
          onChangeText={setTickerInput}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.button} onPress={onAdd}>
          <Text style={styles.buttonText}>ADD</Text>
        </TouchableOpacity>
      </View>

      {sortedTickers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>ADD TICKER TO BEGIN</Text>
        </View>
      ) : (
        <FlatList
          data={sortedTickers}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const quote = prices[item];
            if (!quote) {
              return (
                <View style={styles.loadingRow}>
                  <Text style={styles.loadingTicker}>{item}</Text>
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              );
            }

            return (
              <TickerRow
                ticker={item}
                name={quote.ticker}
                price={quote.price}
                change={quote.change}
                changeRate={quote.changeRate}
                sparkData={[
                  quote.price - quote.change * 0.8,
                  quote.price - quote.change * 0.6,
                  quote.price - quote.change * 0.3,
                  quote.price - quote.change * 0.2,
                  quote.price
                ]}
                onLongPress={() => onDelete(item)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: { color: Colors.t0, fontSize: 16, fontFamily: FontFamily.monoSemiBold },
  subTitle: { color: Colors.t2, fontSize: 11, fontFamily: FontFamily.mono },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: Colors.t0,
    backgroundColor: Colors.bg1
  },
  button: {
    height: 44,
    minWidth: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: Colors.amber
  },
  buttonText: { color: Colors.bg, fontFamily: FontFamily.monoSemiBold },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: Colors.t2, marginTop: 24, fontFamily: FontFamily.mono },
  listContent: { paddingBottom: 14 },
  loadingRow: {
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8
  },
  loadingTicker: { color: Colors.t0, fontFamily: FontFamily.monoSemiBold, marginBottom: 4 },
  loadingText: { color: Colors.t2, fontFamily: FontFamily.mono }
});

