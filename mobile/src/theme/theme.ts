export const theme = {
  colors: {
    // Base
    background: '#F6F6F3',
    surface: '#FFFFFF',
    divider: '#E2E2DE',
    elevated: '#F0F0EC',
    
    // Primary Accent (Warm Orange - Confident & Grounded)
    primary: '#C05621',
    primaryPressed: '#9A4318',
    primaryHighlight: '#EA7A2F',
    primaryLight: '#FDF1E7',
    onPrimary: '#FFFFFF',

    // Success (Financial Gain - Vibrant)
    success: '#1FAA6D',
    successLight: '#E7F6EF',

    // Warning (Risk / Disruption)
    warning: '#B86B1F',
    warningLight: '#F8EEDF',

    // Error
    error: '#D14343',
    errorLight: '#FDECEC',

    // Text (High Contrast)
    onSurface: '#0B0B0C',
    onSurfaceVariant: '#5F5F5F',
    outline: '#9C9C9C',
    outlineVariant: '#E2E2DE',

    // Compatibility Mappings (Legacy)
    primaryContainer: '#C05621',
    secondary: '#0B0B0C',
    tertiary: '#B86B1F',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#FFFFFF',
    surfaceContainer: '#FFFFFF',
    surfaceContainerHigh: '#F0F0EC',
    surfaceContainerHighest: '#F6F6F3',
    onErrorContainer: '#D14343',
    errorContainer: '#FDECEC',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    default: 4,
    lg: 16,
    xl: 24,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },
  animation: {
    snappy: 200,
    standard: 350,
    editorial: 500,
    easing: 'bezier(0.33, 1, 0.68, 1)',
  },
  haptics: {
    selection: 'selection',
    light: 'light',
    medium: 'medium',
    success: 'success',
    warning: 'warning',
    error: 'error',
  },
  fonts: {
    headline: 'Manrope_700Bold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodyBold: 'Inter_600SemiBold',
    label: 'Inter_500Medium',
  }
};
