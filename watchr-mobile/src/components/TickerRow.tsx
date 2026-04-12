// src/components/TickerRow.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, FontFamily } from '../theme/tokens';
import Sparkline from './Sparkline';

interface TickerRowProps {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  sparkData: number[];
  hasAlert?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
}

const TickerRow: React.FC<TickerRowProps> = ({
  ticker,
  name,
  price,
  change,
  changeRate,
  sparkData,
  hasAlert = false,
  onPress,
  onLongPress,
  onDelete
}) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? Colors.up : Colors.dn;
  
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={styles.container}>
      <View style={[styles.accentBar, { backgroundColor: isPositive ? Colors.up : Colors.dn }]} />
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.ticker}>{ticker}</Text>
          <View style={styles.nameContainer}>
            {hasAlert && <View style={styles.alertIndicator} />}
            <Text style={styles.name}>{name}</Text>
          </View>
        </View>
        <View style={styles.rightContent}>
          <Sparkline data={sparkData} color={changeColor} width={52} height={26} />
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{price.toLocaleString('ko-KR')}</Text>
            <View style={styles.changeContainer}>
              <Text style={[styles.change, { color: changeColor }]}>
                {change >= 0 ? '+' : ''}{change.toLocaleString('ko-KR')}
              </Text>
              <Text style={[styles.changeRate, { color: changeColor }]}>
                {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  content: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
  },
  ticker: {
    fontFamily: FontFamily.monoSemiBold,
    fontSize: 13,
    color: Colors.t0,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  alertIndicator: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: Colors.amber,
    marginRight: 5,
  },
  name: {
    fontSize: 10,
    color: Colors.t2,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: FontFamily.mono,
    fontSize: 13,
    color: Colors.t0,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  change: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
  },
  changeRate: {
    fontFamily: FontFamily.mono,
    fontSize: 9,
    marginLeft: 4,
  },
});

export default TickerRow;
