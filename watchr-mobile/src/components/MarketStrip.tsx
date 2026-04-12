// src/components/MarketStrip.tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily } from '../theme/tokens';

interface MarketItem {
  name: string;
  price: number;
  changeRate: number;
}

interface MarketStripProps {
  items: MarketItem[];
}

const MarketStrip: React.FC<MarketStripProps> = ({ items }) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      {items.map((item, index) => {
        const isPositive = item.changeRate >= 0;
        const changeColor = isPositive ? Colors.up : Colors.dn;
        
        return (
          <View key={index} style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={[styles.price, { color: isPositive ? Colors.up : Colors.dn }]}>
              {item.price.toLocaleString('ko-KR')}
            </Text>
            <Text style={[styles.changeRate, { color: changeColor }]}>
              {item.changeRate >= 0 ? '+' : ''}{item.changeRate.toFixed(2)}%
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  item: {
    minWidth: 100,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: Colors.line,
  },
  name: {
    fontSize: 7,
    color: Colors.t3,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  price: {
    fontFamily: FontFamily.mono,
    fontSize: 12,
    marginBottom: 2,
  },
  changeRate: {
    fontFamily: FontFamily.mono,
    fontSize: 8,
  },
});

export default MarketStrip;
