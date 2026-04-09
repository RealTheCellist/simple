// src/screens/WatchlistScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../theme/tokens';
import MarketStrip from '../components/MarketStrip';
import TickerRow from '../components/TickerRow';
import { fetchPrice } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';
import { useWatchlist } from '../hooks/useWatchlist';

const WatchlistScreen: React.FC = () => {
  const { tickers, prices, addTicker, removeTicker, isLoading } = useWatchlist();
  const [refreshing, setRefreshing] = useState(false);
  // Dummy market data
  const marketData = [
    { name: 'NASDAQ', price: 14231, changeRate: 1.23 },
    { name: 'S&P 500', price: 4567, changeRate: 0.78 },
    { name: 'KOSPI', price: 25431, changeRate: 0.23 },
    { name: 'KOSDAQ', price: 8765, changeRate: -0.45 },
  ];

  const handleAddTicker = () => {
    Alert.prompt('종목 추가', '티커를 입력하세요', [
      {
        text: '취소',
        style: 'cancel'
      },
      {
        text: '추가',
        onPress: (ticker) => {
          if (ticker && ticker.trim()) {
            addTicker(ticker.trim());
          }
        }
      }
    ]);
  };

  const handleRemoveTicker = (ticker: string) => {
    Alert.alert(
      '종목 삭제',
      `${ticker}을(를) watchlist에서 삭제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => removeTicker(ticker)
        }
      ]
    );
  };

  const handleLongPress = (ticker: string) => {
    handleRemoveTicker(ticker);
  };

  const renderTickerRow = ({ item }: { item: string }) => {
    const priceData = prices[item];

    if (!priceData) {
      return null;
    }

    return (
      <TickerRow
        label={item}
        price={priceData.price}
        change={priceData.change}
        changeRate={priceData.changeRate}
        sparkData={priceData.sparkData}
        hasAlert={false}
        onLongPress={() => handleLongPress(item)}
      />
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh logic would be handled by the hook's polling
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>WATCHLIST</Text>
          <Text style={styles.appBarStatus}>장중</Text>
          <TouchableOpacity onPress={handleAddTicker}>
            <Text style={styles.appBarIcon}>+</Text>
          </TouchableOpacity>
        </View>
        <MarketStrip items={marketData} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>WATCHLIST</Text>
        <Text style={styles.appBarStatus}>장중</Text>
        <TouchableOpacity onPress={handleAddTicker}>
          <Text style={styles.appBarIcon}>+</Text>
        </TouchableOpacity>
      </View>
      <MarketStrip items={marketData} />
      {tickers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>ADD TICKER TO BEGIN</Text>
        </View>
      ) : (
        <FlatList
          data={tickers}
          renderItem={renderTickerRow}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appBarTitle: {
    fontFamily: 'IBM_Plex_Mono',
    fontSize: 15,
    fontWeight: '600',
    color: Colors.t0,
  },
  appBarStatus: {
    fontSize: 10,
    color: Colors.t2,
  },
  appBarIcon: {
    fontSize: 16,
    color: Colors.t0,
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.t2,
  },
});

export default WatchlistScreen;