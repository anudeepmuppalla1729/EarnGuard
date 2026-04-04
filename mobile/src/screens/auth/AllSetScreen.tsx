import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { s, vs, ms } from '../../theme/responsive';
import { CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/authStore';
import { BiometricService } from '../../services/biometric';

export default function AllSetScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const signup = useAuthStore(s => s.signup);
  const completeAuth = useAuthStore(s => s.completeAuth);
  const isLoading = useAuthStore(s => s.isLoading);
  const [isSuccess, setIsSuccess] = useState(false);
  const prevData = route.params || {};

  useEffect(() => {
    const performSignup = async () => {
      try {
        // platform_worker_id is auto-assigned by the platform API using email + mobile
        await signup(prevData.email, prevData.password, prevData.fullName, prevData.phone, prevData.platform);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsSuccess(true);
      } catch (e: any) {
        Alert.alert('Sign Up Failed', e?.error?.message || 'Please try again.', [
          { text: 'Go Back', onPress: () => navigation.navigate('SignUp') }
        ]);
      }
    };
    if (prevData.email) performSignup();
  }, []);

  // Finish auth → Check for biometrics before completing
  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const hasBiometric = await BiometricService.isAvailable();
    
    if (hasBiometric) {
      // Show biometric setup screen if hardware is available
      navigation.navigate('BiometricSetup');
    } else {
      // Proceed directly to dashboard if no biometrics
      await completeAuth(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Setting up your profile...</Text>
          </View>
        ) : (
          <>
            <View style={styles.centerBox}>
              <CheckCircle size={s(72)} color={theme.colors.primary} style={{ marginBottom: vs(24) }} />
              <Text style={styles.badge}>You're all set!</Text>
              <Text style={styles.title}>
                Welcome, {prevData.fullName ? prevData.fullName.split(' ')[0] : 'there'}!
              </Text>
              <Text style={styles.subtitle}>
                Your gig worker identity is verified and your account is ready.{'\n\n'}
                You can explore and activate an income protection policy anytime from the{' '}
                <Text style={styles.highlight}>Policy</Text> tab.
              </Text>
            </View>

            {isSuccess && (
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleFinish}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Go to Dashboard →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: theme.colors.background },
  container:   { flex: 1, paddingHorizontal: s(24) },
  centerBox:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'Inter_500Medium', fontSize: ms(16), color: theme.colors.onSurfaceVariant, marginTop: vs(16) },
  badge: {
    fontFamily: 'Inter_600SemiBold', fontSize: ms(12),
    color: theme.colors.primary, textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: vs(12),
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold', fontSize: ms(30),
    color: theme.colors.onSurface, letterSpacing: -0.5,
    marginBottom: vs(16), textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_500Medium', fontSize: ms(15),
    color: theme.colors.onSurfaceVariant, lineHeight: ms(24),
    textAlign: 'center', paddingHorizontal: s(8),
  },
  highlight: { fontFamily: 'Inter_700Bold', color: theme.colors.primary },
  footer:      { paddingBottom: vs(40) },
  primaryButton: {
    backgroundColor: theme.colors.primary, height: vs(60),
    borderRadius: s(16), justifyContent: 'center', alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: ms(16), fontFamily: 'Inter_700Bold' },
});
