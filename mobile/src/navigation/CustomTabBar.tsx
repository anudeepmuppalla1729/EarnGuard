import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Shield, FileText, User } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme/theme';
import { s, vs, ms } from '../theme/responsive';

const { width } = Dimensions.get('window');

export const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={[styles.blurContainer, { paddingBottom: insets.bottom || vs(20) }]}>
        <View style={styles.tabBar}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate(route.name);
              }
            };

            const Icon = () => {
              const iconSize = s(22);
              const color = isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant;

              switch (route.name) {
                case 'Home': return <Home color={color} size={iconSize} />;
                case 'Policy': return <Shield color={color} size={iconSize} />;
                case 'Claims': return <FileText color={color} size={iconSize} />;
                case 'Profile': return <User color={color} size={iconSize} />;
                default: return <Home color={color} size={iconSize} />;
              }
            };

            return (
              <TouchableOpacity key={index} onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
                <AnimatedIconContainer isFocused={isFocused}>
                  <Icon />
                </AnimatedIconContainer>
                <Text style={[styles.label, { color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

const AnimatedIconContainer = ({ isFocused, children }: { isFocused: boolean, children: React.ReactNode }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(isFocused ? 1.1 : 1, { damping: 15, stiffness: 150 }) },
        { translateY: withSpring(isFocused ? -2 : 0, { damping: 15, stiffness: 150 }) }
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  blurContainer: {
    borderTopLeftRadius: s(32),
    borderTopRightRadius: s(32),
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: vs(12),
  },
  tabBar: {
    flexDirection: 'row',
    height: vs(64),
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(4),
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: ms(10),
    letterSpacing: 0.5,
  },
});
