import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../theme';
import AppText from './AppText';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * DineEase reusable button component.
 *
 * Variants:
 *   primary  — Burgundy fill (main CTAs)
 *   secondary — Navy outline with white text
 *   ghost    — Transparent, white text (subtle actions)
 *   danger   — Error red fill
 *
 * Usage:
 *   <AppButton label="Book Table" onPress={handleBook} />
 *   <AppButton label="View All" variant="ghost" size="sm" onPress={...} />
 */
const AppButton: React.FC<AppButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.75}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? Colors.white : Colors.white}
        />
      ) : (
        <View style={styles.inner}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <AppText
            variant={size === 'sm' ? 'buttonSmall' : size === 'lg' ? 'buttonLarge' : 'button'}
            color={getTextColor(variant)}
            style={textStyle}
          >
            {label}
          </AppText>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const getTextColor = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary':
      return Colors.white;
    case 'secondary':
      return Colors.white;
    case 'ghost':
      return Colors.textSecondary;
    case 'danger':
      return Colors.white;
  }
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing['2'],
  },
  iconRight: {
    marginLeft: Spacing['2'],
  },

  // Variants
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
  },
  ghost: {
    backgroundColor: Colors.surfaceSubtle,
  },
  danger: {
    backgroundColor: Colors.error,
  },

  // Sizes
  size_sm: {
    paddingVertical: Spacing['1'] + 2,
    paddingHorizontal: Spacing['3'],
    borderRadius: Radius.md,
  },
  size_md: {
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['5'],
  },
  size_lg: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['6'],
    borderRadius: Radius.xl,
  },

  disabled: {
    opacity: 0.45,
  },
});

export default AppButton;
