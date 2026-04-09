import React, { useState, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
} from "react-native";
import { theme } from "../theme/theme";
import { s, vs, ms } from "../theme/responsive";
import { usePolicyStore } from "../store/policyStore";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Timer,
  CheckCircle2,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { SharedHeader } from "../components/SharedHeader";
import { HapticAction } from "../components/HapticAction";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const CARD_GAP = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const SPACER_WIDTH = (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_GAP / 2;
const SIDE_TRANSLATE = 8;

type PolicyTier = "BASIC" | "STANDARD" | "PREMIUM";

const FALLBACK_PLANS: any[] = [
  {
    id: "BASIC",
    title: "Basic",
    subtitle: "20% of loss covered",
    price: "30",
    icon: Shield,
  },
  {
    id: "STANDARD",
    title: "Standard",
    subtitle: "40% of loss covered",
    price: "50",
    icon: ShieldCheck,
    recommended: true,
  },
  {
    id: "PREMIUM",
    title: "Premium",
    subtitle: "60% of loss covered",
    price: "80",
    icon: ShieldAlert,
  },
];

export default function PolicyScreen() {
  const { quotes, fetchQuote, isLoading, activatePolicy, activePolicy } =
    usePolicyStore();
  const [selectedTier, setSelectedTier] = useState<PolicyTier>("STANDARD");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, []);

  const getDynamicPlans = () => {
    if (!quotes || quotes.length === 0) return FALLBACK_PLANS;
    return quotes.map((q) => {
      const isStandard = q.tier === "STANDARD";
      const isBasic = q.tier === "BASIC";
      const coveragePercent = isBasic ? "20%" : isStandard ? "40%" : "60%";
      return {
        id: q.tier,
        title: q.tier.charAt(0) + q.tier.slice(1).toLowerCase(),
        subtitle: `${coveragePercent} of loss covered`,
        price: q.premium_amount.toString(),
        icon: isBasic ? Shield : isStandard ? ShieldCheck : ShieldAlert,
        recommended: isStandard,
        additional_price: q.additional_price,
        base_price: q.base_price,
        reason: q.reason,
        policyId: q.policyId,
      };
    });
  };

  const currentPlans = getDynamicPlans();
  const initialIndex = currentPlans.findIndex((plan) => plan.id === "STANDARD");
  const validIndex = initialIndex === -1 ? 1 : initialIndex;
  const scrollX = useSharedValue(validIndex * SNAP_INTERVAL);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: validIndex * SNAP_INTERVAL,
        animated: false,
      });
    }, 100);
  }, [validIndex]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    if (index >= 0 && index < currentPlans.length) {
      const tier = currentPlans[index].id as PolicyTier;
      if (tier !== selectedTier) {
        setSelectedTier(tier);
        Haptics.selectionAsync();
      }
    }
  };

  const navigation = useNavigation<any>();

  const handleActivate = () => {
    const matchedPlan = currentPlans.find((p) => p.id === selectedTier);
    if (!matchedPlan) return;

    const totalAmount = matchedPlan.price;
    const basePrice = (matchedPlan as any)?.base_price || totalAmount;
    const additionalPrice = (matchedPlan as any)?.additional_price || 0;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("BankSelection", {
      tierName: selectedTier,
      totalAmount,
      basePrice,
      additionalPrice,
    });
  };

  return (
    <View style={styles.container}>
      <SharedHeader />

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.editorialHeader}>
          <Text style={styles.pageTitle}>Policy Details</Text>
          <Text style={styles.pageSubtitle}>
            Precision protection for delivery partners.
          </Text>
        </View>

        {activePolicy ? (
          <View style={styles.activeCard}>
            <View style={styles.activeHeaderRow}>
              <ShieldCheck size={s(28)} color={theme.colors.success} />
              <Text style={styles.activeTitle}>Active Protection</Text>
            </View>
            <View style={styles.activeDetailRow}>
              <Text style={styles.activeDetailLabel}>Premium paid:</Text>
              <Text style={styles.activeDetailValue}>
                ₹{activePolicy.premiumAmount}/wk
              </Text>
            </View>
            <View style={styles.activeDetailRow}>
              <Text style={styles.activeDetailLabel}>Coverage Limit:</Text>
              <Text style={styles.activeDetailValue}>
                {Math.round(activePolicy.coverageMultiplier * 100)}% of loss
              </Text>
            </View>
            <View style={styles.activeDetailRow}>
              <Text style={styles.activeDetailLabel}>Status:</Text>
              <Text
                style={[
                  styles.activeDetailValue,
                  { color: theme.colors.success },
                ]}
              >
                Protected
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.carouselSection}>
              <Text style={styles.sectionHeader}>SELECT YOUR PLAN</Text>

              {isLoading && currentPlans === FALLBACK_PLANS ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{ marginVertical: vs(40) }}
                />
              ) : (
                <View style={styles.carouselWrapper}>
                  <Animated.FlatList
                    ref={flatListRef}
                    data={currentPlans}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContainer}
                    snapToOffsets={currentPlans.map(
                      (_, i) => i * SNAP_INTERVAL,
                    )}
                    decelerationRate="fast"
                    bounces={false}
                    onScroll={onScroll}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    scrollEventThrottle={16}
                    getItemLayout={(_, index) => ({
                      length: SNAP_INTERVAL,
                      offset: SNAP_INTERVAL * index,
                      index,
                    })}
                    renderItem={({ item, index }) => (
                      <TierCarouselCard
                        item={item}
                        index={index}
                        scrollX={scrollX}
                        selected={selectedTier === item.id}
                      />
                    )}
                  />
                </View>
              )}
              {/* Swipe Hint */}
              <View style={styles.swipeHintRow}>
                <ChevronLeft size={s(14)} color={theme.colors.outline} />
                <Text style={styles.swipeHintText}>
                  Swipe to explore tier options
                </Text>
                <ChevronRight size={s(14)} color={theme.colors.outline} />
              </View>
            </View>

            {/* Unified ML Reason Box */}
            {(() => {
              const selectedPlan = currentPlans.find(
                (p: any) => p.id === selectedTier,
              );
              if (
                selectedPlan &&
                selectedPlan.additional_price &&
                Number(selectedPlan.additional_price) > 0
              ) {
                return (
                  <View style={styles.unifiedAdditionalBox}>
                    <View style={styles.aiReasonBox}>
                      <Zap size={20} color="#F59E0B" />
                      <View style={styles.aiReasonTextContainer}>
                        <Text style={styles.aiAdditionalAmountText}>
                          +₹{selectedPlan.additional_price} Disruption Fee
                          applied this week
                        </Text>
                        <Text style={styles.aiReasonText}>
                          {selectedPlan.reason}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }
              return null;
            })()}

            <View style={styles.bentoRow}>
              <HapticAction style={styles.bentoBox}>
                <View
                  style={[
                    styles.bentoIcon,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Shield size={s(18)} color={theme.colors.onSurface} />
                </View>
                <Text style={styles.bentoLabel}>Auto Claims</Text>
                <Text style={styles.bentoValue}>Enabled</Text>
              </HapticAction>
              <HapticAction style={styles.bentoBox}>
                <View
                  style={[
                    styles.bentoIcon,
                    { backgroundColor: theme.colors.background },
                  ]}
                >
                  <Timer size={s(18)} color={theme.colors.onSurface} />
                </View>
                <Text style={styles.bentoLabel}>Wait Period</Text>
                <Text style={styles.bentoValue}>24 Hours</Text>
              </HapticAction>
            </View>

            {/* Total Amount Summary */}
            {(() => {
              const selectedPlan = currentPlans.find(
                (p: any) => p.id === selectedTier,
              );
              if (selectedPlan) {
                return (
                  <View style={styles.totalSummaryBox}>
                    <View style={styles.totalSummaryRow}>
                      <Text style={styles.totalSummaryLabel}>
                        Total Weekly Premium
                      </Text>
                      <Text style={styles.totalSummaryAmount}>
                        ₹{selectedPlan.price}/wk
                      </Text>
                    </View>
                    {(selectedPlan as any)?.base_price && (
                      <Text style={styles.totalSummaryBreakdown}>
                        Base: ₹{(selectedPlan as any).base_price} + Disruption:
                        ₹{(selectedPlan as any).additional_price || 0}
                      </Text>
                    )}
                  </View>
                );
              }
              return null;
            })()}

            <View style={styles.actionSection}>
              <HapticAction
                style={styles.primaryButton}
                onPress={handleActivate}
                disabled={activating}
                hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
              >
                {activating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Proceed to Pay • {selectedTier}
                  </Text>
                )}
              </HapticAction>
            </View>
          </>
        )}

        <View style={{ height: vs(120) }} />
      </ScrollView>
    </View>
  );
}

const TierCarouselCard = ({ item, index, scrollX, selected }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.91, 1, 0.91],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.76, 1, 0.76],
      Extrapolate.CLAMP,
    );

    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [SIDE_TRANSLATE, 0, -SIDE_TRANSLATE],
      Extrapolate.CLAMP,
    );

    const zIndex = interpolate(
      scrollX.value,
      inputRange,
      [1, 10, 1],
      Extrapolate.CLAMP,
    );

    return {
      transform: [{ scale }, { translateX }],
      opacity,
      zIndex: Math.round(zIndex),
    };
  });

  const Icon = item.icon;

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <View style={[styles.tierCardInner, selected && styles.tierCardActive]}>
        {item.recommended && (
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>Recommended</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: selected
                  ? theme.colors.primaryLight
                  : theme.colors.background,
              },
            ]}
          >
            <Icon
              color={
                selected ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              size={s(24)}
            />
          </View>
          <Text style={styles.tierTitle}>{item.title}</Text>
          <Text style={styles.tierSub}>{item.subtitle}</Text>
        </View>

        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>₹</Text>
            <Text style={styles.priceAmount}>{item.price}</Text>
            <Text style={styles.pricePeriod}>/wk</Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          <FeatureRow text="Auto-payouts" />
          <FeatureRow text="Live Monitoring" />
        </View>
      </View>
    </Animated.View>
  );
};

const FeatureRow = ({ text }: { text: string }) => (
  <View style={styles.featureRow}>
    <CheckCircle2 size={s(12)} color={theme.colors.success} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: vs(110),
  },
  editorialHeader: {
    marginBottom: vs(24),
    paddingHorizontal: s(24),
  },
  pageTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: ms(32),
    color: theme.colors.onSurface,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: ms(16),
    color: theme.colors.onSurfaceVariant,
    marginTop: vs(4),
  },
  carouselSection: {
    marginTop: vs(16),
    marginBottom: vs(24),
  },
  carouselWrapper: {
    overflow: "visible",
  },
  sectionHeader: {
    fontFamily: "Inter_700Bold",
    fontSize: ms(11),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: vs(12),
    paddingHorizontal: s(24),
  },
  carouselContainer: {
    paddingHorizontal: SPACER_WIDTH,
    paddingVertical: vs(28),
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_GAP / 2,
  },
  tierCardInner: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(28),
    padding: s(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    minHeight: vs(320),
    justifyContent: "space-between",
    shadowColor: "#0B3128",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0,
    shadowRadius: 16,
    elevation: 0,
  },
  tierCardActive: {
    borderColor: "#1F7A63",
    borderWidth: 1.8,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  recommendedBadge: {
    position: "absolute",
    top: vs(16),
    right: s(20),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(6),
  },
  recommendedText: {
    fontFamily: "Inter_700Bold",
    fontSize: ms(8),
    color: "#FFFFFF",
  },
  cardHeader: {
    alignItems: "center",
  },
  iconContainer: {
    width: s(52),
    height: s(52),
    borderRadius: s(16),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(12),
  },
  tierTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: ms(22),
    color: theme.colors.onSurface,
  },
  tierSub: {
    fontFamily: "Inter_500Medium",
    fontSize: ms(13),
    color: theme.colors.onSurfaceVariant,
    marginTop: vs(2),
  },
  priceSection: {
    alignItems: "center",
    marginVertical: vs(16),
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceSymbol: {
    fontFamily: "Inter_600SemiBold",
    fontSize: ms(16),
    color: theme.colors.onSurface,
  },
  priceAmount: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: ms(36),
    color: theme.colors.onSurface,
  },
  pricePeriod: {
    fontFamily: "Inter_600SemiBold",
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
  },
  aiReasonBox: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    padding: s(12),
    borderRadius: s(8),
    alignItems: "center",
    gap: s(12),
  },
  unifiedAdditionalBox: { paddingHorizontal: s(24), marginBottom: vs(24) },
  aiReasonTextContainer: { flex: 1, gap: vs(2) },
  aiAdditionalAmountText: {
    fontFamily: "Inter_700Bold",
    fontSize: ms(13),
    color: "#B45309",
  },
  aiReasonText: {
    fontFamily: "Inter_500Medium",
    fontSize: ms(12),
    color: "#92400E",
  },
  featuresList: {
    gap: vs(8),
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: vs(16),
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  featureText: {
    fontFamily: "Inter_500Medium",
    fontSize: ms(12),
    color: theme.colors.onSurface,
  },
  bentoRow: {
    flexDirection: "row",
    gap: s(12),
    marginBottom: vs(24),
    paddingHorizontal: s(24),
  },
  bentoBox: {
    flex: 1,
    backgroundColor: theme.colors.elevated,
    padding: s(16),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  bentoIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(8),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(10),
  },
  bentoLabel: {
    fontFamily: "Manrope_700Bold",
    fontSize: ms(13),
    color: theme.colors.onSurfaceVariant,
    marginBottom: vs(2),
  },
  bentoValue: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: ms(16),
    color: theme.colors.onSurface,
  },
  actionSection: {
    marginBottom: vs(40),
    paddingHorizontal: s(24),
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: vs(60),
    borderRadius: s(16),
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: ms(16),
    color: "#FFFFFF",
  },
  swipeHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
    marginBottom: vs(24),
    opacity: 0.6,
  },
  swipeHintText: {
    fontFamily: "Inter_500Medium",
    fontSize: ms(12),
    color: theme.colors.outline,
  },
  activeCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: s(24),
    padding: s(24),
    borderRadius: s(24),
    borderWidth: 2,
    borderColor: theme.colors.success + "40",
  },
  activeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(24),
    gap: s(12),
  },
  activeTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: ms(22),
    color: theme.colors.success,
  },
  activeDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(12),
  },
  activeDetailLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: ms(15),
    color: theme.colors.onSurfaceVariant,
  },
  activeDetailValue: {
    fontFamily: "Manrope_700Bold",
    fontSize: ms(16),
    color: theme.colors.onSurface,
  },
  totalSummaryBox: {
    marginHorizontal: s(24),
    marginBottom: vs(16),
    backgroundColor: theme.colors.surface,
    borderRadius: s(16),
    padding: s(16),
    borderWidth: 1,
    borderColor: theme.colors.primary + "30",
  },
  totalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalSummaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
  },
  totalSummaryAmount: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: ms(20),
    color: theme.colors.primary,
  },
  totalSummaryBreakdown: {
    fontFamily: "Inter_500Medium",
    fontSize: ms(12),
    color: theme.colors.outline,
    marginTop: vs(4),
  },
});
