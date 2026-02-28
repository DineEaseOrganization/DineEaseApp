import { Dimensions } from 'react-native';

const BASE_WIDTH = 412;
const BASE_HEIGHT = 915;

const { width, height } = Dimensions.get('window');
const minSide = Math.min(width, height);
const rawScale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const scale = clamp(rawScale, 0.85, 1.1);
export const fontScale = clamp(rawScale, 0.9, 1.05);
export const isSmallScreen = minSide <= 360;

export const r = (value: number): number => {
  if (value === 0) return 0;
  return Math.round(value * scale);
};

export const rf = (value: number): number => {
  if (value === 0) return 0;
  return Math.round(value * fontScale);
};
