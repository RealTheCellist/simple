// src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from './theme/tokens';
import WatchlistScreen from './screens/WatchlistScreen';
import FuturesScreen from './screens/FuturesScreen';
import AlertsScreen from './screens/AlertsScreen';
import HistoryScreen from './screens/HistoryScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'IBM_Plex_Mono': require('@expo-google-fonts/ibm-plex-mono'),
    'NotoSansKR': require('@expo-google-fonts/noto-sans-kr'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: Colors.bg1,
            borderTopWidth: 0.5,
            borderTopColor: Colors.line2,
            height: 82,
            paddingBottom: 20,
          },
          tabBarActiveTintColor: Colors.amber,
          tabBarInactiveTintColor: Colors.t3,
        }}
      >
        <Tab.Screen name="Watchlist" component={WatchlistScreen} />
        <Tab.Screen name="Futures" component={FuturesScreen} />
        <Tab.Screen name="Alerts" component={AlertsScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
