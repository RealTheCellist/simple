// src/screens/AlertsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors } from '../theme/tokens';
import { useAlerts } from '../hooks/useAlerts';
import { useWatchlist } from '../hooks/useWatchlist';
import { requestPermission } from '../utils/alertNotify';

const AlertsScreen: React.FC = () => {
  const { alerts, addAlert, removeAlert, getAlerts } = useAlerts();
  const { tickers } = useWatchlist();
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [operator, setOperator] = useState<'above' | 'below'>('above');
  const [showPicker, setShowPicker] = useState<boolean>(false);

  // Request notification permission on component mount
  useEffect(() => {
    const requestPermissionAsync = async () => {
      await requestPermission();
    };
    
    requestPermissionAsync();
  }, []);

  const handleAddAlert = () => {
    if (!selectedTicker || !targetPrice) {
      Alert.alert('경고', '모든 필드를 입력해주세요.');
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price)) {
      Alert.alert('경고', '유효한 가격을 입력해주세요.');
      return;
    }

    addAlert({
      ticker: selectedTicker,
      operator,
      price
    });

    // Reset form
    setSelectedTicker('');
    setTargetPrice('');
    setOperator('above');
  };

  const handleRemoveAlert = (id: string) => {
    removeAlert(id);
  };

  const renderAlertItem = ({ item }: { item: any }) => {
    const isAbove = item.operator === 'above';
    const barColor = isAbove ? Colors.up : Colors.dn;
    
    return (
      <View style={styles.alertItem}>
        <View style={[styles.alertBar, { backgroundColor: barColor }]} />
        <View style={styles.alertContent}>
          <Text style={styles.alertTicker}>{item.ticker}</Text>
          <Text style={styles.alertCondition}>
            {isAbove ? '이상' : '이하'} {item.price.toLocaleString('ko-KR')}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveAlert(item.id)}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPicker = () => {
    if (!showPicker) return null;
    
    return (
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>종목 선택</Text>
          {tickers.map(ticker => (
            <TouchableOpacity
              key={ticker}
              style={styles.pickerItem}
              onPress={() => {
                setSelectedTicker(ticker);
                setShowPicker(false);
              }}
            >
              <Text style={styles.pickerItemText}>{ticker}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.pickerCancel}
            onPress={() => setShowPicker(false)}
          >
            <Text style={styles.pickerCancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>ALERTS</Text>
        <Text style={styles.appBarStatus}>장중</Text>
      </View>
      
      <View style={styles.addCard}>
        <Text style={styles.cardTitle}>알림 추가</Text>
        
        <TouchableOpacity 
          style={styles.tickerButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.tickerButtonText}>
            {selectedTicker || '종목 선택'}
          </Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.priceInput}
          placeholder="목표가 입력"
          placeholderTextColor={Colors.t2}
          keyboardType="numeric"
          value={targetPrice}
          onChangeText={setTargetPrice}
        />
        
        <View style={styles.operatorButtons}>
          <TouchableOpacity
            style={[
              styles.operatorButton,
              operator === 'above' && { 
                backgroundColor: Colors.upGlow,
                borderColor: Colors.up
              }
            ]}
            onPress={() => setOperator('above')}
          >
            <Text 
              style={[
                styles.operatorButtonText,
                operator === 'above' && { color: Colors.up }
              ]}
            >
              이상
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.operatorButton,
              operator === 'below' && { 
                backgroundColor: Colors.dnGlow,
                borderColor: Colors.dn
              }
            ]}
            onPress={() => setOperator('below')}
          >
            <Text 
              style={[
                styles.operatorButtonText,
                operator === 'below' && { color: Colors.dn }
              ]}
            >
              이하
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddAlert}
        >
          <Text style={styles.addButtonText}>등록</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id}
        style={styles.alertList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 알림이 없습니다</Text>
          </View>
        }
      />
      
      {renderPicker()}
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
  addCard: {
    backgroundColor: Colors.bg1,
    margin: 16,
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.t0,
    marginBottom: 12,
  },
  tickerButton: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.t2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tickerButtonText: {
    color: Colors.t0,
    fontSize: 14,
  },
  priceInput: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.t2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: Colors.t0,
    fontSize: 14,
  },
  operatorButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  operatorButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.t0,
    fontWeight: '600',
    fontSize: 14,
  },
  alertList: {
    flex: 1,
    margin: 16,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertBar: {
    width: 3,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
    justifyContent: 'center',
  },
  alertTicker: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.t0,
    marginBottom: 4,
  },
  alertCondition: {
    fontSize: 12,
    color: Colors.t2,
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
  },
  removeButtonText: {
    fontSize: 18,
    color: Colors.t2,
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
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    width: '80%',
    maxHeight: '60%',
    padding: 16,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.t0,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg2,
  },
  pickerItemText: {
    fontSize: 14,
    color: Colors.t0,
  },
  pickerCancel: {
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  pickerCancelText: {
    fontSize: 14,
    color: Colors.t2,
  },
});

export default AlertsScreen;