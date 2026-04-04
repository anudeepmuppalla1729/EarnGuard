import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { ShieldCheck, Cloud, PlaneTakeoff, Thermometer, ShoppingBag, Wind, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SharedHeader } from '../components/SharedHeader';
import { HapticAction } from '../components/HapticAction';

export default function ClaimsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
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
        {/* Header Section - Static */}
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Claims History</Text>
          <Text style={styles.pageSubtitle}>Detailed overview of your financial protections.</Text>
        </View>

        {/* History Container - Static */}
        <View style={styles.historyContainer}>
          <View style={styles.historyCard}>
            <Animated.View entering={FadeInUp.delay(100).duration(200)}>
              <ClaimItem title="₹75 credited" type="Heavy Rain" date="Oct 24, 2023" status="Completed" icon={<Cloud size={s(18)} color={theme.colors.onSurfaceVariant} />} isFirst />
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(150).duration(200)}>
              <ClaimItem title="₹120 credited" type="Flight Delay" date="Oct 18, 2023" status="Completed" icon={<PlaneTakeoff size={s(18)} color={theme.colors.onSurfaceVariant} />} />
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(200).duration(200)}>
              <ClaimItem title="₹45 credited" type="Lightning Storm" date="Oct 12, 2023" status="Completed" icon={<Thermometer size={s(18)} color={theme.colors.onSurfaceVariant} />} />
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(250).duration(200)}>
              <ClaimItem title="₹250 pending" type="Medical Emergency" date="Oct 05, 2023" status="In Review" icon={<ShoppingBag size={s(18)} color={theme.colors.onSurfaceVariant} />} isPending />
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(300).duration(200)}>
              <ClaimItem title="₹30 credited" type="Commute Interruption" date="Sep 28, 2023" status="Completed" icon={<ShieldCheck size={s(18)} color={theme.colors.onSurfaceVariant} />} />
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(350).duration(200)}>
              <ClaimItem title="₹15 credited" type="High Wind Alert" date="Sep 15, 2023" status="Completed" icon={<Wind size={s(18)} color={theme.colors.onSurfaceVariant} />} isLast />
            </Animated.View>
          </View>
        </View>

        {/* Summary Card - Static */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.successLight }]}>
              <ShieldCheck size={s(28)} color={theme.colors.success} />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>Total Protection Earned</Text>
              <Text style={styles.summaryValue}>₹535.00</Text>
            </View>
            <Text style={styles.summaryDesc}>
              Your premiums and protection plans have actively secured your earnings throughout this quarter.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const ClaimItem = ({ title, type, date, status, icon, isFirst, isLast, isPending }: any) => (
  <HapticAction activeOpacity={0.7} style={[styles.claimItem, isFirst && styles.firstItem, isLast && styles.lastItem]}>
    <View style={styles.claimMain}>
      <Text style={[styles.claimTitle, { color: isPending ? theme.colors.onSurface : theme.colors.success }]}>{title}</Text>
      <View style={styles.claimTypeRow}>
        {icon}
        <Text style={styles.claimTypeText}>{type}</Text>
      </View>
    </View>
    <View style={styles.claimMeta}>
      <Text style={styles.claimDate}>{date}</Text>
      <View style={[styles.statusBadge, { backgroundColor: isPending ? theme.colors.warningLight : theme.colors.successLight }]}>
        <Text style={[styles.claimStatus, { color: isPending ? theme.colors.warning : theme.colors.success }]}>
          {status.toUpperCase()}
        </Text>
      </View>
    </View>
    <ChevronRight size={s(16)} color={theme.colors.divider} />
  </HapticAction>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: vs(120),
    paddingHorizontal: s(20),
    paddingBottom: vs(120),
  },
  headerSection: {
    marginBottom: vs(32),
  },
  pageTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(36),
    color: theme.colors.onSurface,
    letterSpacing: -1,
    marginBottom: vs(8),
  },
  pageSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(18),
    color: theme.colors.onSurfaceVariant,
  },
  historyContainer: {
    marginBottom: vs(32),
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
  },
  claimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(20),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  firstItem: {
    paddingTop: s(24),
  },
  lastItem: {
    borderBottomWidth: 0,
    paddingBottom: s(24),
  },
  claimMain: {
    flex: 1,
    gap: vs(4),
  },
  claimTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(17),
  },
  claimTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  claimTypeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(13),
    color: theme.colors.onSurfaceVariant,
  },
  claimMeta: {
    alignItems: 'flex-end',
    gap: vs(6),
    marginRight: s(12),
  },
  claimDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: s(6),
  },
  claimStatus: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(9),
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: theme.colors.elevated,
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
  },
  summaryContent: {
    padding: s(32),
    alignItems: 'center',
    gap: vs(16),
  },
  iconCircle: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextContainer: {
    alignItems: 'center',
    gap: vs(4),
  },
  summaryLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(16),
    color: theme.colors.onSurfaceVariant,
  },
  summaryValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(40),
    color: theme.colors.onSurface,
    letterSpacing: -1,
  },
  summaryDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: ms(20),
    maxWidth: s(260),
  },
});
