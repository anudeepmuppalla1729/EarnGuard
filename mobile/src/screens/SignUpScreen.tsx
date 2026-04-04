import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import {
  Shield, User, Mail, Smartphone, Lock, Eye, EyeOff,
  ChevronLeft, CheckCircle2, AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

// ─── Validation Rules ────────────────────────────────────────────────────────

const PHONE_RE = /^[6-9]\d{9}$/;                    // 10-digit Indian mobile
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFullName(v: string): string | null {
  if (!v.trim()) return 'Full name is required';
  if (v.trim().length < 2) return 'Name must be at least 2 characters';
  if (v.trim().length > 50) return 'Name must be under 50 characters';
  if (!/^[a-zA-Z\s'-]+$/.test(v.trim())) return 'Name can only contain letters, spaces, hyphens or apostrophes';
  return null;
}

function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email is required';
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address';
  return null;
}

function validatePhone(v: string): string | null {
  const digits = v.replace(/\D/g, '');
  if (!digits) return 'Mobile number is required';
  if (!PHONE_RE.test(digits)) return 'Enter a valid 10-digit Indian mobile number';
  return null;
}

function validatePassword(v: string): string | null {
  if (!v) return 'Password is required';
  if (v.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(v)) return 'Must contain at least one uppercase letter';
  if (!/[0-9]/.test(v)) return 'Must contain at least one number';
  return null;
}

// ─── Password strength helper ─────────────────────────────────────────────────

function getPasswordStrength(v: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!v) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: '#EF4444' };
  if (score === 2) return { level: 2, label: 'Fair', color: '#F59E0B' };
  return { level: 3, label: 'Strong', color: '#10B981' };
}

// ─── Field Hint ───────────────────────────────────────────────────────────────

function FieldHint({ error, touched, valid }: { error: string | null; touched: boolean; valid: boolean }) {
  if (!touched) return null;
  if (error) {
    return (
      <View style={hintStyles.row}>
        <AlertCircle size={s(12)} color="#EF4444" />
        <Text style={[hintStyles.text, { color: '#EF4444' }]}>{error}</Text>
      </View>
    );
  }
  if (valid) {
    return (
      <View style={hintStyles.row}>
        <CheckCircle2 size={s(12)} color="#10B981" />
        <Text style={[hintStyles.text, { color: '#10B981' }]}>Looks good</Text>
      </View>
    );
  }
  return null;
}

const hintStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: s(4), marginTop: vs(4), marginLeft: s(4) },
  text: { fontFamily: 'Inter_500Medium', fontSize: ms(11) },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const navigation = useNavigation<any>();

  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Track which fields the user has left (blurred)
  const [touched, setTouched] = useState({
    fullName: false, email: false, phone: false, password: false,
  });

  const touch = useCallback((field: keyof typeof touched) => {
    setTouched(t => ({ ...t, [field]: true }));
  }, []);

  // Compute errors
  const errors = {
    fullName: validateFullName(fullName),
    email:    validateEmail(email),
    phone:    validatePhone(phone),
    password: validatePassword(password),
  };

  const isFormValid = !errors.fullName && !errors.email && !errors.phone && !errors.password;
  const strength    = getPasswordStrength(password);

  const borderFor = (field: keyof typeof errors) => {
    if (!touched[field]) return theme.colors.divider;
    return errors[field] ? '#EF4444' : '#10B981';
  };

  const handleSignUp = () => {
    // Touch all fields to reveal any untouched errors
    setTouched({ fullName: true, email: true, phone: true, password: true });
    if (!isFormValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('PlatformSelection', {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.replace(/\D/g, ''), // send clean digits
      password,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronLeft size={s(22)} color={theme.colors.onSurface} />
          </TouchableOpacity>

          {/* Branding */}
          <View style={styles.branding}>
            <View style={styles.logoBox}>
              <Shield size={s(32)} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Smart protection for delivery partners.</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={[styles.inputWrapper, { borderColor: borderFor('fullName') }]}>
                <User size={s(18)} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E.g. Rahul Verma"
                  placeholderTextColor={theme.colors.outline}
                  value={fullName}
                  onChangeText={setFullName}
                  onBlur={() => touch('fullName')}
                  autoCapitalize="words"
                  maxLength={50}
                />
              </View>
              <FieldHint error={errors.fullName} touched={touched.fullName} valid={!errors.fullName} />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={[styles.inputWrapper, { borderColor: borderFor('email') }]}>
                <Mail size={s(18)} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => touch('email')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
              <FieldHint error={errors.email} touched={touched.email} valid={!errors.email} />
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>MOBILE NUMBER</Text>
              <View style={[styles.inputWrapper, { borderColor: borderFor('phone') }]}>
                <Smartphone size={s(18)} color={theme.colors.outline} style={styles.inputIcon} />
                <Text style={styles.dialCode}>+91</Text>
                <TextInput
                  style={[styles.input, { marginLeft: s(4) }]}
                  placeholder="98765 43210"
                  placeholderTextColor={theme.colors.outline}
                  value={phone}
                  onChangeText={v => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                  onBlur={() => touch('phone')}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <Text style={styles.charCount}>{phone.length}/10</Text>
              </View>
              <FieldHint error={errors.phone} touched={touched.phone} valid={!errors.phone} />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={[styles.inputWrapper, { borderColor: borderFor('password') }]}>
                <Lock size={s(18)} color={theme.colors.outline} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: s(48) }]}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  placeholderTextColor={theme.colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => touch('password')}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword
                    ? <EyeOff size={s(18)} color={theme.colors.outline} />
                    : <Eye size={s(18)} color={theme.colors.outline} />}
                </TouchableOpacity>
              </View>

              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: strength.level >= i ? strength.color : theme.colors.divider },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}

              <FieldHint error={errors.password} touched={touched.password} valid={!errors.password} />

              {/* Password rules checklist */}
              {touched.password && (
                <View style={styles.rulesList}>
                  <RuleItem met={password.length >= 8}       text="At least 8 characters" />
                  <RuleItem met={/[A-Z]/.test(password)}     text="One uppercase letter" />
                  <RuleItem met={/[0-9]/.test(password)}     text="One number" />
                </View>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]}
              onPress={handleSignUp}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate('Login'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerLegal}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Rule Checklist Item ──────────────────────────────────────────────────────

function RuleItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={ruleStyles.row}>
      <CheckCircle2 size={s(12)} color={met ? '#10B981' : theme.colors.outline} />
      <Text style={[ruleStyles.text, { color: met ? '#10B981' : theme.colors.outline }]}>{text}</Text>
    </View>
  );
}

const ruleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: vs(4) },
  text: { fontFamily: 'Inter_500Medium', fontSize: ms(11) },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: theme.colors.background },
  container:     { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: s(24), paddingBottom: vs(40), paddingTop: vs(16) },

  backButton: {
    width: s(40), height: s(40), borderRadius: s(20),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(16), borderWidth: 1,
    borderColor: theme.colors.divider, backgroundColor: theme.colors.surface,
  },

  branding:  { alignItems: 'center', marginBottom: vs(28) },
  logoBox: {
    width: s(64), height: s(64), borderRadius: s(20),
    backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(16), borderWidth: 1, borderColor: theme.colors.divider,
  },
  title:    { fontFamily: 'Manrope_800ExtraBold', fontSize: ms(28), color: theme.colors.onSurface, letterSpacing: -0.5, marginBottom: vs(4) },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: ms(14), color: theme.colors.onSurfaceVariant, textAlign: 'center' },

  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(28), padding: s(24),
    borderWidth: 1, borderColor: theme.colors.divider,
  },

  inputContainer: { marginBottom: vs(14) },
  label: {
    fontFamily: 'Inter_700Bold', fontSize: ms(9),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5, marginBottom: vs(6), marginLeft: s(4),
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: s(14), height: vs(56),
    paddingHorizontal: s(16), borderWidth: 1.5,
  },
  inputIcon:  { marginRight: s(10) },
  input: {
    flex: 1, height: '100%',
    fontFamily: 'Inter_500Medium', fontSize: ms(15), color: theme.colors.onSurface,
  },
  dialCode: {
    fontFamily: 'Inter_600SemiBold', fontSize: ms(15),
    color: theme.colors.onSurface, marginRight: s(4),
  },
  charCount: {
    fontFamily: 'Inter_400Regular', fontSize: ms(11),
    color: theme.colors.outline, marginLeft: s(4),
  },
  eyeIcon: { position: 'absolute', right: s(16) },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginTop: vs(8) },
  strengthBar: { flex: 1, height: vs(3), borderRadius: 2 },
  strengthLabel: { fontFamily: 'Inter_600SemiBold', fontSize: ms(11), width: s(42) },

  rulesList: { marginTop: vs(6), paddingLeft: s(2) },

  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: vs(60), borderRadius: s(16),
    justifyContent: 'center', alignItems: 'center', marginTop: vs(8),
  },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonText: { color: '#FFFFFF', fontSize: ms(16), fontFamily: 'Inter_700Bold' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: vs(20), gap: s(12) },
  line:        { flex: 1, height: 1, backgroundColor: theme.colors.divider },
  dividerText: { fontFamily: 'Inter_700Bold', fontSize: ms(10), color: theme.colors.outline },

  secondaryButton: {
    backgroundColor: theme.colors.surface,
    height: vs(60), borderRadius: s(16),
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.divider,
  },
  secondaryButtonText: { color: theme.colors.onSurface, fontSize: ms(16), fontFamily: 'Inter_700Bold' },

  footerLegal: {
    marginTop: vs(28), textAlign: 'center',
    fontFamily: 'Inter_500Medium', fontSize: ms(12),
    color: theme.colors.onSurfaceVariant, lineHeight: vs(18),
    paddingHorizontal: s(20),
  },
  legalLink: { color: theme.colors.onSurface, fontFamily: 'Inter_600SemiBold', textDecorationLine: 'underline' },
});
