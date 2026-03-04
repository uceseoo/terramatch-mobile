import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  PanResponder,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Path, Circle, Line, Polygon as SvgPolygon, G } from 'react-native-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import { POLY_FIELDS } from '../constants/schema';
import Header from '../components/Header';
import Button from '../components/Button';
import { getPolygonById, updatePolygon } from '../database/queries';
import { calculateAreaHectares, closeRing } from '../services/geometry';
import type { RootStackParamList, Polygon } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditPolygon'>;
type Route = RouteProp<RootStackParamList, 'EditPolygon'>;

type EditTool = 'move' | 'add' | 'remove';

// Icons
function CheckIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={colors.bg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoveIcon({ active }: { active: boolean }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" stroke={active ? colors.green : colors.text3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={active ? colors.green : colors.text3} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon({ active }: { active: boolean }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={active ? colors.red : colors.text3} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Select field options by key
const SELECT_OPTIONS: Record<string, readonly string[]> = {
  practice: POLY_FIELDS.practice.options,
  target_sys: POLY_FIELDS.target_sys.options,
  distr: POLY_FIELDS.distr.options,
};

interface FormData {
  poly_name: string;
  plantstart: string;
  practice: string;
  target_sys: string;
  distr: string;
  num_trees: string;
}

// Default polygon shape when no coordinates exist (centered roughly in Kenya)
const DEFAULT_COORDS: number[][] = [
  [36.817, -1.286],
  [36.820, -1.284],
  [36.822, -1.288],
  [36.818, -1.290],
];

const PADDING = 30;
const VERTEX_HIT_RADIUS = 20;
const MIDPOINT_HIT_RADIUS = 15;

export default function EditPolygonScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { polygonId } = route.params;

  const [polygon, setPolygon] = useState<Polygon | null>(null);
  const [form, setForm] = useState<FormData>({
    poly_name: '',
    plantstart: '',
    practice: '',
    target_sys: '',
    distr: '',
    num_trees: '',
  });

  // Geometry state: array of [lng, lat] (open ring, not closed)
  const [vertices, setVertices] = useState<number[][]>([]);
  const [tool, setTool] = useState<EditTool>('move');
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const [mapSize, setMapSize] = useState({ w: 300, h: 180 });
  const [isDragging, setIsDragging] = useState(false);

  // Track if geometry was modified
  const [geometryDirty, setGeometryDirty] = useState(false);

  useEffect(() => {
    loadPolygon();
  }, [polygonId]);

  const loadPolygon = async () => {
    const pg = await getPolygonById(polygonId);
    if (pg) {
      setPolygon(pg);
      setForm({
        poly_name: pg.poly_name,
        plantstart: pg.plantstart,
        practice: pg.practice,
        target_sys: pg.target_sys,
        distr: pg.distr,
        num_trees: String(pg.num_trees || ''),
      });

      // Load coordinates
      let coords: number[][] = [];
      if (pg.coordinates) {
        try {
          coords = JSON.parse(pg.coordinates);
        } catch {}
      }

      // Remove closing point if ring is closed
      if (coords.length > 1) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) {
          coords = coords.slice(0, -1);
        }
      }

      setVertices(coords.length >= 3 ? coords : DEFAULT_COORDS);
    }
  };

  // ─── Coordinate ↔ SVG mapping ───

  const bounds = useMemo(() => {
    if (vertices.length === 0) return { minLng: 0, maxLng: 1, minLat: 0, maxLat: 1 };
    const lngs = vertices.map((v) => v[0]);
    const lats = vertices.map((v) => v[1]);
    // Add a small buffer so points aren't right at the edge
    const lngRange = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.0001);
    const latRange = Math.max(Math.max(...lats) - Math.min(...lats), 0.0001);
    const buf = 0.15;
    return {
      minLng: Math.min(...lngs) - lngRange * buf,
      maxLng: Math.max(...lngs) + lngRange * buf,
      minLat: Math.min(...lats) - latRange * buf,
      maxLat: Math.max(...lats) + latRange * buf,
    };
  }, [vertices]);

  const toSVG = (lng: number, lat: number) => {
    const drawW = mapSize.w - PADDING * 2;
    const drawH = mapSize.h - PADDING * 2;
    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;
    return {
      x: PADDING + ((lng - bounds.minLng) / lngRange) * drawW,
      y: PADDING + ((bounds.maxLat - lat) / latRange) * drawH,
    };
  };

  const fromSVG = (x: number, y: number) => {
    const drawW = mapSize.w - PADDING * 2;
    const drawH = mapSize.h - PADDING * 2;
    const lngRange = bounds.maxLng - bounds.minLng;
    const latRange = bounds.maxLat - bounds.minLat;
    return [
      bounds.minLng + ((x - PADDING) / drawW) * lngRange,
      bounds.maxLat - ((y - PADDING) / drawH) * latRange,
    ];
  };

  const svgVertices = vertices.map((v) => toSVG(v[0], v[1]));

  // Midpoints between consecutive vertices
  const midpoints = svgVertices.map((v, i) => {
    const next = svgVertices[(i + 1) % svgVertices.length];
    return { x: (v.x + next.x) / 2, y: (v.y + next.y) / 2, afterIndex: i };
  });

  // ─── Touch handling ───

  const mapRef = useRef<View>(null);

  const findNearestVertex = (x: number, y: number): number | null => {
    let closest = -1;
    let minDist = VERTEX_HIT_RADIUS;
    svgVertices.forEach((v, i) => {
      const d = Math.sqrt((v.x - x) ** 2 + (v.y - y) ** 2);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    });
    return closest >= 0 ? closest : null;
  };

  const findNearestMidpoint = (x: number, y: number): number | null => {
    let closest = -1;
    let minDist = MIDPOINT_HIT_RADIUS;
    midpoints.forEach((m, i) => {
      const d = Math.sqrt((m.x - x) ** 2 + (m.y - y) ** 2);
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    });
    return closest >= 0 ? closest : null;
  };

  const getEventPos = (e: GestureResponderEvent) => {
    return { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => tool === 'move',
        onPanResponderGrant: (e) => {
          const pos = getEventPos(e);

          if (tool === 'move') {
            const idx = findNearestVertex(pos.x, pos.y);
            setSelectedVertex(idx);
            if (idx !== null) setIsDragging(true);
          } else if (tool === 'add') {
            const midIdx = findNearestMidpoint(pos.x, pos.y);
            if (midIdx !== null) {
              // Insert new vertex after midpoints[midIdx].afterIndex
              const insertAt = midpoints[midIdx].afterIndex + 1;
              const newCoord = fromSVG(midpoints[midIdx].x, midpoints[midIdx].y);
              setVertices((prev) => {
                const next = [...prev];
                next.splice(insertAt, 0, newCoord);
                return next;
              });
              setGeometryDirty(true);
              setSelectedVertex(insertAt);
              // Switch to move tool to let user drag the new vertex
              setTool('move');
              setIsDragging(true);
            }
          } else if (tool === 'remove') {
            const idx = findNearestVertex(pos.x, pos.y);
            if (idx !== null) {
              if (vertices.length <= 3) {
                Alert.alert('Cannot Remove', 'A polygon needs at least 3 vertices.');
              } else {
                setVertices((prev) => prev.filter((_, i) => i !== idx));
                setGeometryDirty(true);
                setSelectedVertex(null);
              }
            }
          }
        },
        onPanResponderMove: (e) => {
          if (tool === 'move' && selectedVertex !== null && isDragging) {
            const pos = getEventPos(e);
            const coord = fromSVG(pos.x, pos.y);
            setVertices((prev) => {
              const next = [...prev];
              next[selectedVertex] = coord;
              return next;
            });
            setGeometryDirty(true);
          }
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
        },
      }),
    [tool, selectedVertex, isDragging, svgVertices, midpoints, vertices, bounds, mapSize]
  );

  // ─── Save ───

  const handleSave = async () => {
    if (!polygon) return;
    if (!form.poly_name || !form.practice) {
      Alert.alert('Required', 'Fill in Polygon Name and Practice');
      return;
    }

    const closedCoords = closeRing(vertices);
    const area = calculateAreaHectares(vertices);

    await updatePolygon(polygon.id, {
      poly_name: form.poly_name,
      plantstart: form.plantstart,
      practice: form.practice,
      target_sys: form.target_sys,
      distr: form.distr,
      num_trees: parseInt(form.num_trees, 10) || 0,
      coordinates: JSON.stringify(closedCoords),
      point_count: closedCoords.length,
      area_hectares: Math.round(area * 100) / 100,
    });
    navigation.goBack();
  };

  const updateField = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMapSize({ w: width, h: height });
  };

  if (!polygon) return null;

  // SVG path for polygon fill
  const polyPath = svgVertices.length >= 3
    ? svgVertices.map((v, i) => `${i === 0 ? 'M' : 'L'}${v.x},${v.y}`).join(' ') + ' Z'
    : '';

  // Area for display
  const area = vertices.length >= 3 ? calculateAreaHectares(vertices) : 0;

  return (
    <View style={styles.container}>
      <Header
        title="Edit Polygon"
        subtitle={polygon.poly_name}
        onBack={() => {
          if (geometryDirty) {
            Alert.alert('Unsaved Changes', 'Discard geometry changes?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Discard', onPress: () => navigation.goBack() },
            ]);
          } else {
            navigation.goBack();
          }
        }}
        right={
          <Button small variant="primary" onPress={handleSave}>
            <Text style={styles.headerSaveText}>Save</Text>
          </Button>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!isDragging}
      >
        {/* Geometry editor */}
        <View
          ref={mapRef}
          style={styles.geoPreview}
          onLayout={onMapLayout}
          {...panResponder.panHandlers}
        >
          <Svg width={mapSize.w} height={mapSize.h}>
            {/* Grid */}
            {Array.from({ length: 20 }).map((_, i) => (
              <Line key={`h${i}`} x1="0" y1={i * 10} x2={mapSize.w} y2={i * 10} stroke={colors.green} strokeWidth={0.3} opacity={0.1} />
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <Line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2={mapSize.h} stroke={colors.green} strokeWidth={0.3} opacity={0.1} />
            ))}

            {/* Polygon fill */}
            {polyPath && (
              <Path d={polyPath} fill={colors.green} fillOpacity={0.08} stroke={colors.green} strokeWidth={1.5} strokeDasharray="4,3" />
            )}

            {/* Edges */}
            {svgVertices.map((v, i) => {
              const next = svgVertices[(i + 1) % svgVertices.length];
              return (
                <Line key={`e${i}`} x1={v.x} y1={v.y} x2={next.x} y2={next.y} stroke={colors.green} strokeWidth={2} />
              );
            })}

            {/* Midpoint handles (only in add mode) */}
            {tool === 'add' && midpoints.map((m, i) => (
              <G key={`m${i}`}>
                <Circle cx={m.x} cy={m.y} r={8} fill={colors.green} opacity={0.08} />
                <Circle cx={m.x} cy={m.y} r={4} fill="none" stroke={colors.green} strokeWidth={1} strokeDasharray="2,2" opacity={0.6} />
                <Line x1={m.x - 3} y1={m.y} x2={m.x + 3} y2={m.y} stroke={colors.green} strokeWidth={1} opacity={0.6} />
                <Line x1={m.x} y1={m.y - 3} x2={m.x} y2={m.y + 3} stroke={colors.green} strokeWidth={1} opacity={0.6} />
              </G>
            ))}

            {/* Vertex handles */}
            {svgVertices.map((v, i) => {
              const isSelected = selectedVertex === i;
              const isRemoveMode = tool === 'remove';
              const handleColor = isRemoveMode ? colors.red : colors.green;
              return (
                <G key={`v${i}`}>
                  <Circle cx={v.x} cy={v.y} r={isSelected ? 14 : 10} fill={handleColor} opacity={isSelected ? 0.2 : 0.1} />
                  <Circle cx={v.x} cy={v.y} r={isSelected ? 7 : 5} fill={handleColor} stroke={colors.bg} strokeWidth={2} />
                  {isRemoveMode && (
                    <>
                      <Line x1={v.x - 3} y1={v.y} x2={v.x + 3} y2={v.y} stroke={colors.bg} strokeWidth={1.5} />
                    </>
                  )}
                </G>
              );
            })}
          </Svg>

          {/* Info overlays */}
          <View style={styles.geoLabel}>
            <Text style={styles.geoLabelText}>
              {tool === 'move' && 'Drag vertices to reshape'}
              {tool === 'add' && 'Tap midpoints to add vertex'}
              {tool === 'remove' && 'Tap vertex to remove'}
            </Text>
          </View>
          <View style={styles.geoInfo}>
            <Text style={styles.geoInfoText}>
              {vertices.length} vertices · {area.toFixed(2)} ha
            </Text>
          </View>
        </View>

        {/* Edit tools */}
        <View style={styles.toolRow}>
          {([
            { id: 'move' as EditTool, icon: <MoveIcon active={tool === 'move'} />, label: 'Move' },
            { id: 'add' as EditTool, icon: <PlusIcon active={tool === 'add'} />, label: 'Add vertex' },
            { id: 'remove' as EditTool, icon: <TrashIcon active={tool === 'remove'} />, label: 'Remove' },
          ]).map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => { setTool(t.id); setSelectedVertex(null); }}
              style={[styles.toolCard, tool === t.id && (t.id === 'remove' ? styles.toolCardRemove : styles.toolCardActive)]}
              activeOpacity={0.7}
            >
              {t.icon}
              <Text style={[styles.toolLabel, tool === t.id && (t.id === 'remove' ? styles.toolLabelRemove : styles.toolLabelActive)]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Attribute form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Edit Attributes</Text>
          {(Object.entries(POLY_FIELDS) as [keyof FormData, typeof POLY_FIELDS[keyof typeof POLY_FIELDS]][]).map(
            ([key, field]) => (
              <View key={key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>
                {field.type === 'select' ? (
                  <View style={styles.selectGroup}>
                    {SELECT_OPTIONS[key]?.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => updateField(key, opt)}
                        style={[
                          styles.selectOption,
                          form[key] === opt && styles.selectOptionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            form[key] === opt && styles.selectOptionTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    value={form[key]}
                    onChangeText={(v) => updateField(key, v)}
                    placeholder={'placeholder' in field ? (field.placeholder as string) : ''}
                    placeholderTextColor={colors.text3}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                    style={styles.input}
                  />
                )}
              </View>
            )
          )}
        </View>

        {/* Bottom buttons */}
        <View style={styles.bottomRow}>
          <Button onPress={() => navigation.goBack()} style={{ flex: 1 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Button>
          <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>
            <CheckIcon />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </Button>
        </View>
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
  headerSaveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bg,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bg,
  },
  // Geometry editor
  geoPreview: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#0b1810',
    borderWidth: 1,
    borderColor: colors.green,
    marginBottom: 12,
    overflow: 'hidden',
  },
  geoLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(8,13,10,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  geoLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.green,
  },
  geoInfo: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(8,13,10,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  geoInfoText: {
    fontSize: 9,
    color: colors.text3,
    fontVariant: ['tabular-nums'],
  },
  // Tools
  toolRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  toolCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolCardActive: {
    backgroundColor: colors.greenBg2,
    borderColor: colors.greenDim,
  },
  toolCardRemove: {
    backgroundColor: colors.redBg,
    borderColor: colors.red,
  },
  toolLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text3,
    marginTop: 3,
  },
  toolLabelActive: {
    color: colors.green,
  },
  toolLabelRemove: {
    color: colors.red,
  },
  // Form
  formCard: {
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 13,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
  },
  required: {
    color: colors.red,
    fontSize: 10,
  },
  input: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text1,
    fontSize: 13,
  },
  selectGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectOptionActive: {
    backgroundColor: colors.greenBg2,
    borderColor: colors.greenDim,
  },
  selectOptionText: {
    fontSize: 11,
    color: colors.text3,
  },
  selectOptionTextActive: {
    color: colors.green,
    fontWeight: '700',
  },
  // Bottom
  bottomRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text1,
  },
});
