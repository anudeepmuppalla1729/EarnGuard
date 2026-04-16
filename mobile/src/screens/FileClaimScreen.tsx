import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Platform,
  KeyboardAvoidingView, Alert,
} from 'react-native';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import {
  ChevronLeft, CloudRain, Waves, TrafficCone, Users, Zap,
  Clock, FileText, Send, CheckCircle, XCircle, ChevronDown,
} from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown, FadeIn, SlideInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useClaimsStore } from '../store/claimsStore';
// import { v4 as uuidv4 } from 'uuid'; // Removed to avoid RN dependency issues
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// ── Disruption Types ─────────────────────────────────────────────────────────

const DISRUPTION_TYPES = [
  { key: 'HEAVY_RAIN', label: 'Heavy Rain', icon: CloudRain, color: '#3B82F6' },
  { key: 'FLOOD', label: 'Flood', icon: Waves, color: '#06B6D4' },
  { key: 'TRAFFIC_CONGESTION', label: 'Traffic Congestion', icon: TrafficCone, color: '#F59E0B' },
  { key: 'SOCIAL_DISRUPTION', label: 'Social Disruption', icon: Users, color: '#EF4444' },
  { key: 'PLATFORM_OUTAGE', label: 'Platform Outage', icon: Zap, color: '#8B5CF6' },
];

// ── Time Helpers ─────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function roundToNearest15(date: Date): Date {
  const d = new Date(date);
  const mins = d.getMinutes();
  d.setMinutes(Math.floor(mins / 15) * 15, 0, 0);
  return d;
}

function adjustTime(date: Date, deltaMinutes: number): Date {
  return new Date(date.getTime() + deltaMinutes * 60 * 1000);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FileClaimScreen() {
  const navigation = useNavigation<any>();
  const isSubmitting = useClaimsStore(s => s.isSubmitting);
  const submitManualClaim = useClaimsStore(s => s.submitManualClaim);

  // Form state
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(() => roundToNearest15(adjustTime(new Date(), -60)));
  const [endTime, setEndTime] = useState(() => roundToNearest15(new Date()));
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [result, setResult] = useState<any>(null);

  const maxChars = 200;

  const canSubmit = selectedType && note.trim().length > 0 && !isSubmitting;
  
  console.log('[FileClaim] State:', { selectedType, noteLength: note.trim().length, isSubmitting, canSubmit });

  const handleTypeSelect = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(key);
  };

  const handleAdjustStart = (delta: number) => {
    Haptics.selectionAsync();
    const newStart = adjustTime(startTime, delta);
    // Don't allow start to be after end
    if (newStart < endTime) {
      setStartTime(newStart);
    }
  };

  const handleAdjustEnd = (delta: number) => {
    Haptics.selectionAsync();
    const newEnd = adjustTime(endTime, delta);
    // Don't allow end to be before start, and max 2hr window
    if (newEnd > startTime) {
      const diffHours = (newEnd.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      if (diffHours <= 2) {
        setEndTime(newEnd);
      }
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!selectedType) Alert.alert('Missing Selection', 'Please select a disruption type.');
      else if (note.trim().length === 0) Alert.alert('Missing Note', 'Please provide a short description of the disruption.');
      return;
    }
    
    console.log('[FileClaim] Submitting claim...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const res = await submitManualClaim({
      disruptionType: selectedType!,
      timeframeStart: startTime.toISOString(),
      timeframeEnd: endTime.toISOString(),
      note: note.trim(),
      clientRequestId: generateId(),
    });

    console.log('[FileClaim] Submit result:', res);

    if (res.success && res.claim) {
      setResult(res.claim);
      setStep('result');
      Haptics.notificationAsync(
        res.claim.status === 'APPROVED'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    } else {
      Alert.alert('Claim Failed', res.error || 'Something went wrong. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const diffMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000));

  // ── Result View ────────────────────────────────────────────────────────────

  if (step === 'result' && result) {
    const isApproved = result.status === 'APPROVED';
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.resultContainer}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.resultContent}>
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={[
              styles.resultIconCircle,
              { backgroundColor: isApproved ? theme.colors.successLight : theme.colors.errorLight },
            ]}>
              {isApproved
                ? <CheckCircle size={s(48)} color={theme.colors.success} />
                : <XCircle size={s(48)} color={theme.colors.error} />
              }
            </Animated.View>

            <Animated.Text entering={FadeInUp.delay(300).duration(400)} style={styles.resultTitle}>
              {isApproved ? 'Claim Approved!' : 'Claim Rejected'}
            </Animated.Text>

            <Animated.Text entering={FadeInUp.delay(400).duration(400)} style={styles.resultSubtitle}>
              {isApproved
                ? `₹${result.payoutAmount.toFixed(2)} has been credited to your wallet`
                : result.rejectionReason || 'Risk score below threshold for the reported timeframe'
              }
            </Animated.Text>

            <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Risk Score</Text>
                <Text style={[styles.resultValue, {
                  color: isApproved ? theme.colors.success : theme.colors.error,
                }]}>{(result.riskScore * 100).toFixed(0)}%</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Status</Text>
                <View style={[styles.resultBadge, {
                  backgroundColor: isApproved ? theme.colors.successLight : theme.colors.errorLight,
                }]}>
                  <Text style={[styles.resultBadgeText, {
                    color: isApproved ? theme.colors.success : theme.colors.error,
                  }]}>{result.status}</Text>
                </View>
              </View>
              {isApproved && (
                <>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Payout</Text>
                    <Text style={[styles.resultValue, { color: theme.colors.success }]}>
                      ₹{result.payoutAmount.toFixed(2)}
                    </Text>
                  </View>
                </>
              )}
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(600).duration(400)} style={{ width: '100%' }}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.goBack();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.doneButtonText}>Back to Claims</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Form View ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.goBack(); }}
            style={styles.backBtn}
          >
            <ChevronLeft size={s(24)} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>File a Claim</Text>
          <View style={{ width: s(40) }} />
        </Animated.View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section 1: Disruption Type */}
          <Animated.View entering={FadeInUp.delay(100).duration(300)}>
            <Text style={styles.sectionTitle}>What happened?</Text>
            <Text style={styles.sectionSubtitle}>Select the type of disruption you experienced</Text>

            <View style={styles.typeGrid}>
              {DISRUPTION_TYPES.map((type, i) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.key;
                return (
                  <Animated.View key={type.key} entering={SlideInRight.delay(100 + i * 50).duration(250)}>
                    <TouchableOpacity
                      style={[
                        styles.typeCard,
                        isSelected && { borderColor: type.color, backgroundColor: type.color + '12' },
                      ]}
                      onPress={() => handleTypeSelect(type.key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.typeIconCircle, { backgroundColor: type.color + '18' }]}>
                        <Icon size={s(20)} color={type.color} />
                      </View>
                      <Text style={[
                        styles.typeLabel,
                        isSelected && { color: theme.colors.onSurface, fontFamily: 'Inter_600SemiBold' },
                      ]}>{type.label}</Text>
                      {isSelected && (
                        <View style={[styles.selectedDot, { backgroundColor: type.color }]} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Section 2: Timeframe */}
          <Animated.View entering={FadeInUp.delay(200).duration(300)}>
            <Text style={styles.sectionTitle}>When did it happen?</Text>
            <Text style={styles.sectionSubtitle}>Specify the timeframe (max 2 hours)</Text>

            <View style={styles.timeContainer}>
              <View style={styles.timeBlock}>
                <Text style={styles.timeBlockLabel}>From</Text>
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.timeAdjustBtn}
                    onPress={() => handleAdjustStart(-15)}
                  >
                    <Text style={styles.timeAdjustText}>−15m</Text>
                  </TouchableOpacity>
                  <View style={styles.timeDisplay}>
                    <Clock size={s(14)} color={theme.colors.primary} />
                    <Text style={styles.timeText}>{formatTime(startTime)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.timeAdjustBtn}
                    onPress={() => handleAdjustStart(15)}
                  >
                    <Text style={styles.timeAdjustText}>+15m</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeDateText}>{formatDateShort(startTime)}</Text>
              </View>

              <View style={styles.timeDividerVertical}>
                <View style={styles.timeDividerLine} />
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{diffMinutes}m</Text>
                </View>
                <View style={styles.timeDividerLine} />
              </View>

              <View style={styles.timeBlock}>
                <Text style={styles.timeBlockLabel}>To</Text>
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={styles.timeAdjustBtn}
                    onPress={() => handleAdjustEnd(-15)}
                  >
                    <Text style={styles.timeAdjustText}>−15m</Text>
                  </TouchableOpacity>
                  <View style={styles.timeDisplay}>
                    <Clock size={s(14)} color={theme.colors.primary} />
                    <Text style={styles.timeText}>{formatTime(endTime)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.timeAdjustBtn}
                    onPress={() => handleAdjustEnd(15)}
                  >
                    <Text style={styles.timeAdjustText}>+15m</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeDateText}>{formatDateShort(endTime)}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Section 3: Note */}
          <Animated.View entering={FadeInUp.delay(300).duration(300)}>
            <Text style={styles.sectionTitle}>Describe the disruption</Text>
            <Text style={styles.sectionSubtitle}>Provide a brief description of what happened</Text>

            <View style={styles.noteContainer}>
              <View style={styles.noteIconRow}>
                <FileText size={s(16)} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.noteCharCount}>{note.length}/{maxChars}</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="E.g., Heavy waterlogging on main delivery route near Madhapur junction. Unable to fulfill orders for ~1 hour..."
                placeholderTextColor={theme.colors.outline}
                multiline
                maxLength={maxChars}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.delay(400).duration(300)} style={styles.submitContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={s(18)} color="#FFFFFF" />
                  <Text style={styles.submitText}>Submit Claim</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Your claim will be verified against zone disruption data for the specified timeframe. 
              Fraudulent claims may result in policy suspension.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(18),
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: s(20),
    paddingTop: vs(24),
    paddingBottom: vs(40),
  },
  sectionTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(20),
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: vs(4),
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(13),
    color: theme.colors.onSurfaceVariant,
    marginBottom: vs(16),
  },
  // Type selection
  typeGrid: {
    gap: vs(10),
    marginBottom: vs(32),
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    backgroundColor: theme.colors.surface,
    borderRadius: s(16),
    borderWidth: 1.5,
    borderColor: theme.colors.divider,
    gap: s(12),
  },
  typeIconCircle: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(15),
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  selectedDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
  },
  // Time picker
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: s(16),
    marginBottom: vs(32),
    gap: s(8),
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
    gap: vs(8),
  },
  timeBlockLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: ms(11),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  timeAdjustBtn: {
    paddingHorizontal: s(8),
    paddingVertical: vs(6),
    backgroundColor: theme.colors.elevated,
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  timeAdjustText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: ms(10),
    color: theme.colors.primary,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(8),
    paddingVertical: vs(6),
    backgroundColor: theme.colors.primaryLight,
    borderRadius: s(8),
  },
  timeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(13),
    color: theme.colors.primary,
  },
  timeDateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(11),
    color: theme.colors.outline,
  },
  timeDividerVertical: {
    alignItems: 'center',
    gap: vs(4),
    width: s(36),
  },
  timeDividerLine: {
    width: 1,
    height: vs(16),
    backgroundColor: theme.colors.divider,
  },
  durationBadge: {
    backgroundColor: theme.colors.warningLight,
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(6),
  },
  durationText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(10),
    color: theme.colors.warning,
  },
  // Note input
  noteContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: s(16),
    marginBottom: vs(32),
  },
  noteIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  noteCharCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(11),
    color: theme.colors.outline,
  },
  noteInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(14),
    color: theme.colors.onSurface,
    minHeight: vs(100),
    lineHeight: ms(20),
  },
  // Submit
  submitContainer: {
    gap: vs(12),
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    backgroundColor: theme.colors.primary,
    paddingVertical: vs(16),
    borderRadius: s(16),
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.outline,
    opacity: 0.5,
  },
  submitText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(16),
    color: '#FFFFFF',
  },
  disclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(11),
    color: theme.colors.outline,
    textAlign: 'center',
    lineHeight: ms(16),
    paddingHorizontal: s(16),
  },
  // Result screen
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(32),
  },
  resultContent: {
    alignItems: 'center',
    gap: vs(20),
    width: '100%',
  },
  resultIconCircle: {
    width: s(96),
    height: s(96),
    borderRadius: s(48),
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(28),
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
  },
  resultSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: ms(20),
    maxWidth: s(280),
  },
  resultDetails: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    padding: s(20),
    gap: vs(12),
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
  },
  resultValue: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(18),
  },
  resultDivider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  resultBadge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(8),
  },
  resultBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(11),
    letterSpacing: 0.5,
  },
  doneButton: {
    backgroundColor: theme.colors.onSurface,
    paddingVertical: vs(16),
    borderRadius: s(16),
    alignItems: 'center',
    marginTop: vs(8),
  },
  doneButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(16),
    color: '#FFFFFF',
  },
});
