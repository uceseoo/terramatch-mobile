import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LocationSubscription } from 'expo-location';
import { colors } from '../constants/colors';
import { POLY_FIELDS } from '../constants/schema';
import Header from '../components/Header';
import Button from '../components/Button';
import { requestLocationPermission, startTracking, type GPSPoint, type GPSStats } from '../services/location';
import { calculateAreaHectares, closeRing, coordsToSVG } from '../services/geometry';
import { createPolygon } from '../database/queries';
import { isNativeMap, MapView, Polyline as MapPolyline, Polygon as MapPolygon, Marker, PROVIDER_GOOGLE } from '../components/MapComponents';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TrackPolygon'>;
type Route = RouteProp<RootStackParamList, 'TrackPolygon'>;

type TrackingState = 'idle' | 'tracking' | 'paused' | 'complete';

// Select field options
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

export default function TrackPolygonScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { siteId } = route.params;

  const [state, setState] = useState<TrackingState>('idle');
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [gpsStats, setGpsStats] = useState<GPSStats>({ accuracy: null, elevation: null, speed: null });
  const [elapsed, setElapsed] = useState(0);
  const [form, setForm] = useState<FormData>({
    poly_name: '',
    plantstart: new Date().toISOString().split('T')[0],
    practice: '',
    target_sys: '',
    distr: '',
    num_trees: '',
  });
  const [saving, setSaving] = useState(false);

  const subscriptionRef = useRef<LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (state === 'tracking') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Tracking Controls ───

  const handleStart = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert('Permission Denied', 'Location permission is required to track polygons.');
      return;
    }

    setState('tracking');
    setPoints([]);
    setElapsed(0);

    try {
      const sub = await startTracking((point, stats) => {
        setPoints((prev) => [...prev, point]);
        setGpsStats(stats);
      });
      subscriptionRef.current = sub;
    } catch (err) {
      Alert.alert('GPS Error', 'Failed to start location tracking. Please check your GPS settings.');
      setState('idle');
    }
  };

  const handlePause = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setState('paused');
  };

  const handleResume = async () => {
    setState('tracking');
    try {
      const sub = await startTracking((point, stats) => {
        setPoints((prev) => [...prev, point]);
        setGpsStats(stats);
      });
      subscriptionRef.current = sub;
    } catch {
      setState('paused');
    }
  };

  const handleFinish = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    if (points.length < 3) {
      Alert.alert(
        'Not Enough Points',
        `Only ${points.length} GPS point(s) recorded. At least 3 are needed to form a polygon. Try walking further or checking GPS signal.`,
        [{ text: 'OK' }]
      );
      // Go back to paused instead of auto-resuming — let user decide
      setState(points.length > 0 ? 'paused' : 'idle');
      return;
    }

    setState('complete');
  };

  const handleSave = async () => {
    // Validate form
    if (!form.poly_name.trim()) {
      Alert.alert('Missing Name', 'Please enter a polygon name.');
      return;
    }
    if (!form.practice) {
      Alert.alert('Missing Practice', 'Please select a restoration practice.');
      return;
    }
    if (!form.target_sys) {
      Alert.alert('Missing Land Use', 'Please select a target land use system.');
      return;
    }
    if (!form.distr) {
      Alert.alert('Missing Distribution', 'Please select a distribution type.');
      return;
    }

    setSaving(true);

    // Convert to GeoJSON [lng, lat] format and close the ring
    const coords = points.map((p) => [p.longitude, p.latitude]);
    const closedCoords = closeRing(coords);
    const area = calculateAreaHectares(coords);

    try {
      await createPolygon({
        site_id: siteId,
        poly_name: form.poly_name.trim(),
        plantstart: form.plantstart,
        practice: form.practice,
        target_sys: form.target_sys,
        distr: form.distr,
        num_trees: parseInt(form.num_trees, 10) || 0,
        status: 'draft',
        coordinates: JSON.stringify(closedCoords),
        point_count: closedCoords.length,
        area_hectares: Math.round(area * 100) / 100,
      });

      Alert.alert(
        'Polygon Saved',
        `"${form.poly_name}" saved with ${points.length} points (${area.toFixed(2)} ha)`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Save Error', 'Failed to save polygon. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const mapRef = useRef<any>(null);

  // ─── SVG Map rendering (web fallback) ───

  const MAP_W = 340;
  const MAP_H = 200;

  const svgCoords = points.length > 0
    ? coordsToSVG(
        points.map((p) => [p.longitude, p.latitude]),
        MAP_W,
        MAP_H,
        30
      )
    : [];

  const pathD = svgCoords.length > 1
    ? svgCoords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    : '';

  const lastSvg = svgCoords.length > 0 ? svgCoords[svgCoords.length - 1] : null;

  // Area calculation for display
  const coords = points.map((p) => [p.longitude, p.latitude]);
  const areaHa = points.length >= 3 ? calculateAreaHectares(coords) : 0;

  // Native map coordinates
  const mapCoords = points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  // Auto-center map on latest point
  useEffect(() => {
    if (isNativeMap && mapRef.current && lastPoint && state === 'tracking') {
      mapRef.current.animateToRegion({
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 500);
    }
  }, [lastPoint?.latitude, lastPoint?.longitude]);

  return (
    <View style={styles.container}>
      <Header
        title="Track Polygon"
        subtitle={state === 'complete' ? 'Save your polygon' : 'Walk the boundary'}
        onBack={() => {
          if (state === 'tracking' || state === 'paused') {
            // Use 2-button alert for web compatibility (web only supports OK/Cancel)
            Alert.alert('Stop Tracking?', 'Your recorded path will be lost.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Discard & Go Back',
                onPress: () => {
                  subscriptionRef.current?.remove();
                  if (timerRef.current) clearInterval(timerRef.current);
                  navigation.goBack();
                },
              },
            ]);
          } else if (state === 'complete') {
            Alert.alert('Discard Polygon?', 'Your tracked polygon has not been saved.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Discard',
                onPress: () => navigation.goBack(),
              },
            ]);
          } else {
            navigation.goBack();
          }
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Map area */}
        <View style={styles.mapContainer}>
          {isNativeMap && MapView ? (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={PROVIDER_GOOGLE}
              mapType="satellite"
              showsUserLocation={state === 'tracking' || state === 'paused'}
              showsMyLocationButton={false}
              initialRegion={{
                latitude: lastPoint?.latitude ?? -1.286,
                longitude: lastPoint?.longitude ?? 36.817,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              {/* Tracked path as polyline */}
              {mapCoords.length >= 2 && (
                <MapPolyline
                  coordinates={mapCoords}
                  strokeColor={colors.green}
                  strokeWidth={3}
                />
              )}

              {/* Closing line (dashed effect: thin line) */}
              {mapCoords.length >= 3 && (
                <MapPolyline
                  coordinates={[mapCoords[mapCoords.length - 1], mapCoords[0]]}
                  strokeColor={colors.green}
                  strokeWidth={1}
                  lineDashPattern={[8, 8]}
                />
              )}

              {/* Filled polygon preview when complete */}
              {state === 'complete' && mapCoords.length >= 3 && (
                <MapPolygon
                  coordinates={mapCoords}
                  fillColor={colors.green + '20'}
                  strokeColor={colors.green}
                  strokeWidth={2}
                />
              )}

              {/* Start marker */}
              {mapCoords.length > 0 && (
                <Marker coordinate={mapCoords[0]} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.startMarker} />
                </Marker>
              )}
            </MapView>
          ) : (
            <Svg width="100%" height="100%">
              {Array.from({ length: 22 }).map((_, i) => (
                <Line key={`h${i}`} x1="0" y1={i * 10} x2={MAP_W} y2={i * 10} stroke={colors.green} strokeWidth={0.3} opacity={0.15} />
              ))}
              {Array.from({ length: 36 }).map((_, i) => (
                <Line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2={MAP_H} stroke={colors.green} strokeWidth={0.3} opacity={0.15} />
              ))}
              {pathD && (
                <Path d={pathD} fill="none" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              )}
              {svgCoords.length >= 3 && (
                <Path
                  d={`M${svgCoords[svgCoords.length - 1].x},${svgCoords[svgCoords.length - 1].y} L${svgCoords[0].x},${svgCoords[0].y}`}
                  fill="none" stroke={colors.green} strokeWidth={1.5} strokeDasharray="4,4" opacity={0.5}
                />
              )}
              {state === 'complete' && svgCoords.length >= 3 && (
                <Path
                  d={svgCoords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z'}
                  fill={colors.green} fillOpacity={0.12} stroke={colors.green} strokeWidth={2}
                />
              )}
              {svgCoords.map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={i === 0 ? 5 : 3} fill={i === 0 ? colors.green : colors.greenDim} stroke={colors.bg} strokeWidth={1.5} />
              ))}
              {lastSvg && state !== 'complete' && (
                <>
                  <Circle cx={lastSvg.x} cy={lastSvg.y} r={14} fill={colors.blue} opacity={0.15} />
                  <Circle cx={lastSvg.x} cy={lastSvg.y} r={6} fill={colors.blue} stroke="#fff" strokeWidth={2} />
                </>
              )}
            </Svg>
          )}

          {/* Status overlay */}
          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>
              {state === 'idle' && 'Tap Start to begin tracking'}
              {state === 'tracking' && 'Recording GPS path...'}
              {state === 'paused' && 'Paused'}
              {state === 'complete' && `${points.length} points recorded`}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(elapsed)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{points.length}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {gpsStats.accuracy !== null ? `±${Math.round(gpsStats.accuracy)}m` : '—'}
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {gpsStats.elevation !== null ? `${Math.round(gpsStats.elevation)}m` : '—'}
            </Text>
            <Text style={styles.statLabel}>Elevation</Text>
          </View>
        </View>

        {/* GPS quality hint */}
        {state === 'tracking' && points.length === 0 && elapsed > 5 && (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>
              Waiting for GPS signal... If indoors, try moving near a window or going outside.
            </Text>
          </View>
        )}

        {/* Area display when 3+ points */}
        {points.length >= 3 && (
          <View style={styles.areaBanner}>
            <Text style={styles.areaLabel}>Estimated Area</Text>
            <Text style={styles.areaValue}>{areaHa.toFixed(2)} ha</Text>
          </View>
        )}

        {/* Controls — depend on state */}
        {state === 'idle' && (
          <Button variant="primary" onPress={handleStart} style={styles.fullBtn}>
            <StartIcon />
            <Text style={styles.primaryBtnText}>Start Tracking</Text>
          </Button>
        )}

        {state === 'tracking' && (
          <View style={styles.controlRow}>
            <Button variant="warn" onPress={handlePause} style={{ flex: 1 }}>
              <PauseIcon />
              <Text style={styles.warnBtnText}>Pause</Text>
            </Button>
            <Button variant="primary" onPress={handleFinish} style={{ flex: 1 }}>
              <StopIcon />
              <Text style={styles.primaryBtnText}>Finish</Text>
            </Button>
          </View>
        )}

        {state === 'paused' && (
          <View style={styles.controlRow}>
            <Button onPress={handleResume} style={{ flex: 1 }}>
              <PlayIcon />
              <Text style={styles.defaultBtnText}>Resume</Text>
            </Button>
            <Button variant="primary" onPress={handleFinish} style={{ flex: 1 }}>
              <StopIcon />
              <Text style={styles.primaryBtnText}>Finish</Text>
            </Button>
          </View>
        )}

        {/* Attribute form (shown on complete) */}
        {state === 'complete' && (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Polygon Attributes</Text>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{POLY_FIELDS.poly_name.label} *</Text>
              <TextInput
                style={styles.textInput}
                placeholder={POLY_FIELDS.poly_name.placeholder}
                placeholderTextColor={colors.text3}
                value={form.poly_name}
                onChangeText={(v) => setForm((f) => ({ ...f, poly_name: v }))}
              />
            </View>

            {/* Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{POLY_FIELDS.plantstart.label} *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text3}
                value={form.plantstart}
                onChangeText={(v) => setForm((f) => ({ ...f, plantstart: v }))}
              />
            </View>

            {/* Select fields */}
            {(['practice', 'target_sys', 'distr'] as const).map((key) => (
              <View key={key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{POLY_FIELDS[key].label} *</Text>
                <View style={styles.optionRow}>
                  {SELECT_OPTIONS[key].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setForm((f) => ({ ...f, [key]: opt }))}
                      style={[styles.optionChip, form[key] === opt && styles.optionChipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionText, form[key] === opt && styles.optionTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Tree count */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{POLY_FIELDS.num_trees.label}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={POLY_FIELDS.num_trees.placeholder}
                placeholderTextColor={colors.text3}
                value={form.num_trees}
                onChangeText={(v) => setForm((f) => ({ ...f, num_trees: v }))}
                keyboardType="numeric"
              />
            </View>

            {/* Save */}
            <Button variant="primary" onPress={handleSave} disabled={saving} style={styles.fullBtn}>
              <SaveIcon />
              <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Save Polygon'}</Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Icons ───

function StartIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M13 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7 21l3-9 3 3v6M14 13l2-3-3-3-3 3" stroke={colors.bg} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PauseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h4v16H6zM14 4h4v16h-4z" stroke={colors.amber} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlayIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 3l14 9-14 9V3z" stroke={colors.text1} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StopIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke={colors.bg} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SaveIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" stroke={colors.bg} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Styles ───

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
  // Map
  mapContainer: {
    height: 200,
    borderRadius: 13,
    backgroundColor: '#0b1810',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  startMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(8,13,10,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapOverlayText: {
    fontSize: 10,
    color: colors.text3,
    fontVariant: ['tabular-nums'],
  },
  // Stats
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text1,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 9,
    color: colors.text3,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  // Hint
  hintBanner: {
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  hintText: {
    fontSize: 11,
    color: colors.amber,
    textAlign: 'center',
  },
  // Area
  areaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.greenBg,
    borderWidth: 1,
    borderColor: colors.greenDim,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  areaLabel: {
    fontSize: 11,
    color: colors.text3,
  },
  areaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.green,
    fontVariant: ['tabular-nums'],
  },
  // Controls
  controlRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fullBtn: {
    width: '100%',
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bg,
  },
  warnBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.amber,
  },
  defaultBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text1,
  },
  // Form
  formSection: {
    marginTop: 14,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text1,
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.text1,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.greenBg2,
    borderColor: colors.green,
  },
  optionText: {
    fontSize: 11,
    color: colors.text3,
  },
  optionTextActive: {
    color: colors.green,
    fontWeight: '700',
  },
});
