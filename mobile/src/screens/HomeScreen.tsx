import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useWalletStore } from '../store/walletStore';
import { usePolicyStore } from '../store/policyStore';
import { useClaimsStore } from '../store/claimsStore';
import { useDashboardStore } from '../store/dashboardStore';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import {
  TrendingUp, ShieldCheck, CloudRain, Car, ChevronRight,
  CreditCard, Shield, Info, AlertTriangle, Zap, TrendingDown,
  Waves, TrafficCone, CheckCircle,
} from 'lucide-react-native';
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
import { formatDate } from '../api/mockData';
import type { DashboardZoneInsight, DashboardActivity } from '../types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore(s => s.user);
  const balance = useWalletStore(s => s.balance);
  const dashboardData = useDashboardStore(s => s.data);
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await Promise.all([
      useWalletStore.getState().fetchBalance(),
      usePolicyStore.getState().fetchPolicies(),
      useClaimsStore.getState().fetchClaims(),
      useAuthStore.getState().fetchProfile(),
      useDashboardStore.getState().fetchDashboard(),
    ]);
    setRefreshing(false);
  }, []);

  // Derived values from dashboard data
  const todayCredits = dashboardData?.todayCredits ?? 0;
  const latestRisk = dashboardData?.latestRisk;
  const policy = dashboardData?.policy;
  const zoneInsights = dashboardData?.zoneInsights ?? [];
  const recentActivity = dashboardData?.recentActivity ?? [];
  const showRiskAlert = latestRisk && latestRisk.riskScore >= 0.3;

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
            {todayCredits > 0 ? (
              <>
                <TrendingUp size={s(14)} color={theme.colors.success} />
                <Text style={styles.trendingText}>₹{todayCredits.toFixed(2)} credited today</Text>
              </>
            ) : (
              <>
                <Info size={s(14)} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.trendingText, { color: theme.colors.onSurfaceVariant }]}>No credits yet today</Text>
              </>
            )}
          </View>
        </View>

        {/* Dynamic Risk Alert - Only shown when risk >= 0.3 */}
        {showRiskAlert && (
          <View style={styles.alertSection}>
            <View style={styles.riskAlert}>
              <View style={[styles.alertIcon, {
                backgroundColor: latestRisk.riskScore >= 0.7
                  ? theme.colors.errorLight
                  : theme.colors.warningLight
              }]}>
                {getRiskIcon(latestRisk.riskScore)}
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{latestRisk.riskLabel}</Text>
                <Text style={styles.alertDesc}>
                  {latestRisk.zoneName} • {latestRisk.orderDrop > 0 ? `${latestRisk.orderDrop.toFixed(0)}% order drop` : 'Monitoring active'}
                </Text>
              </View>
              <View style={[styles.riskBadge, {
                backgroundColor: latestRisk.riskScore >= 0.7
                  ? theme.colors.errorLight
                  : theme.colors.warningLight,
              }]}>
                <Text style={[styles.riskBadgeText, {
                  color: latestRisk.riskScore >= 0.7
                    ? theme.colors.error
                    : theme.colors.warning,
                }]}>{(latestRisk.riskScore * 100).toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* No active risk — all clear */}
        {!showRiskAlert && latestRisk !== undefined && (
          <View style={styles.alertSection}>
            <View style={styles.riskAlert}>
              <View style={[styles.alertIcon, { backgroundColor: theme.colors.successLight }]}>
                <CheckCircle size={s(18)} color={theme.colors.success} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>All clear</Text>
                <Text style={styles.alertDesc}>No active disruptions in your zone</Text>
              </View>
            </View>
          </View>
        )}

        {/* Policy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>PROTECTION</Text>
            <HapticAction onPress={() => navigation.navigate('Policy')}>
              <Text style={styles.headerActionText}>Manage</Text>
            </HapticAction>
          </View>
          
          {policy ? (
            <HapticAction onPress={() => navigation.navigate('Policy')} style={styles.policyMinimalCard}>
              <View style={styles.policyInfoRow}>
                <View style={styles.policyMainInfo}>
                  <Text style={styles.policyName}>Income Shield {policy.tierName}</Text>
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
                  <Text style={styles.metricValue}>{policy.coverageMultiplier}x Multiplier</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>RENEWS</Text>
                  <Text style={styles.metricValue}>{formatRenewalDate(policy.renewalDate)}</Text>
                </View>
              </View>
            </HapticAction>
          ) : (
            <HapticAction onPress={() => navigation.navigate('Policy')} style={styles.policyMinimalCard}>
              <View style={styles.policyInfoRow}>
                <View style={styles.policyMainInfo}>
                  <Text style={styles.policyName}>No Active Policy</Text>
                  <View style={styles.policyStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: theme.colors.outline }]} />
                    <Text style={styles.statusText}>Get protected</Text>
                  </View>
                </View>
                <Shield size={s(24)} color={theme.colors.outline} />
              </View>
            </HapticAction>
          )}
        </View>

        {/* Zone Insights Bento */}
        {zoneInsights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>ZONE INSIGHTS</Text>
            <View style={styles.bentoGrid}>
              {zoneInsights.slice(0, 2).map((zone) => (
                <HapticAction key={zone.zoneId} style={styles.bentoCard}>
                  {getZoneIcon(zone)}
                  <Text style={styles.bentoTitle}>{getZoneLabel(zone)}</Text>
                  <Text style={styles.bentoSubtitle}>{zone.zoneName}</Text>
                </HapticAction>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={[styles.section, { marginBottom: vs(120) }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>ACTIVITY</Text>
            <HapticAction onPress={() => navigation.navigate('Claims')}>
              <Text style={styles.headerActionText}>History</Text>
            </HapticAction>
          </View>
          
          {recentActivity.length > 0 ? (
            <View style={styles.minimalActivityList}>
              {recentActivity.map((item, index) => (
                <ActivityItem
                  key={item.id}
                  title={getActivityTitle(item)}
                  amount={getActivityAmount(item)}
                  time={formatDate(item.createdAt)}
                  type={item.type === 'CREDIT' ? 'success' : undefined}
                  isLast={index === recentActivity.length - 1}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyActivityText}>No recent activity</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Helper Functions ────────────────────────────────────────────────────────

function getRiskIcon(score: number) {
  if (score >= 0.7) return <AlertTriangle size={s(18)} color={theme.colors.error} />;
  if (score >= 0.4) return <CloudRain size={s(18)} color={theme.colors.warning} />;
  return <Info size={s(18)} color={theme.colors.onSurfaceVariant} />;
}

function getZoneIcon(zone: DashboardZoneInsight) {
  if (zone.riskScore >= 0.5) return <CloudRain size={s(20)} color={theme.colors.warning} />;
  if (zone.orderDrop >= 30) return <TrendingDown size={s(20)} color={theme.colors.error} />;
  if (zone.riskScore < 0.2) return <TrendingUp size={s(20)} color={theme.colors.success} />;
  return <Car size={s(20)} color={theme.colors.onSurface} />;
}

function getZoneLabel(zone: DashboardZoneInsight): string {
  if (zone.riskScore >= 0.7) return 'High risk zone';
  if (zone.riskScore >= 0.4) return 'Disruption active';
  if (zone.riskScore >= 0.2) return 'Moderate traffic';
  return 'Normal conditions';
}

function getActivityTitle(item: DashboardActivity): string {
  if (item.category === 'CLAIM_PAYOUT') return 'Claim Payout';
  if (item.category === 'PREMIUM_PAYMENT') return 'Policy Premium';
  if (item.category === 'TOPUP') return 'Wallet Top-up';
  return item.type === 'CREDIT' ? 'Credit' : 'Debit';
}

function getActivityAmount(item: DashboardActivity): string {
  const prefix = item.type === 'CREDIT' ? '+' : '-';
  return `${prefix}₹${item.amount.toFixed(2)}`;
}

function formatRenewalDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' });
}

// ── Sub-Components ──────────────────────────────────────────────────────────

const ActivityItem = ({ title, amount, time, type, isLast }: any) => (
  <HapticAction style={[styles.minimalActivityItem, isLast && { borderBottomWidth: 0 }]}>
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

// ── Styles ──────────────────────────────────────────────────────────────────

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
  riskBadge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(8),
  },
  riskBadgeText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(13),
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
  emptyActivity: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: s(32),
    alignItems: 'center',
  },
  emptyActivityText: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
  },
});
