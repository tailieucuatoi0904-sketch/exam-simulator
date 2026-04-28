import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
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
  // Ensure progress is bounded between 0 and 1
  const safeProgress = Math.min(Math.max(progress, 0), 1);
  
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: safeProgress,
      duration: 300,
      useNativeDriver: false, // width animation doesn't support native driver
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
          { 
            backgroundColor: color,
            width: widthInterpolated 
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: Theme.borderRadius.round,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Theme.borderRadius.round,
  },
});
