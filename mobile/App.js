import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";

import RecordsScreen from "./src/screens/RecordsScreen";
import UploadScreen from "./src/screens/UploadScreen";
import AccessScreen from "./src/screens/AccessScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { WalletProvider } from "./src/hooks/useWallet";

const Tab = createBottomTabNavigator();

const ICONS = {
  Records: "📋",
  Upload: "📤",
  Access: "🔑",
  Analytics: "📊",
  Profile: "👤",
};

export default function App() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: () => (
                <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>
              ),
              tabBarStyle: {
                backgroundColor: "#0b1619",
                borderTopColor: "#1e3540",
                borderTopWidth: 1,
                paddingBottom: 8,
                paddingTop: 6,
                height: 65,
              },
              tabBarActiveTintColor: "#00e5c4",
              tabBarInactiveTintColor: "#4a7080",
              tabBarLabelStyle: {
                fontWeight: "600",
                fontSize: 11,
              },
              headerStyle: {
                backgroundColor: "#050d0f",
                borderBottomColor: "#1e3540",
                borderBottomWidth: 1,
              },
              headerTintColor: "#e8f4f7",
              headerTitleStyle: {
                fontWeight: "800",
                fontSize: 18,
              },
            })}
          >
            <Tab.Screen name="Records" component={RecordsScreen} options={{ title: "My Records" }} />
            <Tab.Screen name="Upload" component={UploadScreen} options={{ title: "Upload" }} />
            <Tab.Screen name="Access" component={AccessScreen} options={{ title: "Access Control" }} />
            <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: "Analytics" }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
          </Tab.Navigator>
        </NavigationContainer>
      </WalletProvider>
    </SafeAreaProvider>
  );
}
