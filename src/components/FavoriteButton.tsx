// src/components/FavoriteButton.tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';

interface FavoriteButtonProps {
  restaurantId: number;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  onToggle?: (isFavorite: boolean) => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  restaurantId,
  size = 'medium',
  style,
  onToggle,
}) => {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);

  const favorite = isFavorite(restaurantId);

  const handlePress = async () => {
    if (isToggling || !isAuthenticated) return;

    setIsToggling(true);
    try {
      const result = await toggleFavorite(restaurantId);
      if (result.success && onToggle) {
        onToggle(!favorite);
      }
    } finally {
      setIsToggling(false);
    }
  };

  // Don't show button if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const sizeStyles = {
    small: { button: styles.buttonSmall, icon: styles.iconSmall },
    medium: { button: styles.buttonMedium, icon: styles.iconMedium },
    large: { button: styles.buttonLarge, icon: styles.iconLarge },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        currentSize.button,
        favorite && styles.buttonActive,
        style,
      ]}
      onPress={handlePress}
      disabled={isToggling}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      {isToggling ? (
        <ActivityIndicator
          size="small"
          color={favorite ? '#e74c3c' : '#999'}
        />
      ) : (
        <Text style={[currentSize.icon, favorite && styles.iconActive]}>
          {favorite ? '❤️' : '♡'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
  },
  buttonSmall: {
    width: 28,
    height: 28,
  },
  buttonMedium: {
    width: 36,
    height: 36,
  },
  buttonLarge: {
    width: 44,
    height: 44,
  },
  buttonActive: {
    backgroundColor: '#fff0f0',
  },
  iconSmall: {
    fontSize: 14,
    color: '#999',
  },
  iconMedium: {
    fontSize: 18,
    color: '#999',
  },
  iconLarge: {
    fontSize: 22,
    color: '#999',
  },
  iconActive: {
    color: '#e74c3c',
  },
});

export default FavoriteButton;
