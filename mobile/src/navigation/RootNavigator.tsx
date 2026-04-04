import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useStore } from "../store";
import { CustomTabBar } from "./CustomTabBar";

// Screens
import WelcomeSplashScreen from "../screens/WelcomeSplashScreen";
import FeatureAutoClaimsScreen from "../screens/FeatureAutoClaimsScreen";
import FeatureZoneMonitoringScreen from "../screens/FeatureZoneMonitoringScreen";
import SignUpScreen from "../screens/SignUpScreen";
import TwoFactorAuthScreen from "../screens/TwoFactorAuthScreen";
import BiometricAuthSetupScreen from "../screens/BiometricAuthSetupScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import HelpCenterScreen from "../screens/HelpCenterScreen";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import PolicyScreen from "../screens/PolicyScreen";
import ClaimsScreen from "../screens/ClaimsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Policy" component={PolicyScreen} />
      <Tab.Screen name="Claims" component={ClaimsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated } = useStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="WelcomeSplash"
              component={WelcomeSplashScreen}
            />
            <Stack.Screen
              name="FeatureAutoClaims"
              component={FeatureAutoClaimsScreen}
            />
            <Stack.Screen
              name="FeatureZoneMonitoring"
              component={FeatureZoneMonitoringScreen}
            />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen
              name="TwoFactorAuth"
              component={TwoFactorAuthScreen}
            />
            <Stack.Screen
              name="BiometricSetup"
              component={BiometricAuthSetupScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="NotificationSettings"
              component={NotificationSettingsScreen}
            />
            <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
