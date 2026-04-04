import React, { useState, useRef, useEffect } from "react";
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
const CARD_OVERLAP = SCREEN_WIDTH * 0.08;
const SNAP_INTERVAL = CARD_WIDTH - CARD_OVERLAP;
const SPACER_WIDTH = (SCREEN_WIDTH - CARD_WIDTH) / 2 + CARD_OVERLAP / 2;
const SIDE_TRANSLATE = 8;

type PolicyTier = "BASIC" | "STANDARD" | "PREMIUM";

const PLANS = [
  {
    id: "BASIC",
    title: "Basic",
    subtitle: "1.5x Multiplier",
    price: "30",
    icon: Shield,
  },
  {
    id: "STANDARD",
    title: "Standard",
    subtitle: "2.5x Multiplier",
    price: "50",
    icon: ShieldCheck,
    recommended: true,
  },
  {
    id: "PREMIUM",
    title: "Premium",
    subtitle: "4.0x Multiplier",
    price: "80",
    icon: ShieldAlert,
  },
];

export default function PolicyScreen() {
  const [selectedTier, setSelectedTier] = useState<PolicyTier>("STANDARD");
  const [activating, setActivating] = useState(false);
  const initialIndex = PLANS.findIndex((plan) => plan.id === "STANDARD");
  const scrollX = useSharedValue(initialIndex * SNAP_INTERVAL);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initial sync to ensure Standard is centered
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * SNAP_INTERVAL,
        animated: false,
      });
    }, 100);
  }, [initialIndex]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    if (index >= 0 && index < PLANS.length) {
      const tier = PLANS[index].id as PolicyTier;
      if (tier !== selectedTier) {
        setSelectedTier(tier);
        Haptics.selectionAsync();
      }
    }
  };

  const handleActivate = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActivating(true);
    try {
      // Use a draft policy ID from quota or generate one
      const draftId = `pol-draft-${selectedTier.toLowerCase()}-${Date.now()}`;
      const success = await usePolicyStore.getState().activatePolicy(draftId);
      if (success) {
        Alert.alert("Success", `${selectedTier} Plan Activated!`);
      } else {
        Alert.alert("Error", "Activation failed");
      }
    } catch (e) {
      Alert.alert("Error", "Activation failed");
    }
    setActivating(false);
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

        <View style={styles.carouselSection}>
          <Text style={styles.sectionHeader}>SELECT YOUR PLAN</Text>

          <View style={styles.carouselWrapper}>
            <Animated.FlatList
              ref={flatListRef}
              data={PLANS}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="center"
              decelerationRate="fast"
              bounces={false}
              disableIntervalMomentum={true}
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
        </View>

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
            <Text style={styles.bentoLabel}>Max Benefit</Text>
            <Text style={styles.bentoValue}>₹15,000</Text>
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
                Confirm {selectedTier}
              </Text>
            )}
          </HapticAction>
        </View>

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

    // A small offset adds depth while keeping the motion subtle and natural.
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
    marginHorizontal: -CARD_OVERLAP / 2,
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
});
