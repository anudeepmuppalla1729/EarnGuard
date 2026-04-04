import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { ShieldCheck, RefreshCw, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

export default function TwoFactorAuthScreen() {
  const navigation = useNavigation<any>();
  const verifyOtp = useAuthStore(s => s.verifyOtp);
  const isLoading = useAuthStore(s => s.isLoading);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleInputChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }
    
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text !== '' && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code');
      return;
    }
    const success = await verifyOtp(fullCode);
    if (success) {
      navigation.navigate('BiometricSetup');
    } else {
      Alert.alert('Verification Failed', 'Invalid code. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <ShieldCheck size={s(32)} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>Verification</Text>
              <Text style={styles.subtitle}>Enter the 6-digit code sent to your phone</Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.codeRow}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputs.current[index] = ref; }}
                    style={styles.codeInput}
                    value={digit}
                    onChangeText={(text) => handleInputChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    placeholder="•"
                    placeholderTextColor={theme.colors.outline}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleVerify}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Verify & Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendButton}>
                <RefreshCw size={s(16)} color={theme.colors.onSurface} />
                <Text style={styles.resendText}>Resend code</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.securityBadge}>
                <Lock size={s(14)} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.securityText}>SECURED ACCESS</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressStep}>STEP 2 OF 3</Text>
            <Text style={styles.progressStep}>SECURITY</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: vs(120),
    paddingBottom: vs(40),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  header: {
    alignItems: 'center',
    marginBottom: vs(48),
  },
  iconBox: {
    width: s(64),
    height: s(64),
    borderRadius: s(20),
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(28),
    color: theme.colors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: vs(12),
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(16),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: ms(24),
    maxWidth: s(280),
  },
  inputSection: {
    width: '100%',
    gap: vs(32),
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s(8),
  },
  codeInput: {
    flex: 1,
    height: vs(64),
    backgroundColor: theme.colors.surface,
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    textAlign: 'center',
    fontSize: ms(24),
    fontFamily: 'Manrope_700Bold',
    color: theme.colors.onSurface,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: vs(60),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: ms(16),
    fontFamily: 'Inter_700Bold',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: vs(8),
  },
  resendText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: ms(14),
    color: theme.colors.onSurface,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: vs(48),
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: theme.colors.surface,
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  securityText: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(9),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  progressContainer: {
    position: 'absolute',
    top: vs(64),
    left: s(24),
    right: s(24),
  },
  progressBar: {
    height: 3,
    backgroundColor: theme.colors.divider,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '66%',
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(12),
  },
  progressStep: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(9),
    color: theme.colors.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 1,
  },
});
