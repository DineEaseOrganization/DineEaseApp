import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { Colors, TextStyles } from '../../theme';

type TextVariant = keyof typeof TextStyles;

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

/**
 * DineEase typography component.
 * Uses theme text styles with Merriweather (display) and Inter (body) fonts.
 *
 * Usage:
 *   <AppText variant="restaurantName" color={Colors.textPrimary}>The Ivy</AppText>
 *   <AppText variant="body" color={Colors.textSecondary}>Italian · $$$</AppText>
 */
const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = Colors.textPrimary,
  style,
  children,
  ...props
}) => {
  return (
    <Text
      style={[TextStyles[variant], { color }, style as TextStyle]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default AppText;
