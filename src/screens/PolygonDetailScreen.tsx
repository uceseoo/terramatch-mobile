import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Polygon as SvgPolygon } from 'react-native-svg';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { POLY_FIELDS } from '../constants/schema';
import Header from '../components/Header';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getPolygonById, deletePolygon, updatePolygon, getSiteById } from '../database/queries';
import type { RootStackParamList, Polygon } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PolygonDetail'>;
type Route = RouteProp<RootStackParamList, 'PolygonDetail'>;

// Icons
function EditIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={colors.green} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QAIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke={colors.amber} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UploadIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={colors.bg} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FlagIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 3 0 4 1 4 1 3 0 4-1 4-1V3s-1 1-4 1-3 0-4-1-4-1-3 0-4 1-4 1zM4 22v-7" stroke={colors.red} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={colors.red} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function PolygonDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();
  const { polygonId } = route.params;

  const [polygon, setPolygon] = useState<Polygon | null>(null);
  const [siteName, setSiteName] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [polygonId])
  );

  const loadData = async () => {
    const pg = await getPolygonById(polygonId);
    setPolygon(pg);
    if (pg) {
      const site = await getSiteById(pg.site_id);
      setSiteName(site?.name || '');
    }
  };

  const handleDelete = () => {
    if (!polygon) return;
    Alert.alert(
      'Delete Polygon',
      `Delete "${polygon.poly_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePolygon(polygon.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!polygon) return;
    await updatePolygon(polygon.id, { status: 'submitted' });
    await loadData();
    Alert.alert('Submitted', 'Polygon submitted to TerraMatch');
  };

  const handleApprove = async () => {
    if (!polygon) return;
    await updatePolygon(polygon.id, { status: 'approved' });
    await loadData();
    Alert.alert('Approved', 'Polygon approved');
  };

  const handleFlag = async () => {
    if (!polygon) return;
    await updatePolygon(polygon.id, { status: 'needs-review' });
    await loadData();
    Alert.alert('Flagged', 'Polygon flagged for review');
  };

  if (!polygon) return null;

  return (
    <View style={styles.container}>
      <Header
        title={polygon.poly_name}
        subtitle={siteName}
        onBack={() => navigation.goBack()}
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditPolygon', { polygonId: polygon.id })}
              style={styles.editBtn}
              activeOpacity={0.7}
            >
              <EditIcon />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            {user?.role === 'dqa' && (
              <TouchableOpacity
                onPress={() => navigation.navigate('QAReview', { polygonId: polygon.id })}
                style={styles.qaBtn}
                activeOpacity={0.7}
              >
                <QAIcon />
                <Text style={styles.qaBtnText}>QA</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Status + vertices */}
        <View style={styles.statusRow}>
          <Badge status={polygon.status} />
          {polygon.point_count > 0 && (
            <View style={styles.vertexBadge}>
              <Text style={styles.vertexText}>{polygon.point_count} vertices</Text>
            </View>
          )}
        </View>

        {/* Mini-map */}
        <View style={styles.miniMap}>
          <Svg width="100%" height="100%">
            <SvgPolygon
              points="60,15 140,10 170,45 155,80 70,85 40,55"
              fill={colors.green}
              fillOpacity={0.12}
              stroke={colors.green}
              strokeWidth={2}
            />
            {[[60, 15], [140, 10], [170, 45], [155, 80], [70, 85], [40, 55]].map(([x, y], i) => (
              <Circle key={i} cx={x} cy={y} r={4} fill={colors.green} stroke={colors.bg} strokeWidth={2} />
            ))}
          </Svg>
          <View style={styles.miniMapLabel}>
            <Text style={styles.miniMapLabelText}>Tap Edit to modify vertices</Text>
          </View>
        </View>

        {/* Attribute table */}
        <View style={styles.attrTable}>
          {Object.entries(POLY_FIELDS).map(([key, field], i, arr) => (
            <View
              key={key}
              style={[styles.attrRow, i < arr.length - 1 && styles.attrRowBorder]}
            >
              <Text style={styles.attrLabel}>{field.label}</Text>
              <Text style={styles.attrValue} numberOfLines={1}>
                {key === 'num_trees'
                  ? (polygon.num_trees?.toLocaleString() || '—')
                  : ((polygon as unknown as Record<string, unknown>)[key] as string) || '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {user?.role === 'champion' && (
            <Button variant="primary" onPress={handleSubmit} style={{ flex: 1 }}>
              <UploadIcon />
              <Text style={styles.primaryBtnText}>Submit to TerraMatch</Text>
            </Button>
          )}
          {user?.role === 'dqa' && (
            <>
              <Button
                onPress={handleApprove}
                style={{ ...styles.approveBtn, flex: 1 }}
              >
                <Text style={styles.approveBtnText}>Approve</Text>
              </Button>
              <Button variant="danger" onPress={handleFlag} style={{ flex: 1 }}>
                <FlagIcon />
                <Text style={styles.dangerBtnText}>Flag</Text>
              </Button>
            </>
          )}
        </View>

        {/* Delete */}
        <Button variant="ghost" onPress={handleDelete} style={styles.deleteBtn}>
          <TrashIcon />
          <Text style={styles.deleteBtnText}>Delete Polygon</Text>
        </Button>
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
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    backgroundColor: colors.greenBg2,
    borderWidth: 1,
    borderColor: colors.greenDim,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.green,
  },
  qaBtn: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qaBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.amber,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  vertexBadge: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vertexText: {
    fontSize: 10,
    color: colors.text3,
    fontVariant: ['tabular-nums'],
  },
  // Mini-map
  miniMap: {
    height: 100,
    borderRadius: 11,
    backgroundColor: '#0b1810',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  miniMapLabel: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(8,13,10,0.8)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  miniMapLabelText: {
    fontSize: 9,
    color: colors.text3,
    fontVariant: ['tabular-nums'],
  },
  // Attributes
  attrTable: {
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  attrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  attrRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  attrLabel: {
    fontSize: 11,
    color: colors.text3,
  },
  attrValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text1,
    textAlign: 'right',
    maxWidth: '55%',
  },
  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bg,
  },
  approveBtn: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: colors.ok,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ok,
  },
  dangerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.red,
  },
  deleteBtn: {
    width: '100%',
    marginTop: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.red,
  },
});
