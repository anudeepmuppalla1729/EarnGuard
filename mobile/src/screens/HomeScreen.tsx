import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { usePolicyStore } from '../store/policyStore';
import { useClaimsStore } from '../store/claimsStore';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { TrendingUp, ShieldCheck, CloudRain, Car, ChevronRight, CreditCard, Shield, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { SharedHeader } from '../components/SharedHeader';
import { HapticAction } from '../components/HapticAction';
import Animated, { 
  useSharedValue, 
  withTiming, 
  Easing,
  FadeInUp
} from 'react-native-reanimated';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const balance = useWalletStore(s => s.balance);
  const activePolicy = usePolicyStore(s => s.activePolicy);
  const totalEarned = useClaimsStore(s => s.totalEarned);
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([
      useWalletStore.getState().fetchBalance(),
      usePolicyStore.getState().fetchPolicies(),
      useClaimsStore.getState().fetchClaims(),
      useAuthStore.getState().fetchProfile(),
    ]);
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <SharedHeader />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Focal Point: Direct Wallet Balance */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <AnimatedBalance value={balance} />
          </View>
          <View style={styles.trendingRow}>
            <TrendingUp size={s(14)} color={theme.colors.success} />
            <Text style={styles.trendingText}>₹12.40 credited today</Text>
          </View>
        </View>

        {/* Dynamic Risk Alert - If any */}
        <View style={styles.alertSection}>
          <View style={styles.riskAlert}>
            <View style={[styles.alertIcon, { backgroundColor: theme.colors.warningLight }]}>
              <CloudRain size={s(18)} color={theme.colors.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Rain disruption likely</Text>
              <Text style={styles.alertDesc}>Zone 4 • 2:00 PM – 4:00 PM</Text>
            </View>
            <HapticAction style={styles.alertAction}>
              <Text style={styles.alertActionText}>Details</Text>
            </HapticAction>
          </View>
        </View>

        {/* Simplified Policy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>PROTECTION</Text>
            <HapticAction onPress={() => navigation.navigate('Policy')}>
              <Text style={styles.headerActionText}>Manage</Text>
            </HapticAction>
          </View>
          
          <HapticAction onPress={() => navigation.navigate('Policy')} style={styles.policyMinimalCard}>
            <View style={styles.policyInfoRow}>
              <View style={styles.policyMainInfo}>
                <Text style={styles.policyName}>{'Income Shield Plus'}</Text>
                <View style={styles.policyStatusRow}>
                  <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
              <ShieldCheck size={s(24)} color={theme.colors.primary} />
            </View>
            
            <View style={styles.policyMetricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>COVERAGE</Text>
                <Text style={styles.metricValue}>{activePolicy?.coverageMultiplier || '2.5'}x Multiplier</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>NEXT PAYOUT</Text>
                <Text style={styles.metricValue}>August 24</Text>
              </View>
            </View>
          </HapticAction>
        </View>

        {/* Insights Bento - Simplified */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ZONE INSIGHTS</Text>
          <View style={styles.bentoGrid}>
            <HapticAction style={styles.bentoCard}>
              <Car size={s(20)} color={theme.colors.onSurface} />
              <Text style={styles.bentoTitle}>Normal traffic</Text>
              <Text style={styles.bentoSubtitle}>Western Exp Hwy</Text>
            </HapticAction>
            <HapticAction style={styles.bentoCard}>
              <TrendingUp size={s(20)} color={theme.colors.success} />
              <Text style={styles.bentoTitle}>Peak earnings</Text>
              <Text style={styles.bentoSubtitle}>Bandra West</Text>
            </HapticAction>
          </View>
        </View>

        {/* Recent Activity - Minimalist */}
        <View style={[styles.section, { marginBottom: vs(120) }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>ACTIVITY</Text>
            <HapticAction onPress={() => navigation.navigate('Claims')}>
              <Text style={styles.headerActionText}>History</Text>
            </HapticAction>
          </View>
          
          <View style={styles.minimalActivityList}>
            <ActivityItem 
              title="Rain Delay Payout" 
              amount="+₹50.00" 
              time="10:45 AM" 
              type="success"
            />
            <ActivityItem 
              title="Policy Premium" 
              amount="-₹30.00" 
              time="Yesterday" 
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const ActivityItem = ({ title, amount, time, type }: any) => (
  <HapticAction style={styles.minimalActivityItem}>
    <View style={styles.activityMain}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
    <Text style={[
      styles.activityAmount, 
      type === 'success' && { color: theme.colors.success }
    ]}>
      {amount}
    </Text>
  </HapticAction>
);

const AnimatedBalance = ({ value }: { value: number }) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState("0.00");

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });
    
    const interval = setInterval(() => {
      setDisplayValue(animatedValue.value.toFixed(2));
      if (Math.abs(animatedValue.value - value) < 0.01) {
        clearInterval(interval);
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [value]);

  return <Text style={styles.balanceAmount}>{displayValue}</Text>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: vs(100),
    paddingHorizontal: s(24),
  },
  balanceSection: {
    paddingVertical: vs(32),
    alignItems: 'center',
  },
  balanceLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(11),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: vs(12),
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: s(4),
  },
  currencySymbol: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(28),
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  balanceAmount: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(64),
    color: theme.colors.onSurface,
    letterSpacing: -2,
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginTop: vs(12),
  },
  trendingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: ms(14),
    color: theme.colors.success,
  },
  alertSection: {
    marginBottom: vs(32),
  },
  riskAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: s(16),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  alertIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
    marginLeft: s(16),
  },
  alertTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(14),
    color: theme.colors.onSurface,
  },
  alertDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
    marginTop: vs(2),
  },
  alertAction: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    backgroundColor: theme.colors.background,
    borderRadius: s(8),
  },
  alertActionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(12),
    color: theme.colors.onSurface,
  },
  section: {
    marginBottom: vs(32),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(16),
    paddingHorizontal: s(4),
  },
  sectionHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(11),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  headerActionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(12),
    color: theme.colors.primary,
  },
  policyMinimalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(24),
    padding: s(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  policyInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: vs(20),
  },
  policyMainInfo: {
    gap: vs(4),
  },
  policyName: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(20),
    color: theme.colors.onSurface,
  },
  policyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  statusDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
  },
  policyMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: s(16),
    padding: s(16),
    gap: s(16),
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(9),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: vs(4),
  },
  metricValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(14),
    color: theme.colors.onSurface,
  },
  metricDivider: {
    width: 1,
    height: vs(24),
    backgroundColor: theme.colors.divider,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: s(12),
  },
  bentoCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: s(20),
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    gap: vs(8),
  },
  bentoTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(14),
    color: theme.colors.onSurface,
  },
  bentoSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
  },
  minimalActivityList: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
  },
  minimalActivityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: s(20),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  activityMain: {
    gap: vs(2),
  },
  activityTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: ms(15),
    color: theme.colors.onSurface,
  },
  activityTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
  },
  activityAmount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(16),
    color: theme.colors.onSurface,
  },
});
