import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { QA_CHECKS } from '../constants/schema';
import Header from '../components/Header';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getPolygonById, updatePolygon, createQAReview, getLatestQAReview } from '../database/queries';
import type { RootStackParamList, Polygon } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'QAReview'>;
type Route = RouteProp<RootStackParamList, 'QAReview'>;

// Check result type
type CheckResult = 'pass' | 'fail' | null;

interface CheckState {
  id: string;
  result: CheckResult;
}

// Icons
function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={colors.amber} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function QAReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { polygonId } = route.params;

  const [polygon, setPolygon] = useState<Polygon | null>(null);
  const [checks, setChecks] = useState<CheckState[]>(
    QA_CHECKS.map((c) => ({ id: c.id, result: null }))
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [polygonId])
  );

  const loadData = async () => {
    const pg = await getPolygonById(polygonId);
    setPolygon(pg);

    // Load previous review if exists
    const prev = await getLatestQAReview(polygonId);
    if (prev) {
      try {
        const prevChecks: CheckState[] = JSON.parse(prev.checks_json);
        setChecks(prevChecks);
      } catch {}
      setNotes(prev.notes || '');
    }
  };

  const toggleCheck = (id: string, result: CheckResult) => {
    setChecks((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, result: c.result === result ? null : result } : c
      )
    );
  };

  const getCheckResult = (id: string): CheckResult => {
    return checks.find((c) => c.id === id)?.result ?? null;
  };

  // Determine overall result
  const criticalChecks = QA_CHECKS.filter((c) => c.critical);
  const allCriticalPassed = criticalChecks.every(
    (c) => getCheckResult(c.id) === 'pass'
  );
  const anyFailed = checks.some((c) => c.result === 'fail');
  const allReviewed = checks.every((c) => c.result !== null);

  const handleSubmit = async (result: 'approved' | 'flagged') => {
    if (!polygon || !user) return;

    // Check all critical items are reviewed
    const unreviewedCritical = criticalChecks.filter(
      (c) => getCheckResult(c.id) === null
    );
    if (unreviewedCritical.length > 0) {
      Alert.alert(
        'Incomplete Review',
        `Please review all critical checks before submitting. ${unreviewedCritical.length} critical check(s) remaining.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await createQAReview({
        polygon_id: polygonId,
        reviewer_name: user.name,
        checks_json: JSON.stringify(checks),
        result,
        notes: notes.trim() || undefined,
      });

      // Update polygon status
      const newStatus = result === 'approved' ? 'approved' : 'needs-review';
      await updatePolygon(polygonId, { status: newStatus });

      Alert.alert(
        result === 'approved' ? 'Approved' : 'Flagged for Review',
        result === 'approved'
          ? 'Polygon has passed QA and been approved.'
          : 'Polygon has been flagged. The restoration champion will be notified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!polygon) return null;

  // Group checks by category
  const categories = ['Geometry', 'Spatial', 'Attributes'] as const;

  return (
    <View style={styles.container}>
      <Header
        title="QA Review"
        subtitle={polygon.poly_name}
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>
              {checks.filter((c) => c.result === 'pass').length}
            </Text>
            <Text style={styles.summaryLabel}>Passed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: colors.red }]}>
              {checks.filter((c) => c.result === 'fail').length}
            </Text>
            <Text style={styles.summaryLabel}>Failed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: colors.text3 }]}>
              {checks.filter((c) => c.result === null).length}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
        </View>

        {/* Checks by category */}
        {categories.map((cat) => {
          const catChecks = QA_CHECKS.filter((c) => c.cat === cat);
          return (
            <View key={cat} style={styles.catSection}>
              <Text style={styles.catTitle}>{cat}</Text>
              <View style={styles.catCard}>
                {catChecks.map((check, i) => {
                  const result = getCheckResult(check.id);
                  return (
                    <View
                      key={check.id}
                      style={[
                        styles.checkRow,
                        i < catChecks.length - 1 && styles.checkRowBorder,
                      ]}
                    >
                      <View style={styles.checkInfo}>
                        <View style={styles.checkLabelRow}>
                          <Text style={styles.checkLabel}>{check.label}</Text>
                          {check.critical && (
                            <View style={styles.criticalBadge}>
                              <AlertIcon />
                              <Text style={styles.criticalText}>Critical</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.checkActions}>
                        <TouchableOpacity
                          onPress={() => toggleCheck(check.id, 'pass')}
                          style={[
                            styles.checkBtn,
                            result === 'pass' && styles.checkBtnPass,
                          ]}
                          activeOpacity={0.7}
                        >
                          <CheckIcon />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => toggleCheck(check.id, 'fail')}
                          style={[
                            styles.checkBtn,
                            result === 'fail' && styles.checkBtnFail,
                          ]}
                          activeOpacity={0.7}
                        >
                          <XIcon />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Review Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add comments or observations..."
            placeholderTextColor={colors.text3}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Button
            onPress={() => handleSubmit('approved')}
            disabled={submitting || !allCriticalPassed}
            style={{ ...styles.approveBtn, flex: 1 }}
          >
            <CheckIcon />
            <Text style={styles.approveBtnText}>Approve</Text>
          </Button>
          <Button
            variant="danger"
            onPress={() => handleSubmit('flagged')}
            disabled={submitting || !anyFailed}
            style={{ flex: 1 }}
          >
            <XIcon />
            <Text style={styles.flagBtnText}>Flag</Text>
          </Button>
        </View>

        {/* Hint text */}
        <Text style={styles.hint}>
          {!allReviewed
            ? 'Review all critical checks to enable actions'
            : allCriticalPassed
            ? 'All critical checks passed — ready to approve'
            : 'One or more critical checks failed — flag for review'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingTop: 14,
    paddingBottom: 40,
  },
  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    marginBottom: 18,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ok,
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  // Category sections
  catSection: {
    marginBottom: 14,
  },
  catTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 2,
  },
  catCard: {
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  // Check rows
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  checkRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkInfo: {
    flex: 1,
    marginRight: 10,
  },
  checkLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkLabel: {
    fontSize: 12,
    color: colors.text1,
    fontWeight: '500',
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.amberBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  criticalText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.amber,
  },
  checkActions: {
    flexDirection: 'row',
    gap: 6,
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnPass: {
    backgroundColor: colors.ok,
    borderColor: colors.ok,
  },
  checkBtnFail: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  // Notes
  notesSection: {
    marginBottom: 18,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 2,
  },
  notesInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: colors.text1,
    minHeight: 90,
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: colors.ok,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ok,
  },
  flagBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.red,
  },
  // Hint
  hint: {
    fontSize: 11,
    color: colors.text3,
    textAlign: 'center',
    marginTop: 12,
  },
});
