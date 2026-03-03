import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import Svg, { Path, Circle } from 'react-native-svg';

interface LogoProps {
  size?: 'small' | 'large';
}

function GlobeIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.6} />
      <Path d="M2 12h20" stroke={color} strokeWidth={1.6} />
      <Path
        d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
        stroke={color}
        strokeWidth={1.6}
      />
    </Svg>
  );
}

export default function Logo({ size = 'large' }: LogoProps) {
  const isLarge = size === 'large';
  const iconBoxSize = isLarge ? 56 : 26;
  const iconSize = isLarge ? 28 : 14;

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <View
        style={[
          styles.iconBox,
          { width: iconBoxSize, height: iconBoxSize, borderRadius: isLarge ? 16 : 8 },
        ]}
      >
        <GlobeIcon size={iconSize} color={colors.bg} />
      </View>
      <View style={isLarge ? styles.textContainerLarge : styles.textContainerSmall}>
        <Text style={[styles.title, { fontSize: isLarge ? 24 : 17 }]}>TerraMatch</Text>
        <View style={[styles.badge, isLarge && styles.badgeLarge]}>
          <Text style={[styles.badgeText, isLarge && styles.badgeTextLarge]}>MOBILE</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  containerLarge: {
    flexDirection: 'column',
    gap: 12,
  },
  iconBox: {
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textContainerLarge: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontWeight: '800',
    color: colors.text1,
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: colors.greenBg2,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.green,
    letterSpacing: 0.8,
  },
  badgeTextLarge: {
    fontSize: 11,
    letterSpacing: 1,
  },
});
