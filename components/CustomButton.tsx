import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../constants/theme';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  style,
  textStyle,
  disabled = false,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return Theme.colors.border;
    switch (type) {
      case 'primary': return Theme.colors.primary;
      case 'secondary': return Theme.colors.secondary;
      case 'outline': return 'transparent';
      case 'danger': return Theme.colors.error;
      default: return Theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return Theme.colors.textLight;
    if (type === 'outline') return Theme.colors.primary;
    return Theme.colors.textInverse;
  };

  const renderContent = () => (
    <Text style={[
      styles.text,
      { color: getTextColor() },
      textStyle
    ]}>
      {title}
    </Text>
  );

  if (type === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[styles.container, style]}
      >
        <LinearGradient
          colors={Theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        type === 'outline' && styles.outlineButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.borderRadius.m,
    overflow: 'hidden',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 6,
  },
  button: {
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: 'bold',
  },
});
