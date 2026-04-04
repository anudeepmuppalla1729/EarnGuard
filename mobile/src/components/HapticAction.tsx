import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming 
} from 'react-native-reanimated';

interface HapticActionProps extends TouchableOpacityProps {
  children: React.ReactNode;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  scaleTo?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const HapticAction = ({ 
  children, 
  hapticStyle = Haptics.ImpactFeedbackStyle.Light, 
  scaleTo = 0.97,
  onPress,
  style,
  ...props 
}: HapticActionProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(scaleTo, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const handlePress = (e: any) => {
    Haptics.impactAsync(hapticStyle);
    onPress?.(e);
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[style, animatedStyle]}
      {...props}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
};
