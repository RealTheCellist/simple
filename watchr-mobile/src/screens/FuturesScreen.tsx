// src/screens/FuturesScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/tokens';
import FuturesBigCard from '../components/FuturesBigCard';
import FuturesGrid from '../components/FuturesGrid';
import { fetchFutures } from '../api/client';
import { useFocusEffect } from '@react-navigation/native';

const FuturesScreen: React.FC = () => {
  const [futuresData, setFuturesData] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dummy big card data
  const bigCardData = {
    label: 'KOSPI200 선물',
    price: 25431,
    change: 123,
    changeRate: 0.49,
    sparkData: [25000, 25100, 25200, 25300, 25400, 25431],
  };

  // Dummy grid data
  const dummyGridData = [
    { name: 'NASDAQ', price: 14231, changeRate: 1.23 },
    { name: 'S&P 500', price: 4567, changeRate: 0.78 },
    { name: 'KOSPI', price: 25431, changeRate: 0.23 },
    { name: 'KOSDAQ', price: 8765, changeRate: -0.45 },
    { name: 'USD-KRW', price: 1300, changeRate: 0.12 },
    { name: 'DOW', price: 34567, changeRate: -0.34 },
  ];

  const fetchFuturesData = useCallback(async () => {
    const data = await fetchFutures();
    if (data && Array.isArray(data)) {
      setFuturesData(data);
    } else {
      setFuturesData([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Fetch immediately when screen is focused
      fetchFuturesData();
      
      // Set up interval for polling
      intervalRef.current = setInterval(() => {
        fetchFuturesData();
      }, 60000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [fetchFuturesData])
  );

  // Process data for grid
  const gridData = futuresData.length > 0 ? futuresData.slice(0, 6) : dummyGridData;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>FUTURES</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>장중</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.appBarIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
      <FuturesBigCard 
        label={bigCardData.label}
        price={bigCardData.price}
        change={bigCardData.change}
        changeRate={bigCardData.changeRate}
        sparkData={bigCardData.sparkData}
      />
      <FuturesGrid items={gridData} />
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
  statusBadge: {
    backgroundColor: Colors.upGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: Colors.up,
    fontWeight: '600',
  },
  appBarIcon: {
    fontSize: 16,
    color: Colors.t0,
  },
});

export default FuturesScreen;