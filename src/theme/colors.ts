/**
 * DineEase Design System — Color Tokens
 *
 * Palette: Deep Navy + Burgundy + White (dark-first design)
 */

export const Colors = {
  // ── Brand Core ────────────────────────────────────────────────────────────
  primary: '#0f3346',       // Deep Navy — backgrounds, headers
  primaryLight: '#1a4a63',  // Lighter navy — card surfaces, elevated panels
  primaryMid: '#16405a',    // Mid navy — subtle dividers, hover states
  primaryDark: '#091f2b',   // Dark navy — deepest backgrounds

  accent: '#7a0000',        // Burgundy — CTAs, active states, highlights
  accentLight: '#9a1010',   // Lighter burgundy — hover states
  accentDark: '#5a0000',    // Dark burgundy — pressed states
  accentFaded: 'rgba(122, 0, 0, 0.15)', // Tinted background for accent areas

  // ── Neutrals ──────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  offWhite: '#F5F7F9',      // Very light background on cards
  black: '#000000',

  // ── App background ─────────────────────────────────────────────────────────
  appBackground: '#FFFFFF',             // Pure white — main screen background
  cardBackground: '#F0F4F7',            // Light navy-tinted surface — card background
  cardBorder: 'rgba(15, 51, 70, 0.10)', // Subtle navy-tinted card border

  // ── Text ──────────────────────────────────────────────────────────────────
  textPrimary: '#FFFFFF',           // Main text on dark backgrounds
  textSecondary: '#B0C4D4',         // Muted text — subtitles, captions
  textTertiary: 'rgba(176, 196, 212, 0.6)', // Very muted — disabled, placeholders
  textOnLight: '#1a2e3b',           // Text on white/cream card backgrounds
  textOnLightSecondary: '#5a7080',  // Secondary text on white/cream backgrounds
  textOnLightTertiary: '#8fa0ad',   // Tertiary/muted text on light backgrounds

  // ── Surfaces ──────────────────────────────────────────────────────────────
  surface: '#1a4a63',           // Card / panel background
  surfaceElevated: '#1f5270',   // Elevated card (modal, overlay cards)
  surfaceSubtle: 'rgba(255,255,255,0.06)', // Very subtle separation

  // ── Borders ───────────────────────────────────────────────────────────────
  border: 'rgba(176, 196, 212, 0.2)',
  borderStrong: 'rgba(176, 196, 212, 0.4)',

  // ── Status ────────────────────────────────────────────────────────────────
  success: '#2ecc71',
  successFaded: 'rgba(46, 204, 113, 0.15)',
  error: '#e74c3c',
  errorFaded: 'rgba(231, 76, 60, 0.15)',
  warning: '#f39c12',
  warningFaded: 'rgba(243, 156, 18, 0.15)',

  // ── Semantic ──────────────────────────────────────────────────────────────
  star: '#FFB800',           // Star ratings
  openBadge: '#2ecc71',      // "Open" status
  closedBadge: '#e74c3c',    // "Closed" status
  capacityLow: '#e67e22',    // Low availability warning

  // ── Overlays ──────────────────────────────────────────────────────────────
  overlayDark: 'rgba(9, 31, 43, 0.85)',
  overlayMedium: 'rgba(9, 31, 43, 0.6)',
  overlayLight: 'rgba(9, 31, 43, 0.3)',
  overlayWhite: 'rgba(255, 255, 255, 0.1)',

  // ── Tab Bar ───────────────────────────────────────────────────────────────
  tabBarBackground: '#0f3346',              // Navy — mirrors the header
  tabBarActive: '#FFFFFF',                  // White — pops cleanly on navy
  tabBarInactive: 'rgba(255,255,255,0.40)', // Dim white for inactive

  // ── Map markers ───────────────────────────────────────────────────────────
  markerDefault: '#FFFFFF',
  markerSelected: '#7a0000',
  markerBorderDefault: '#0f3346',
  markerBorderSelected: '#7a0000',
} as const;

export type ColorKey = keyof typeof Colors;
