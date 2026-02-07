import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Deriv's Got Talent — Vibrant "Duolingo-style" Palette
export const colors = {
  // Backgrounds
  bg: '#000000',        // AMOLED Black
  bgCard: '#121212',    // Dark grey for cards
  bgSurface: '#1E1E1E', // Slightly lighter surface
  bgInput: '#2D2D2D',
  bgOverlay: 'rgba(0, 0, 0, 0.85)',

  // Text
  textPrimary: '#FFFFFF',   // Pure White
  textSecondary: '#B0B3B8',  // Light Grey
  textMuted: '#606770',      // Muted Grey
  textGold: '#FFD700',       // Gold for readability on dark

  // Branded accents
  primary: '#FF444F',      // Deriv Coral
  primaryDark: '#D63031',  // For 3D depth
  success: '#00C853',      // Vibrant Green
  successDark: '#009624',  // For 3D depth
  warning: '#FFAB00',      // Amber
  warningDark: '#C68400',  // For 3D depth
  danger: '#FF1744',       // Bright Red
  dangerDark: '#D50000',   // For 3D depth
  accent: '#6C5CE7',       // Royal Purple
  accentDark: '#4834D4',

  // Judge Accents
  rita: '#A29BFE',
  yang: '#0984E3',
  sharpe: '#55E6C1',

  // Game / Dark Mode Palette
  gameBg: '#000000',         // Deepest Black
  gameSurface: '#121212',    // Card Surface
  gameAccent: '#FF444F',     // Deriv Red
  gameText: '#FFFFFF',       // Pure White
  gameBorder: '#333333',     // Subtle border

  // UI Elements
  border: '#333333',
  divider: '#2D2D2D',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
  round: 9999,
};

export const typography = {
  // Font Families (Pinterest-like: Poppins via Expo Google Fonts)
  fontFamily: {
    light: Platform.select({
      ios: 'Poppins_300Light',
      android: 'Poppins_300Light',
      default: 'Poppins_300Light',
    }),
    regular: Platform.select({
      ios: 'Poppins_400Regular',
      android: 'Poppins_400Regular',
      default: 'Poppins_400Regular',
    }),
    medium: Platform.select({
      ios: 'Poppins_500Medium',
      android: 'Poppins_500Medium',
      default: 'Poppins_500Medium',
    }),
    bold: Platform.select({
      ios: 'Poppins_700Bold',
      android: 'Poppins_700Bold',
      default: 'Poppins_700Bold',
    }),
    semibold: Platform.select({
      ios: 'Poppins_600SemiBold',
      android: 'Poppins_600SemiBold',
      default: 'Poppins_600SemiBold',
    }),
  },

  // Font Sizes
  fontSize: {
    header: 24,
    subheader: 18,
    body: 16,
    caption: 14,
    small: 12,
  },

  // Font Weights (X app style)
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  // X app style text styles
  textStyles: {
    // Headers
    largeTitle: {
      fontFamily: Platform.select({
        ios: 'Poppins_700Bold',
        android: 'Poppins_700Bold',
        default: 'Poppins_700Bold',
      }),
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 34,
      color: colors.textPrimary,
    },
    title1: {
      fontFamily: Platform.select({
        ios: 'Poppins_600SemiBold',
        android: 'Poppins_600SemiBold',
        default: 'Poppins_600SemiBold',
      }),
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 30,
      color: colors.textPrimary,
    },
    title2: {
      fontFamily: Platform.select({
        ios: 'Poppins_500Medium',
        android: 'Poppins_500Medium',
        default: 'Poppins_500Medium',
      }),
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 24,
      color: colors.textPrimary,
    },
    // Body
    body: {
      fontFamily: Platform.select({
        ios: 'Poppins_400Regular',
        android: 'Poppins_400Regular',
        default: 'Poppins_400Regular',
      }),
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 22,
      color: colors.textSecondary,
    },
    bodyBold: {
      fontFamily: Platform.select({
        ios: 'Poppins_600SemiBold',
        android: 'Poppins_600SemiBold',
        default: 'Poppins_600SemiBold',
      }),
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
      color: colors.textPrimary,
    },
    // Supporting text
    caption: {
      fontFamily: Platform.select({
        ios: 'Poppins_400Regular',
        android: 'Poppins_400Regular',
        default: 'Poppins_400Regular',
      }),
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 18,
      color: colors.textMuted,
    },
    captionBold: {
      fontFamily: Platform.select({
        ios: 'Poppins_600SemiBold',
        android: 'Poppins_600SemiBold',
        default: 'Poppins_600SemiBold',
      }),
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
      color: colors.textPrimary,
    },
    footnote: {
      fontFamily: Platform.select({
        ios: 'Poppins_400Regular',
        android: 'Poppins_400Regular',
        default: 'Poppins_400Regular',
      }),
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: colors.textMuted,
    },
    // UI elements
    button: {
      fontFamily: Platform.select({
        ios: 'Poppins_600SemiBold',
        android: 'Poppins_600SemiBold',
        default: 'Poppins_600SemiBold',
      }),
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
      color: colors.textPrimary,
    },
    chip: {
      fontFamily: Platform.select({
        ios: 'Poppins_500Medium',
        android: 'Poppins_500Medium',
        default: 'Poppins_500Medium',
      }),
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      color: colors.textPrimary,
    },
  },

  // Legacy shorthand styles (for backward compatibility)
  h1: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  h2: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  h3: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  micro: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
  },
  caption: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    fontWeight: '400',
    color: colors.textMuted,
  },
  button: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  chip: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    lineHeight: 14,
    color: colors.textPrimary,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
};

const isWeb = Platform.OS === 'web';

export const shadows = {
  none: isWeb
    ? { boxShadow: 'none' }
    : { shadowColor: 'transparent', elevation: 0 },
  // Duolingo-style solid offset shadows (Toy feel)
  toy: (color = colors.border) => ({
    borderBottomWidth: 4,
    borderBottomColor: color,
  }),
  card: isWeb
    ? { boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)' }
    : {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 4,
    },
  elevated: isWeb
    ? { boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.1)' }
    : {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 8,
    },
};

export const layout = {
  width,
  height,
};

// Metadata for block categories
export const blockCategoryMeta = {
  entry: {
    color: colors.success,
    dark: colors.successDark,
    label: 'Entry Signal',
    icon: 'star-circle',
    description: 'How you start your performance',
  },
  defense: {
    color: colors.danger,
    dark: colors.dangerDark,
    label: 'Safety Net',
    icon: 'heart-pulse',
    description: 'Protecting your stage presence',
  },
  sizing: {
    color: colors.warning,
    dark: colors.warningDark,
    label: 'Stage Size',
    icon: 'resize',
    description: 'How much space you take up',
  },
  utility: {
    color: colors.accent,
    dark: colors.accentDark,
    label: 'Special Effects',
    icon: 'magic-staff',
    description: 'Extra flair for your routine',
  },
};
