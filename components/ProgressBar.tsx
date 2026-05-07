import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // Value between 0 and 1
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = Theme.colors.primary,
  backgroundColor = Theme.colors.border,
}) => {
  const safeProgress = Math.min(Math.max(progress, 0), 1);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: safeProgress,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [safeProgress]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <Animated.View 
        style={[
          styles.fill, 
          { width: widthInterpolated }
        ]}
      >
        <LinearGradient
          colors={Theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  fill: {
    height: '100%',
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
  },
});
