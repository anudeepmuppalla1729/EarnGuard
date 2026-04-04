import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms, SCREEN_HEIGHT } from '../theme/responsive';
import { Radar, ArrowRight, Shield, CloudRain, TrafficCone } from 'lucide-react-native';
import Animated, { withRepeat, withTiming, useAnimatedStyle, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

export default function FeatureZoneMonitoringScreen() {
  const navigation = useNavigation<any>();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('SignUp');
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.container}>
          {/* Top Minimal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Shield size={s(18)} color={theme.colors.primary} />
              <Text style={styles.headerLogo}>EarnGuard</Text>
            </View>
            <Text style={styles.stepText}>Step 3 of 3</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.visualContainer}>
              <View style={styles.radarContainer}>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDifk4CUfC59tpGMt5bYoYg20T67RNybGBk9g-ZevhDQdc7ee_EINABhrLowMhas-8SU_OERd4W5eahCAaq4Om87DSsbl1wycihziEN9e4aYwqJkYOp3oKmD3Bw7wZMparUUSnVzjzr_va8F2XZ2w6jEsszCfOY8VfI8cmnbeoTl_W0LRkGNvcp5tO5vXDTgjuoew8g3uxW5NcrsMW2fOLqtQ5CJ_ce_5gcgXjiXnGF-4IblO-i3smJokus6Sjhhu5vanuuWJh-ffY' }}
                  style={styles.mapImage}
                />
                
                <View style={[styles.ring, { width: '100%', height: '100%' }]} />
                <View style={[styles.ring, { width: '66%', height: '66%' }]} />
                <View style={[styles.ring, { width: '33%', height: '33%' }]} />

                <RadarPing top="25%" right="25%" color={theme.colors.warning} label="HEAVY RAIN" icon={<CloudRain size={s(10)} color="#fff" />} />
                <RadarPing bottom="33%" left="25%" color={theme.colors.success} label="NORMAL FLOW" icon={<TrafficCone size={s(10)} color="#fff" />} />

                <View style={styles.centerIcon}>
                  <Radar size={s(22)} color="#fff" />
                </View>
              </View>
            </View>

            <View style={styles.textSection}>
              <Text style={styles.title}>Live Zone Monitoring</Text>
              <Text style={styles.subtitle}>
                Stay informed with real-time risk indicators for rain and congestion in your delivery area.
              </Text>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.pagination}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={[styles.dot, styles.activeDot]} />
              </View>

              <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={handleContinue}
                  activeOpacity={0.9}
                >
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                  <ArrowRight size={s(20)} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton} 
                  onPress={handleSignIn}
                >
                  <Text style={styles.secondaryButtonText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const RadarPing = ({ top, right, bottom, left, color, label, icon }: any) => {
  const pingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withRepeat(withSequence(withTiming(1, { duration: 0 }), withTiming(2.5, { duration: 2000 })), -1, false) }],
    opacity: withRepeat(withSequence(withTiming(0.6, { duration: 0 }), withTiming(0, { duration: 2000 })), -1, false),
  }));

  return (
    <View style={[styles.pingContainer, { top, right, bottom, left }]}>
      <Animated.View style={[styles.pingCircle, { backgroundColor: color }, pingStyle]} />
      <View style={[styles.pingDot, { backgroundColor: color }]}>
        {icon}
      </View>
      <View style={styles.tooltip}>
        <Text style={styles.tooltipText}>{label}</Text>
      </View>
    </View>
  );
};

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(24),
    paddingVertical: vs(16),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  headerLogo: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(18),
    color: theme.colors.onSurface,
  },
  stepText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(11),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: s(24),
    paddingVertical: vs(32),
    justifyContent: 'space-between',
  },
  visualContainer: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarContainer: {
    width: s(280),
    height: s(280),
    borderRadius: s(140),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 4,
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  centerIcon: {
    width: s(44),
    height: s(44),
    backgroundColor: theme.colors.primary,
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pingContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 20,
  },
  pingCircle: {
    position: 'absolute',
    width: s(16),
    height: s(16),
    borderRadius: s(8),
  },
  pingDot: {
    width: s(16),
    height: s(16),
    borderRadius: s(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: vs(24),
    backgroundColor: theme.colors.surface,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(6),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  tooltipText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(8),
    color: theme.colors.onSurface,
  },
  textSection: {
    alignItems: 'center',
    gap: vs(16),
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(32),
    color: theme.colors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(18),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: ms(28),
    paddingHorizontal: s(8),
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: vs(32),
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
    gap: vs(16),
  },
  primaryButton: {
    flexDirection: 'row',
    width: '100%',
    height: vs(64),
    backgroundColor: theme.colors.primary,
    borderRadius: s(16),
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
    height: vs(56),
    backgroundColor: theme.colors.surface,
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  secondaryButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(16),
    color: theme.colors.onSurface,
  },
});
