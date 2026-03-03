import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '../constants/colors';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'default' | 'danger' | 'warn' | 'ghost';
  small?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function Button({
  children,
  onPress,
  variant = 'default',
  small = false,
  style,
  disabled = false,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    small ? styles.small : styles.regular,
    variant === 'primary' && styles.primary,
    variant === 'danger' && styles.danger,
    variant === 'warn' && styles.warn,
    variant === 'ghost' && styles.ghost,
    variant === 'default' && styles.default,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    small && styles.textSmall,
    variant === 'primary' && styles.textPrimary,
    variant === 'danger' && styles.textDanger,
    variant === 'warn' && styles.textWarn,
    variant === 'ghost' && styles.textGhost,
    variant === 'default' && styles.textDefault,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={buttonStyle}
    >
      {typeof children === 'string' ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  regular: {
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  small: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  primary: {
    backgroundColor: colors.green,
  },
  default: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.redBg,
    borderWidth: 1,
    borderColor: colors.red,
  },
  warn: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 11,
  },
  textPrimary: {
    color: colors.bg,
  },
  textDefault: {
    color: colors.text1,
  },
  textDanger: {
    color: colors.red,
  },
  textWarn: {
    color: colors.amber,
  },
  textGhost: {
    color: colors.text2,
  },
});
