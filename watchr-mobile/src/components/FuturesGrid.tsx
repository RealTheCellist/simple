// src/components/FuturesGrid.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Colors } from '../theme/tokens';

interface FuturesItem {
  name: string;
  price: number;
  changeRate: number;
}

interface FuturesGridProps {
  items: FuturesItem[];
}

const FuturesGrid: React.FC<FuturesGridProps> = ({ items }) => {
  const renderGridItem = ({ item }: { item: FuturesItem }) => {
    const isPositive = item.changeRate >= 0;
    const changeColor = isPositive ? Colors.up : Colors.dn;
    
    return (
      <View style={styles.container}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{item.price.toLocaleString('ko-KR')}</Text>
        <Text style={[styles.changeRate, { color: changeColor }]}>
          {item.changeRate >= 0 ? '+' : ''}{item.changeRate.toFixed(2)}%
        </Text>
        <View style={[styles.bottomBar, { backgroundColor: isPositive ? Colors.up : Colors.dn }]} />
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={renderGridItem}
      keyExtractor={(item, index) => index.toString()}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  container: {
    padding: 11,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.line,
    width: '50%',
    height: 100,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 7,
    color: Colors.t3,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  price: {
    fontFamily: 'IBM_Plex_Mono',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  changeRate: {
    fontFamily: 'IBM_Plex_Mono',
    fontSize: 9,
  },
  bottomBar: {
    height: 2,
    width: '100%',
  },
});

export default FuturesGrid;