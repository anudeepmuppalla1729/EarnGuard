import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { s, vs, ms } from '../../theme/responsive';
import { ChevronLeft, ShieldCheck, Zap, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function PolicySelectionScreen() {
  const navigation = useNavigation<any>();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const res = await apiClient.policies.quote();
      setQuotes(res.quotes);
      // Select standard by default
      const standard = res.quotes.find((q: any) => q.tier === 'STANDARD');
      if (standard) setSelectedPolicyId(standard.policyId);
    } catch (e: any) {
       Alert.alert('Quotes Failed', e?.error?.message || 'Could not fetch policies.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedPolicyId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActivating(true);
    try {
      await apiClient.policies.activate(selectedPolicyId, `init-${selectedPolicyId}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('TwoFactorAuth'); // Flow forwards
    } catch (e: any) {
      Alert.alert('Activation Failed', e?.error?.message || 'Please try again.');
      setActivating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.stepText}>Step 5 of 5</Text>
        <Text style={styles.title}>Choose Your Protection</Text>
        <Text style={styles.subtitle}>Select the AI-driven premium tier that best fits your risk profile.</Text>

        {loading ? (
             <View style={styles.centerBox}>
                 <ActivityIndicator size="large" color={theme.colors.primary} />
                 <Text style={styles.loadingText}>Generating intelligent quotes...</Text>
             </View>
        ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
               {quotes.map((quote) => {
                 const isSelected = selectedPolicyId === quote.policyId;
                 return (
                   <TouchableOpacity 
                     key={quote.policyId}
                     style={[styles.quoteCard, isSelected && styles.quoteCardSelected]}
                     onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedPolicyId(quote.policyId);
                     }}
                     activeOpacity={0.9}
                   >
                     <View style={styles.tierHeader}>
                       <Text style={[styles.tierName, isSelected && {color: theme.colors.primary}]}>{quote.tier}</Text>
                       {quote.tier === 'STANDARD' && (
                         <View style={styles.recommendedBadge}>
                           <Text style={styles.recommendedText}>AI Recommended</Text>
                         </View>
                       )}
                     </View>

                     <View style={styles.priceRow}>
                        <Text style={styles.premiumAmount}>₹{quote.premium_amount}</Text>
                        <Text style={styles.premiumSub}>/week</Text>
                     </View>

                     <View style={styles.divider} />

                     <View style={styles.benefitRow}>
                       <ShieldCheck size={16} color={theme.colors.primary} />
                       <Text style={styles.benefitText}>Coverage upto ₹{quote.max_payout}</Text>
                     </View>

                     {quote.tier === 'STANDARD' && quote.reason && (
                        <View style={styles.aiReasonBox}>
                          <Zap size={14} color="#F59E0B" />
                          <Text style={styles.aiReasonText}>{quote.reason}</Text>
                        </View>
                     )}
                   </TouchableOpacity>
                 );
               })}
            </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryButton, (!selectedPolicyId || activating) && styles.primaryButtonDisabled]} 
            onPress={handleActivate}
            disabled={!selectedPolicyId || activating}
            activeOpacity={0.9}
          >
            {activating ? (
                <ActivityIndicator color="#FFF" />
            ) : (
                <Text style={styles.primaryButtonText}>Activate & Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, paddingHorizontal: s(24), paddingTop: vs(16) },
  stepText: { fontFamily: 'Inter_600SemiBold', fontSize: ms(12), color: theme.colors.outline, textTransform: 'uppercase', marginBottom: vs(8) },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: ms(28), color: theme.colors.onSurface, letterSpacing: -0.5, marginBottom: vs(12) },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: ms(15), color: theme.colors.onSurfaceVariant, marginBottom: vs(24), lineHeight: ms(22) },
  
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'Inter_500Medium', fontSize: ms(16), color: theme.colors.onSurfaceVariant, marginTop: vs(16) },
  
  scrollContent: { paddingBottom: vs(20), gap: vs(16) },
  
  quoteCard: { padding: s(20), borderRadius: s(16), backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.divider },
  quoteCardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '0A' },
  
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vs(8) },
  tierName: { fontFamily: 'Inter_700Bold', fontSize: ms(14), color: theme.colors.onSurfaceVariant, letterSpacing: 1 },
  recommendedBadge: { backgroundColor: theme.colors.primary + '20', paddingHorizontal: s(8), paddingVertical: vs(4), borderRadius: s(8) },
  recommendedText: { fontFamily: 'Inter_600SemiBold', fontSize: ms(10), color: theme.colors.primary },
  
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: vs(12) },
  premiumAmount: { fontFamily: 'Manrope_800ExtraBold', fontSize: ms(32), color: theme.colors.onSurface, letterSpacing: -1 },
  premiumSub: { fontFamily: 'Inter_500Medium', fontSize: ms(14), color: theme.colors.outline, marginLeft: s(4) },
  
  divider: { height: 1, backgroundColor: theme.colors.divider, marginVertical: vs(12) },
  
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(8), gap: s(8) },
  benefitText: { fontFamily: 'Inter_500Medium', fontSize: ms(14), color: theme.colors.onSurface },
  
  aiReasonBox: { flexDirection: 'row', backgroundColor: '#FFFBEB', padding: s(12), borderRadius: s(8), marginTop: vs(8), alignItems: 'center', gap: s(8) },
  aiReasonText: { fontFamily: 'Inter_500Medium', fontSize: ms(12), color: '#92400E', flex: 1 },

  footer: { paddingBottom: vs(40), paddingTop: vs(16) },
  primaryButton: { backgroundColor: theme.colors.primary, height: vs(60), borderRadius: s(16), justifyContent: 'center', alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#FFFFFF', fontSize: ms(16), fontFamily: 'Inter_700Bold' },
});
