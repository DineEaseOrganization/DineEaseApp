/**
 * DineEase Design System â€” Spacing, Radius & Shadows
 */

import { r } from './responsive';

export const Spacing = {
  '0': 0,
  '1': r(4),
  '2': r(8),
  '3': r(12),
  '4': r(16),
  '5': r(20),
  '6': r(24),
  '8': r(32),
  '10': r(40),
  '12': r(48),
  '16': r(64),
} as const;

export const Radius = {
  sm: r(6),
  md: r(10),
  lg: r(14),
  xl: r(18),
  '2xl': r(24),
  full: 999,
} as const;

export const Shadow = {
  // For elements on dark navy backgrounds
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: r(0), height: r(2) },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: r(0), height: r(4) },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: r(0), height: r(8) },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  inset: {
    shadowColor: '#000',
    shadowOffset: { width: r(0), height: r(-2) },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
