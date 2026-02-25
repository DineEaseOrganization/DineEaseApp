/**
 * DineEase Design System â€” Typography
 *
 * All text: Inter (sans-serif, readable, compact)
 */

import { rf } from './responsive';

export const FontFamily = {
  // Display / Headings â€” Inter Bold for strong hierarchy
  displayRegular: 'Inter_400Regular',
  displayBold: 'Inter_700Bold',
  displayItalic: 'Inter_400Regular',
  displayBoldItalic: 'Inter_700Bold',

  // Inter variants
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const FontSize = {
  xs: rf(11),
  sm: rf(12),
  base: rf(14),
  md: rf(15),
  lg: rf(16),
  xl: rf(18),
  '2xl': rf(20),
  '3xl': rf(24),
  '4xl': rf(28),
  '5xl': rf(32),
  '6xl': rf(38),
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 1.5,
} as const;

/**
 * Pre-composed text styles â€” use these directly in StyleSheet.create()
 */
export const TextStyles = {
  // Display (Merriweather) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  hero: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['6xl'],
    letterSpacing: LetterSpacing.tight,
  },
  h1: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['5xl'],
    letterSpacing: LetterSpacing.tight,
  },
  h2: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['4xl'],
    letterSpacing: LetterSpacing.tight,
  },
  h3: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['3xl'],
    letterSpacing: LetterSpacing.tight,
  },
  restaurantName: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize['2xl'],
    letterSpacing: LetterSpacing.tight,
  },
  cardTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    letterSpacing: LetterSpacing.tight,
  },
  sectionTitle: {
    fontFamily: FontFamily.displayBold,
    fontSize: FontSize.xl,
    letterSpacing: LetterSpacing.tight,
  },

  // Body (Inter) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.lg,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
  },
  bodySemiBold: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
  },
  label: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    letterSpacing: LetterSpacing.wide,
  },
  labelUppercase: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
  },
  captionMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
  },
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    letterSpacing: LetterSpacing.wide,
  },
  buttonLarge: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    letterSpacing: LetterSpacing.wide,
  },
  buttonSmall: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.sm,
    letterSpacing: LetterSpacing.wide,
  },
} as const;
