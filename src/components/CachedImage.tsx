// src/components/CachedImage.tsx
import React, { useState } from 'react';
import { Image, StyleSheet, View, ViewStyle, ImageResizeMode } from 'react-native';

interface CachedImageProps {
  uri: string | null | undefined;
  style?: ViewStyle;
  resizeMode?: ImageResizeMode;
  fallbackColor?: string;
}

/**
 * Cached image component that automatically handles:
 * - Image caching (React Native built-in caching)
 * - Loading states
 * - Fallback for missing images
 * - Works seamlessly with signed URLs from GCS
 *
 * Note: Uses React Native's built-in Image component which has automatic caching.
 * Images are cached by URL, so signed URLs will be cached for their lifetime.
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
      <View style={[styles.placeholder, style, { backgroundColor: fallbackColor }]} />
    );
  }

  return (
    <>
      <Image
        source={{ uri }}
        style={style}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        // React Native automatically caches images
        // No additional configuration needed
      />
      {loading && (
        <View style={[styles.placeholder, style, { backgroundColor: fallbackColor, position: 'absolute' }]} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f0f0f0',
  },
});
