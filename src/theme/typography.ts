/**
 * DineEase Design System — Typography
 *
 * Display / Headings: Merriweather (serif, elegant)
 * Body / UI:          Inter (sans-serif, readable)
 */

export const FontFamily = {
  // Merriweather variants
  displayRegular: 'Merriweather_400Regular',
  displayBold: 'Merriweather_700Bold',
  displayItalic: 'Merriweather_400Regular_Italic',
  displayBoldItalic: 'Merriweather_700Bold_Italic',

  // Inter variants
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 38,
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
 * Pre-composed text styles — use these directly in StyleSheet.create()
 */
export const TextStyles = {
  // Display (Merriweather) ──────────────────────────────────────────────────
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

  // Body (Inter) ────────────────────────────────────────────────────────────
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
