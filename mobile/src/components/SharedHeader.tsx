import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Menu, Bell } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

interface SharedHeaderProps {
  showNotifications?: boolean;
  showProfile?: boolean;
}

export const SharedHeader = ({ showNotifications = true, showProfile = true }: SharedHeaderProps) => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <BlurView intensity={80} tint="light" style={styles.header}>
      <SafeAreaView edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handlePress} style={styles.iconButton}>
              <Menu color={theme.colors.onSurface} size={s(22)} />
            </TouchableOpacity>
            <Text style={styles.logoText}>EarnGuard</Text>
          </View>
          <View style={styles.headerRight}>
            {showNotifications && (
              <TouchableOpacity 
                onPress={() => {
                  handlePress();
                  navigation.navigate('NotificationSettings');
                }} 
                style={styles.notificationBtn}
              >
                <Bell size={s(20)} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
            {showProfile && (
              <TouchableOpacity 
                onPress={() => {
                  handlePress();
                  navigation.navigate('Profile');
                }} 
                style={styles.profileAvatar}
              >
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHMF_6Yro9FsZbrJVergn8ZMMIHdvoSUCgcshy2cFmPVn-6FPdErqDYso6OHs5NQierhktnZRMveKs8mJUZkr6ElmoJeh_CvI4cy-wL7Q-oPI-8m6UqYO_Alp3qERJfPvVNHhBxHMjDJDXUg9-bhJ9qfjqZ_bYII8SC00Brp7zuAE_tWcclLkR63HmCk_g5jJi2Sn_EylWSlXTjNGTA4qCmSkJgqb-MyuMg2UC0Qr1xGp8paKxjon61LNnbDaFtKj3xe0ZZGUTMbU' }} 
                  style={styles.avatarImage}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
  },
  logoText: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: ms(18),
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: s(4),
  },
  notificationBtn: {
    padding: s(8),
    backgroundColor: theme.colors.surface,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  profileAvatar: {
    width: s(36),
    height: s(36),
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
