import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/AppProvider';
import { theme } from './src/theme/theme';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { 
  Manrope_400Regular, 
  Manrope_500Medium, 
  Manrope_600SemiBold, 
  Manrope_700Bold, 
  Manrope_800ExtraBold 
} from '@expo-google-fonts/manrope';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, 
    Inter_500Medium, 
    Inter_600SemiBold,
    Inter_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const onLayoutRootView = React.useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider onLayout={onLayoutRootView} style={{ backgroundColor: theme.colors.background }}>
        <StatusBar style="dark" />
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
