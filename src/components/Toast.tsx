import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

interface ToastProps {
  message: string;
  type?: 'success' | 'warn' | 'error';
  visible: boolean;
  onHide: () => void;
}

export default function Toast({ message, type = 'success', visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor =
    type === 'error' ? colors.redBg : type === 'warn' ? colors.amberBg : colors.greenBg2;
  const textColor =
    type === 'error' ? colors.red : type === 'warn' ? colors.amber : colors.green;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: bgColor, borderColor: textColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
