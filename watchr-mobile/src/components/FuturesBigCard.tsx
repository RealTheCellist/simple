// src/components/FuturesBigCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/tokens';
import Sparkline from './Sparkline';

interface FuturesBigCardProps {
  label: string;
  price: number;
  change: number;
  changeRate: number;
  sparkData: number[];
}

const FuturesBigCard: React.FC<FuturesBigCardProps> = ({ 
  label, 
  price, 
  change, 
  changeRate, 
  sparkData 
}) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? Colors.up : Colors.dn;
  const badgeColor = isPositive ? Colors.upGlow : Colors.dnGlow;
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.price, { color: isPositive ? Colors.up : Colors.dn }]}>
        {price.toLocaleString('ko-KR')}
      </Text>
      <View style={styles.changeContainer}>
        <Text style={[styles.change, { color: changeColor }]}>
          {change >= 0 ? '+' : ''}{change.toLocaleString('ko-KR')}
        </Text>
        <Text style={[styles.changeRate, { color: changeColor }]}>
          {changeRate >= 0 ? '+' : ''}{changeRate.toFixed(2)}%
        </Text>
        <View style={[styles.badge, { backgroundColor: badgeColor }]} />
      </View>
      <Sparkline data={sparkData} color={changeColor} width="100%" height={44} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    padding: 16,
  },
  label: {
    fontSize: 7,
    color: Colors.t3,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  price: {
    fontFamily: 'IBM_Plex_Mono',
    fontSize: 26,
    fontWeight: '500',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  change: {
    fontFamily: 'IBM_Plex_Mono',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  changeRate: {
    fontFamily: 'IBM_Plex_Mono',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default FuturesBigCard;

