import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
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
      <Text style={[
        styles.text,
        { color: getTextColor() },
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Theme.spacing.m,
    paddingHorizontal: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: 'bold', // using string 'bold' instead of pulling from Theme to avoid TS issues
  },
});
