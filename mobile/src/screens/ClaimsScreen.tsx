import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { ShieldCheck, Cloud, AlertTriangle, Zap, ChevronRight, Plus, Waves, TrafficCone, Users, FileEdit } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SharedHeader } from '../components/SharedHeader';
import { HapticAction } from '../components/HapticAction';
import { useClaimsStore } from '../store/claimsStore';
import { getDisruptionLabel, formatDate } from '../api/mockData';
import { useNavigation } from '@react-navigation/native';

const ICON_MAP: Record<string, React.ReactNode> = {
  'HEAVY_RAIN': <Cloud size={s(18)} color={theme.colors.onSurfaceVariant} />,
  'SYSTEM_TRIGGER': <Zap size={s(18)} color={theme.colors.onSurfaceVariant} />,
  'SOCIAL_DISRUPTION': <AlertTriangle size={s(18)} color={theme.colors.onSurfaceVariant} />,
  'FLOOD': <Waves size={s(18)} color={theme.colors.onSurfaceVariant} />,
  'TRAFFIC_CONGESTION': <TrafficCone size={s(18)} color={theme.colors.onSurfaceVariant} />,
  'PLATFORM_OUTAGE': <Zap size={s(18)} color={theme.colors.onSurfaceVariant} />,
};

function getStatusConfig(status: string, isPending: boolean) {
  if (status === 'REJECTED') {
    return { label: 'Rejected', bgColor: theme.colors.errorLight, textColor: theme.colors.error };
  }
  if (isPending) {
    return { label: 'In Review', bgColor: theme.colors.warningLight, textColor: theme.colors.warning };
  }
  return { label: 'Completed', bgColor: theme.colors.successLight, textColor: theme.colors.success };
}

export default function ClaimsScreen() {
  const claims = useClaimsStore(s => s.claims);
  const totalEarned = useClaimsStore(s => s.totalEarned);
  const isLoading = useClaimsStore(s => s.isLoading);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await useClaimsStore.getState().fetchClaims();
    setRefreshing(false);
  }, []);

  const handleFileClaim = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('FileClaim');
  };

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
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Claims History</Text>
          <Text style={styles.pageSubtitle}>Detailed overview of your financial protections.</Text>
        </View>

        {/* Claims List */}
        <View style={styles.historyContainer}>
          <View style={styles.historyCard}>
            {claims.length === 0 ? (
              <View style={styles.emptyState}>
                <ShieldCheck size={s(40)} color={theme.colors.divider} />
                <Text style={styles.emptyText}>No claims yet. Your protection is active!</Text>
                <TouchableOpacity style={styles.emptyActionBtn} onPress={handleFileClaim} activeOpacity={0.8}>
                  <Plus size={s(16)} color={theme.colors.primary} />
                  <Text style={styles.emptyActionText}>File your first claim</Text>
                </TouchableOpacity>
              </View>
            ) : (
              claims.map((claim, index) => {
                const isPending = claim.status === 'PENDING';
                const isRejected = claim.status === 'REJECTED';
                const isManual = claim.claimType === 'MANUAL';
                const icon = ICON_MAP[claim.disruptionType] || <ShieldCheck size={s(18)} color={theme.colors.onSurfaceVariant} />;
                
                const title = isRejected
                  ? 'Claim rejected'
                  : isPending
                    ? `₹${claim.payoutAmount.toFixed(0)} pending`
                    : `₹${claim.payoutAmount.toFixed(0)} credited`;

                const statusConfig = getStatusConfig(claim.status, isPending);

                return (
                  <Animated.View key={claim.id} entering={FadeInUp.delay(100 + index * 50).duration(200)}>
                    <ClaimItem
                      title={title}
                      type={getDisruptionLabel(claim.disruptionType)}
                      date={formatDate(claim.createdAt)}
                      statusLabel={statusConfig.label}
                      statusBg={statusConfig.bgColor}
                      statusColor={statusConfig.textColor}
                      icon={icon}
                      isFirst={index === 0}
                      isLast={index === claims.length - 1}
                      isManual={isManual}
                      isRejected={isRejected}
                      rejectionReason={claim.rejectionReason}
                      titleColor={isRejected ? theme.colors.error : isPending ? theme.colors.onSurface : theme.colors.success}
                    />
                  </Animated.View>
                );
              })
            )}
          </View>
        </View>

        {/* Summary Card - Dynamic */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.successLight }]}>
              <ShieldCheck size={s(28)} color={theme.colors.success} />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>Total Protection Earned</Text>
              <Text style={styles.summaryValue}>₹{totalEarned.toFixed(2)}</Text>
            </View>
            <Text style={styles.summaryDesc}>
              Your premiums and protection plans have actively secured your earnings throughout this quarter.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View entering={FadeInUp.delay(400).duration(300)} style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFileClaim}
          activeOpacity={0.85}
        >
          <FileEdit size={s(20)} color="#FFFFFF" />
          <Text style={styles.fabText}>File a Claim</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const ClaimItem = ({ title, type, date, statusLabel, statusBg, statusColor, icon, isFirst, isLast, isManual, isRejected, rejectionReason, titleColor }: any) => (
  <HapticAction activeOpacity={0.7} style={[styles.claimItem, isFirst && styles.firstItem, isLast && styles.lastItem]}>
    <View style={styles.claimMain}>
      <View style={styles.claimTitleRow}>
        <Text style={[styles.claimTitle, { color: titleColor }]}>{title}</Text>
        {isManual && (
          <View style={styles.manualBadge}>
            <Text style={styles.manualBadgeText}>MANUAL</Text>
          </View>
        )}
      </View>
      <View style={styles.claimTypeRow}>
        {icon}
        <Text style={styles.claimTypeText}>{type}</Text>
      </View>
      {isRejected && rejectionReason && (
        <Text style={styles.rejectionText} numberOfLines={2}>{rejectionReason}</Text>
      )}
    </View>
    <View style={styles.claimMeta}>
      <Text style={styles.claimDate}>{date}</Text>
      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
        <Text style={[styles.claimStatus, { color: statusColor }]}>
          {statusLabel.toUpperCase()}
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
    paddingBottom: vs(140),
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
  claimTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  claimTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(17),
  },
  manualBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(4),
  },
  manualBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(8),
    color: theme.colors.primary,
    letterSpacing: 0.5,
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
  rejectionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(11),
    color: theme.colors.error,
    marginTop: vs(2),
    lineHeight: ms(15),
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
    textAlign: 'center' as const,
    lineHeight: ms(20),
    maxWidth: s(260),
  },
  emptyState: {
    padding: s(40),
    alignItems: 'center' as const,
    gap: vs(12),
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center' as const,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    backgroundColor: theme.colors.primaryLight,
    borderRadius: s(10),
    marginTop: vs(4),
  },
  emptyActionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: ms(13),
    color: theme.colors.primary,
  },
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: vs(16),
    right: s(20),
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: s(20),
    paddingVertical: vs(14),
    borderRadius: s(16),
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(14),
    color: '#FFFFFF',
  },
});
