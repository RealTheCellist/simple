// src/screens/HistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../theme/tokens';
import { useHistory } from '../hooks/useHistory';

const HistoryScreen: React.FC = () => {
  const { logs, clearAll } = useHistory();
  const [summary, setSummary] = useState({ total: 0, today: 0 });

  // Calculate summary
  useEffect(() => {
    const total = logs.length;
    const today = logs.filter(log => {
      const logDate = new Date(log.time);
      const todayDate = new Date();
      return logDate.toDateString() === todayDate.toDateString();
    }).length;
    
    setSummary({ total, today });
  }, [logs]);

  const handleClearAll = () => {
    Alert.alert(
      '알림',
      '모든 이력을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => clearAll()
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    const isAbove = item.operator === 'above';
    const circleColor = isAbove ? Colors.up : Colors.dn;
    const conditionColor = isAbove ? Colors.up : Colors.dn;
    
    return (
      <View style={styles.historyItem}>
        <View style={[styles.circle, { backgroundColor: circleColor }]} />
        <View style={styles.historyContent}>
          <Text style={styles.ticker}>{item.ticker}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <View style={styles.conditionContainer}>
          <Text style={[styles.condition, { color: conditionColor }]}>
            {isAbove ? '상승' : '하락'}
          </Text>
          <Text style={styles.currentPrice}>{item.price.toLocaleString('ko-KR')}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>HISTORY</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Text style={styles.clearButtonText}>CLR</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>총 발동</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.today}</Text>
          <Text style={styles.summaryLabel}>오늘 발동</Text>
        </View>
      </View>
      
      <FlatList
        data={logs}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.time}
        style={styles.historyList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>이력이 없습니다</Text>
          </View>
        }
      />
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
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: Colors.t2,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: Colors.bg1,
    margin: 16,
    borderRadius: 10,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.t0,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.t2,
    marginTop: 4,
  },
  historyList: {
    flex: 1,
    margin: 16,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  circle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  ticker: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.t0,
    marginBottom: 4,
  },
  time: {
    fontSize: 8,
    color: Colors.t3,
  },
  conditionContainer: {
    alignItems: 'flex-end',
  },
  condition: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 10,
    color: Colors.t0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.t2,
  },
});

export default HistoryScreen;
