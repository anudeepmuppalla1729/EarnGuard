import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions from a standard iPhone 13/14 design (390x844)
const baseWidth = 390;
const baseHeight = 844;

const scale = SCREEN_WIDTH / baseWidth;

export function normalize(size: number) {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

export const s = (size: number) => normalize(size);
export const vs = (size: number) => (SCREEN_HEIGHT / baseHeight) * size;
export const ms = (size: number, factor = 0.5) => size + (normalize(size) - size) * factor;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
