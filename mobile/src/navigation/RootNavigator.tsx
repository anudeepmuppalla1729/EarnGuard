import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useAuthStore } from "../store/authStore";
import { CustomTabBar } from "./CustomTabBar";
import { theme } from "../theme/theme";
import { vs, ms } from "../theme/responsive";

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
import PlatformSelectionScreen from "../screens/auth/PlatformSelectionScreen";
import IdentityVerificationScreen from "../screens/auth/IdentityVerificationScreen";
import SelfieVerificationScreen from "../screens/auth/SelfieVerificationScreen";
import AllSetScreen from "../screens/auth/AllSetScreen";
import PolicySelectionScreen from "../screens/auth/PolicySelectionScreen";
import BankSelectionScreen from "../screens/BankSelectionScreen";

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

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Securing session...</Text>
    </View>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isRestoringSession = useAuthStore((s) => s.isRestoringSession);

  if (isRestoringSession) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

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
            <Stack.Screen name="PlatformSelection" component={PlatformSelectionScreen} />
            <Stack.Screen name="IdentityVerification" component={IdentityVerificationScreen} />
            <Stack.Screen name="SelfieVerification" component={SelfieVerificationScreen} />
            <Stack.Screen name="AllSet" component={AllSetScreen} />
            <Stack.Screen name="PolicySelectionScreen" component={PolicySelectionScreen} />
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
            <Stack.Screen name="BankSelection" component={BankSelectionScreen} />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    gap: vs(16),
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
  },
});
