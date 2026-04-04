import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms, SCREEN_HEIGHT } from '../theme/responsive';
import { Shield, Fingerprint, ScanFace, Lock, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import { BiometricService } from '../services/biometric';

export default function BiometricAuthSetupScreen() {
  const completeAuth = useAuthStore(s => s.completeAuth);
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableBiometrics = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsEnabling(true);
    
    const available = await BiometricService.isAvailable();
    if (!available) {
      Alert.alert(
        'Biometrics Unavailable',
        'Your device does not support biometric authentication. Proceeding without it.',
        [{ text: 'OK', onPress: () => completeAuth(false) }]
      );
      setIsEnabling(false);
      return;
    }

    const success = await BiometricService.authenticate('Verify to enable biometric login');
    if (success) {
      await completeAuth(true);
    } else {
      Alert.alert('Failed', 'Biometric verification failed. Try again or skip.');
    }
    setIsEnabling(false);
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeAuth(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.branding}>
              <View style={styles.logoBox}>
                <Shield size={s(24)} color={theme.colors.primary} />
              </View>
              <Text style={styles.logoText}>EarnGuard</Text>
            </View>

            <View style={styles.centralContainer}>
              <View style={styles.iconWrapper}>
                <View style={styles.mainIconContainer}>
                  <View style={styles.biometricIconBox}>
                    <Fingerprint size={s(80)} color={theme.colors.primary} />
                  </View>
                </View>

                {/* Floating detail icons - cleaner */}
                <View style={[styles.floatingIcon, styles.floatingIconFace]}>
                  <ScanFace size={s(20)} color={theme.colors.onSurfaceVariant} />
                </View>
                <View style={[styles.floatingIcon, styles.floatingIconLock]}>
                  <Lock size={s(18)} color={theme.colors.onSurfaceVariant} />
                </View>
              </View>

              <View style={styles.textSection}>
                <Text style={styles.title}>Secure your wallet</Text>
                <Text style={styles.subtitle}>
                  Enable biometrics for faster and more secure access to your earnings.
                </Text>
              </View>
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleEnableBiometrics}
                activeOpacity={0.9}
              >
                <ShieldCheck size={s(20)} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Enable Biometrics</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={handleSkip}
              >
                <Text style={styles.secondaryButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Lock size={s(12)} color={theme.colors.outline} />
              <Text style={styles.footerText}>AES-256 ENCRYPTION ACTIVE</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    minHeight: SCREEN_HEIGHT - vs(100),
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: s(32),
    paddingVertical: vs(48),
  },
  branding: {
    alignItems: 'center',
    marginBottom: vs(48),
  },
  logoBox: {
    width: s(48),
    height: s(48),
    borderRadius: s(14),
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  logoText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(20),
    color: theme.colors.onSurface,
    letterSpacing: -1,
  },
  centralContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIconContainer: {
    width: s(180),
    height: s(180),
    borderRadius: s(48),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 4,
  },
  biometricIconBox: {
    alignItems: 'center',
  },
  floatingIcon: {
    position: 'absolute',
    width: s(48),
    height: s(48),
    borderRadius: s(16),
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  floatingIconFace: {
    top: -vs(16),
    right: -s(16),
  },
  floatingIconLock: {
    bottom: -vs(8),
    left: -s(24),
  },
  textSection: {
    marginTop: vs(48),
    alignItems: 'center',
    gap: vs(12),
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(28),
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(16),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: ms(24),
    maxWidth: s(280),
  },
  actionSection: {
    width: '100%',
    marginTop: vs(40),
    gap: vs(16),
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: vs(64),
    borderRadius: s(20),
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(12),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: ms(18),
    fontFamily: 'Inter_700Bold',
  },
  secondaryButton: {
    height: vs(56),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  secondaryButtonText: {
    color: theme.colors.onSurface,
    fontSize: ms(16),
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    marginTop: vs(40),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  footerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(9),
    color: theme.colors.outline,
    letterSpacing: 1.5,
  },
});
