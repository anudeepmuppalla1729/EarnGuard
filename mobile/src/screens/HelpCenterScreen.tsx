import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { ChevronLeft, Search, Shield, CreditCard, FileText, MessageCircle, Mail, ChevronRight, HelpCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { HapticAction } from '../components/HapticAction';

export default function HelpCenterScreen() {
  const navigation = useNavigation();

  const handleCategoryPress = (category: string) => {
    // Handled by HapticAction implicitly or can add extra logic here
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <HapticAction style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={s(22)} color={theme.colors.onSurface} />
        </HapticAction>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>How can we help?</Text>
          <Text style={styles.subtitle}>
            Search our guides or contact support.
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Search size={s(18)} color={theme.colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor={theme.colors.outline}
          />
        </View>

        <View style={styles.categoriesGrid}>
          <CategoryCard 
            title="Account" 
            desc="Security & login" 
            onPress={() => handleCategoryPress('Account')}
            icon={<Shield size={s(22)} color={theme.colors.primary} />}
            bgColor={theme.colors.primaryLight}
          />
          <CategoryCard 
            title="Claims" 
            desc="Status & payouts" 
            onPress={() => handleCategoryPress('Claims')}
            icon={<CreditCard size={s(22)} color={theme.colors.success} />}
            bgColor={theme.colors.successLight}
          />
          <CategoryCard 
            title="Policy" 
            desc="Limits & terms" 
            onPress={() => handleCategoryPress('Policies')}
            icon={<FileText size={s(22)} color={theme.colors.warning} />}
            bgColor={theme.colors.warningLight}
          />
          <CategoryCard 
            title="General" 
            desc="Platform guides" 
            onPress={() => handleCategoryPress('General')}
            icon={<HelpCircle size={s(22)} color={theme.colors.onSurfaceVariant} />}
            bgColor={theme.colors.background}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRENDING TOPICS</Text>
          <View style={styles.trendingCard}>
            <TrendingItem title="Link a business account" />
            <View style={styles.divider} />
            <TrendingItem title="Understanding payouts" />
            <View style={styles.divider} />
            <TrendingItem title="Fraud protection limits" />
          </View>
        </View>

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Still need help?</Text>
          <Text style={styles.supportDesc}>
            Our support team is available 24/7 for premium members.
          </Text>
          <View style={styles.supportActions}>
            <HapticAction style={styles.chatButton} hapticStyle={Haptics.ImpactFeedbackStyle.Medium}>
              <MessageCircle size={s(18)} color="#FFFFFF" />
              <Text style={styles.chatButtonText}>Live Chat</Text>
            </HapticAction>
            <HapticAction style={styles.emailButton}>
              <Mail size={s(18)} color={theme.colors.onSurface} />
              <Text style={styles.emailButtonText}>Email Us</Text>
            </HapticAction>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CategoryCard = ({ title, desc, icon, bgColor, onPress }: any) => (
  <HapticAction onPress={onPress} style={styles.categoryCard}>
    <View style={[styles.categoryIconBox, { backgroundColor: bgColor }]}>
      {icon}
    </View>
    <Text style={styles.categoryTitle}>{title}</Text>
    <Text style={styles.categoryDesc}>{desc}</Text>
  </HapticAction>
);

const TrendingItem = ({ title }: { title: string }) => (
  <HapticAction style={styles.trendingItem}>
    <Text style={styles.trendingText}>{title}</Text>
    <ChevronRight size={s(16)} color={theme.colors.divider} />
  </HapticAction>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    height: vs(64),
  },
  backButton: {
    width: s(40),
    height: s(40),
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(17),
    color: theme.colors.onSurface,
  },
  placeholder: {
    width: s(40),
  },
  content: {
    paddingHorizontal: s(24),
    paddingBottom: vs(40),
  },
  hero: {
    marginTop: vs(24),
    marginBottom: vs(32),
  },
  title: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(32),
    color: theme.colors.onSurface,
    letterSpacing: -1,
    marginBottom: vs(4),
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(16),
    color: theme.colors.onSurfaceVariant,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: s(16),
    height: vs(56),
    paddingHorizontal: s(16),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: vs(32),
  },
  searchIcon: {
    marginRight: s(12),
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_500Medium',
    fontSize: ms(15),
    color: theme.colors.onSurface,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(12),
    marginBottom: vs(32),
  },
  categoryCard: {
    width: (Dimensions.get('window').width - s(48) - s(12)) / 2,
    backgroundColor: theme.colors.surface,
    borderRadius: s(24),
    padding: s(20),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  categoryIconBox: {
    width: s(40),
    height: s(40),
    borderRadius: s(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  categoryTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(15),
    color: theme.colors.onSurface,
    marginBottom: vs(2),
  },
  categoryDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: ms(12),
    color: theme.colors.onSurfaceVariant,
  },
  section: {
    marginBottom: vs(32),
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: ms(10),
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: vs(12),
    marginLeft: s(4),
  },
  trendingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(24),
    borderWidth: 1,
    borderColor: theme.colors.divider,
    overflow: 'hidden',
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s(20),
  },
  trendingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(14),
    color: theme.colors.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginHorizontal: s(20),
  },
  supportCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: s(28),
    padding: s(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  supportTitle: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(20),
    color: theme.colors.onSurface,
    marginBottom: vs(8),
  },
  supportDesc: {
    fontFamily: 'Inter_500Medium',
    fontSize: ms(14),
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: vs(24),
    lineHeight: ms(20),
  },
  supportActions: {
    width: '100%',
    gap: s(12),
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: vs(56),
    borderRadius: s(14),
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(10),
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: ms(15),
  },
  emailButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    height: vs(56),
    borderRadius: s(14),
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(10),
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  emailButtonText: {
    color: theme.colors.onSurface,
    fontFamily: 'Inter_700Bold',
    fontSize: ms(15),
  },
});
