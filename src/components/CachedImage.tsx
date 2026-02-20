// src/components/CachedImage.tsx
import React, { useState } from 'react';
import { Image, ImageStyle } from 'expo-image';
import { StyleSheet, View, ViewStyle } from 'react-native';

type ContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

interface CachedImageProps {
  uri: string | null | undefined;
  style?: ViewStyle | ImageStyle;
  resizeMode?: ContentFit;
  fallbackColor?: string;
}

/**
 * Cached image component that automatically handles:
 * - Persistent disk + memory image cache via expo-image (survives app restarts)
 * - Loading states with placeholder
 * - Fallback for missing/broken images
 * - Works seamlessly with signed URLs from GCS
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  style,
  resizeMode = 'cover',
  fallbackColor = '#f0f0f0',
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Handle null/undefined URIs or load errors
  if (!uri || error) {
    return (
      <View style={[styles.placeholder, style as ViewStyle, { backgroundColor: fallbackColor }]} />
    );
  }

  return (
    <>
      <Image
        source={uri}
        style={style as ImageStyle}
        contentFit={resizeMode}
        cachePolicy="disk"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      {loading && (
        <View
          style={[
            styles.placeholder,
            style as ViewStyle,
            { backgroundColor: fallbackColor, position: 'absolute' },
          ]}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f0f0f0',
  },
});
