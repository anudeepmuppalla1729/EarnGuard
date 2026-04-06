import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { ChevronLeft, Building2, CheckCircle2, CreditCard } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePolicyStore } from '../store/policyStore';

const MOCK_BANKS = [
  { id: 'BANK-001', name: 'State Bank of India', accountEnding: '4521', type: 'Savings', icon: '🏦' },
  { id: 'BANK-002', name: 'HDFC Bank', accountEnding: '8734', type: 'Current', icon: '🏛️' },
  { id: 'BANK-003', name: 'ICICI Bank', accountEnding: '1290', type: 'Savings', icon: '🏦' },
  { id: 'BANK-004', name: 'Axis Bank', accountEnding: '6347', type: 'Savings', icon: '🏛️' },
];

export default function BankSelectionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { activatePolicy } = usePolicyStore();

  const { policyId, tierName, totalAmount, basePrice, additionalPrice } = route.params || {};
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    if (!selectedBank || !tierName) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing(true);

    try {
      const success = await activatePolicy(tierName);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Payment Successful',
          `₹${totalAmount} debited from ****${MOCK_BANKS.find(b => b.id === selectedBank)?.accountEnding}.\n\n${tierName} plan is now active!`,
          [{ text: 'Done', onPress: () => navigation.goBack() }],
          { cancelable: false }
        );
      } else {
        Alert.alert('Payment Failed', 'Could not process payment. Try again.');
      }
    } catch (e) {
      Alert.alert('Payment Failed', 'Something went wrong.');
    }
    setProcessing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={processing}>
          <ChevronLeft size={s(22)} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.title}>Select Payment Account</Text>
        <Text style={styles.subtitle}>Choose a bank account to pay your weekly premium.</Text>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>{tierName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Premium</Text>
            <Text style={styles.summaryValue}>₹{basePrice}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Disruption Fee</Text>
            <Text style={styles.summaryValue}>₹{additionalPrice}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{totalAmount}/week</Text>
          </View>
        </View>

        {/* Bank List */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.bankList}>
          {MOCK_BANKS.map((bank) => {
            const isSelected = selectedBank === bank.id;
            return (
              <TouchableOpacity
                key={bank.id}
                style={[styles.bankCard, isSelected && styles.bankCardSelected]}
                onPress={() => { Haptics.selectionAsync(); setSelectedBank(bank.id); }}
                activeOpacity={0.85}
              >
                <View style={styles.bankIconBox}>
                  <Text style={{ fontSize: ms(22) }}>{bank.icon}</Text>
                </View>
                <View style={styles.bankInfo}>
                  <Text style={[styles.bankName, isSelected && { color: theme.colors.primary }]}>{bank.name}</Text>
                  <Text style={styles.bankAccount}>{bank.type} ····{bank.accountEnding}</Text>
                </View>
                {isSelected && <CheckCircle2 size={s(22)} color={theme.colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Pay Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, (!selectedBank || processing) && styles.payButtonDisabled]}
            onPress={handlePay}
            disabled={!selectedBank || processing}
            activeOpacity={0.9}
          >
            {processing ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={styles.payButtonContent}>
                <CreditCard size={s(20)} color="#FFF" />
                <Text style={styles.payButtonText}>Pay ₹{totalAmount}</Text>
              </View>
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
  backButton: {
    width: s(40), height: s(40), borderRadius: s(20),
    justifyContent: 'center', alignItems: 'center', marginBottom: vs(16),
    borderWidth: 1, borderColor: theme.colors.divider, backgroundColor: theme.colors.surface,
  },
  title: { fontFamily: 'Manrope_800ExtraBold', fontSize: ms(24), color: theme.colors.onSurface, letterSpacing: -0.5, marginBottom: vs(8) },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: ms(14), color: theme.colors.onSurfaceVariant, marginBottom: vs(20), lineHeight: ms(21) },

  summaryCard: {
    backgroundColor: theme.colors.surface, borderRadius: s(20), padding: s(20),
    borderWidth: 1, borderColor: theme.colors.divider, marginBottom: vs(20),
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: vs(6) },
  summaryLabel: { fontFamily: 'Inter_500Medium', fontSize: ms(14), color: theme.colors.onSurfaceVariant },
  summaryValue: { fontFamily: 'Inter_600SemiBold', fontSize: ms(14), color: theme.colors.onSurface },
  totalLabel: { fontFamily: 'Manrope_700Bold', fontSize: ms(16), color: theme.colors.onSurface },
  totalValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: ms(18), color: theme.colors.primary },
  divider: { height: 1, backgroundColor: theme.colors.divider, marginVertical: vs(8) },

  bankList: { flex: 1 },
  bankCard: {
    flexDirection: 'row', alignItems: 'center', padding: s(16),
    borderRadius: s(16), backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.divider, marginBottom: vs(10),
  },
  bankCardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' },
  bankIconBox: {
    width: s(44), height: s(44), borderRadius: s(12),
    backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center',
    marginRight: s(14),
  },
  bankInfo: { flex: 1 },
  bankName: { fontFamily: 'Inter_600SemiBold', fontSize: ms(15), color: theme.colors.onSurface, marginBottom: vs(2) },
  bankAccount: { fontFamily: 'Inter_400Regular', fontSize: ms(12), color: theme.colors.outline },

  footer: { paddingBottom: vs(24), paddingTop: vs(12) },
  payButton: {
    backgroundColor: theme.colors.primary, height: vs(60), borderRadius: s(16),
    justifyContent: 'center', alignItems: 'center',
  },
  payButtonDisabled: { opacity: 0.45 },
  payButtonContent: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  payButtonText: { color: '#FFFFFF', fontSize: ms(17), fontFamily: 'Manrope_700Bold' },
});
