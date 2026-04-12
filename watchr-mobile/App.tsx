import React from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFonts } from "expo-font";
import {
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold
} from "@expo-google-fonts/ibm-plex-mono";
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_700Bold
} from "@expo-google-fonts/noto-sans-kr";
import { Colors, FontFamily } from "./src/theme/tokens";
import WatchlistScreen from "./src/screens/WatchlistScreen";
import FuturesScreen from "./src/screens/FuturesScreen";
import AlertsScreen from "./src/screens/AlertsScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import { useAlertsCount } from "./src/hooks/useAlerts";

type RootTabParamList = {
  Watchlist: undefined;
  Futures: undefined;
  Alerts: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  const alertsCount = useAlertsCount();
  const [fontsLoaded] = useFonts({
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.bg1,
            borderTopWidth: 0.5,
            borderTopColor: Colors.line2,
            height: Platform.OS === "android" ? 82 : 78,
            paddingBottom: Platform.OS === "android" ? 20 : 12
          },
          tabBarLabelStyle: {
            fontFamily: FontFamily.mono,
            fontSize: 11
          },
          tabBarActiveTintColor: Colors.amber,
          tabBarInactiveTintColor: Colors.t3
        }}
      >
        <Tab.Screen name="Watchlist" component={WatchlistScreen} />
        <Tab.Screen name="Futures" component={FuturesScreen} />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{ tabBarBadge: alertsCount || undefined }}
        />
        <Tab.Screen name="History" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
