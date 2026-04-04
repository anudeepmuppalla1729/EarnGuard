import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms, SCREEN_HEIGHT } from '../theme/responsive';
import { Wallet, Zap, ArrowRight, Banknote, RefreshCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

export default function FeatureAutoClaimsScreen() {
  const navigation = useNavigation<any>();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('FeatureZoneMonitoring');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('SignUp');
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
            <View style={styles.illustrationContainer}>
              <View style={styles.illustrationCard}>
                <View style={styles.walletIconBox}>
                  <Wallet size={s(64)} color={theme.colors.primary} />
                </View>
                
                <View style={[styles.floatingIcon, styles.floating1]}>
                  <Banknote size={s(20)} color={theme.colors.success} />
                </View>
                <View style={[styles.floatingIcon, styles.floating2]}>
                  <RefreshCcw size={s(20)} color={theme.colors.onSurface} />
                </View>
                <View style={[styles.floatingIcon, styles.floating3]}>
                  <Zap size={s(18)} color={theme.colors.warning} fill={theme.colors.warningLight} />
                </View>
              </View>
            </View>

            <View style={styles.textSection}>
              <Text style={styles.title}>Automatic Claims.</Text>
              <Text style={styles.subtitle}>
                No paperwork. When risks disrupt your zone, we credit your wallet automatically.
              </Text>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.pagination}>
                <View style={styles.dot} />
                <View style={[styles.dot, styles.activeDot]} />
                <View style={styles.dot} />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={handleContinue}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <ArrowRight size={s(20)} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
                  <Text style={styles.secondaryButtonText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: s(32),
    paddingVertical: vs(48),
    justifyContent: 'space-between',
  },
  illustrationContainer: {
    width: '100%',
    aspectRatio: 1.1,
    marginBottom: vs(32),
  },
  illustrationCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: s(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  walletIconBox: {
    width: s(120),
    height: s(120),
    backgroundColor: theme.colors.elevated,
    borderRadius: s(24),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  floatingIcon: {
    position: 'absolute',
    borderRadius: 99,
    width: s(48),
    height: s(48),
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  floating1: {
    top: '20%',
    right: '20%',
  },
  floating2: {
    bottom: '25%',
    left: '20%',
  },
  floating3: {
    top: '30%',
    left: '25%',
  },
  textSection: {
    gap: vs(16),
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(36),
    color: theme.colors.onSurface,
    lineHeight: ms(44),
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(18),
    color: theme.colors.onSurfaceVariant,
    lineHeight: ms(28),
  },
  bottomSection: {
    marginTop: vs(48),
    gap: vs(32),
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: s(8),
    alignItems: 'center',
  },
  dot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: theme.colors.divider,
  },
  activeDot: {
    width: s(24),
    backgroundColor: theme.colors.primary,
  },
  actions: {
    width: '100%',
    gap: vs(24),
  },
  primaryButton: {
    flexDirection: 'row',
    width: '100%',
    height: vs(64),
    backgroundColor: theme.colors.primary,
    borderRadius: s(20),
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(12),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: ms(18),
  },
  secondaryButton: {
    alignSelf: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
  },
});
