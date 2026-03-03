import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import type { PolygonStatus } from '../types';

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  approved: { color: colors.ok, bg: 'rgba(34,197,94,0.12)', label: 'Approved' },
  'needs-review': { color: colors.amber, bg: colors.amberBg, label: 'Needs Review' },
  draft: { color: colors.text3, bg: 'rgba(94,133,112,0.12)', label: 'Draft' },
  submitted: { color: colors.blue, bg: colors.blueBg, label: 'Submitted' },
  synced: { color: colors.green, bg: colors.greenBg2, label: 'Synced' },
};

interface BadgeProps {
  status: PolygonStatus | 'synced';
}

export default function Badge({ status }: BadgeProps) {
  const config = STATUS_MAP[status] || STATUS_MAP.draft;

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
