import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms, SCREEN_WIDTH, SCREEN_HEIGHT } from '../theme/responsive';
import { Shield, CheckCircle, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeSplashScreen() {
  const navigation = useNavigation<any>();

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('FeatureAutoClaims');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <Shield size={s(40)} color={theme.colors.primary} fill={theme.colors.successLight} />
              </View>
              <Text style={styles.logoText}>EarnGuard</Text>
            </View>

            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Protect your income.</Text>
              <Text style={styles.heroSubtitle}>Confident protection for delivery partners.</Text>
            </View>

            <View style={styles.featuresContainer}>
              <View style={styles.divider} />
              
              <View style={styles.featuresRow}>
                <View style={styles.featureItem}>
                  <CheckCircle size={s(18)} color={theme.colors.primary} />
                  <Text style={styles.featureLabel}>INSTANT</Text>
                </View>
                <View style={styles.featureItem}>
                  <Shield size={s(18)} color={theme.colors.primary} />
                  <Text style={styles.featureLabel}>SECURE</Text>
                </View>
                <View style={styles.featureItem}>
                  <Clock size={s(18)} color={theme.colors.primary} />
                  <Text style={styles.featureLabel}>24/7</Text>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleGetStarted}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>.
              </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(32),
    paddingVertical: vs(64),
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    gap: vs(16),
  },
  logoBox: {
    width: s(80),
    height: s(80),
    borderRadius: s(24),
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  logoText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(24),
    color: theme.colors.onSurface,
    letterSpacing: -1,
  },
  heroTextContainer: {
    alignItems: 'center',
    maxWidth: s(320),
  },
  heroTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(44),
    color: theme.colors.onSurface,
    textAlign: 'center',
    lineHeight: ms(52),
    letterSpacing: -1.5,
    marginBottom: vs(16),
  },
  heroSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(18),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: ms(28),
  },
  featuresContainer: {
    width: '100%',
    alignItems: 'center',
    gap: vs(32),
  },
  divider: {
    width: '40%',
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    gap: vs(8),
  },
  featureLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(10),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  footer: {
    width: '100%',
    gap: vs(20),
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: vs(64),
    borderRadius: s(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: ms(18),
    fontFamily: 'Inter_700Bold',
  },
  termsText: {
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: s(20),
  },
  termsLink: {
    color: theme.colors.onSurface,
    textDecorationLine: 'underline',
    fontFamily: 'Inter_600SemiBold',
  },
});
