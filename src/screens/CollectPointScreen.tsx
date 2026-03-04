import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import Header from '../components/Header';
import Button from '../components/Button';
import { requestLocationPermission, getCurrentLocation, type GPSPoint } from '../services/location';
import { getDatabase } from '../database/db';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CollectPoint'>;
type Route = RouteProp<RootStackParamList, 'CollectPoint'>;

export default function CollectPointScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { siteId } = route.params;

  const [location, setLocation] = useState<GPSPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    acquireLocation();
  }, []);

  const acquireLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      Alert.alert('Permission Denied', 'Location permission is required to collect points.');
      return;
    }

    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch {
      Alert.alert('GPS Error', 'Could not get your location. Please check GPS settings and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      setCaptured(true);
    } catch {
      Alert.alert('GPS Error', 'Could not capture location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!location) return;
    setSaving(true);

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO points (site_id, latitude, longitude, accuracy, elevation, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          location.latitude,
          location.longitude,
          location.accuracy,
          location.altitude,
          note.trim() || null,
        ]
      );

      // Show inline saved state immediately
      setSaved(true);

      // Also show alert with option to go back
      Alert.alert(
        'Point Saved',
        `GPS point saved at ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Save Error', 'Failed to save point.');
    } finally {
      setSaving(false);
    }
  };

  const MAP_SIZE = 220;
  const CENTER = MAP_SIZE / 2;

  return (
    <View style={styles.container}>
      <Header
        title="Collect Point"
        subtitle="Drop a GPS point"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* Map with crosshair */}
        <View style={styles.mapContainer}>
          <Svg width="100%" height="100%">
            {/* Grid */}
            {Array.from({ length: 24 }).map((_, i) => (
              <Line key={`h${i}`} x1="0" y1={i * 10} x2={MAP_SIZE * 2} y2={i * 10} stroke={colors.green} strokeWidth={0.3} opacity={0.15} />
            ))}
            {Array.from({ length: 40 }).map((_, i) => (
              <Line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2={MAP_SIZE * 2} stroke={colors.green} strokeWidth={0.3} opacity={0.15} />
            ))}

            {/* Crosshair */}
            <Line x1={CENTER} y1={CENTER - 30} x2={CENTER} y2={CENTER - 8} stroke={colors.text3} strokeWidth={1} opacity={0.6} />
            <Line x1={CENTER} y1={CENTER + 8} x2={CENTER} y2={CENTER + 30} stroke={colors.text3} strokeWidth={1} opacity={0.6} />
            <Line x1={CENTER - 30} y1={CENTER} x2={CENTER - 8} y2={CENTER} stroke={colors.text3} strokeWidth={1} opacity={0.6} />
            <Line x1={CENTER + 8} y1={CENTER} x2={CENTER + 30} y2={CENTER} stroke={colors.text3} strokeWidth={1} opacity={0.6} />

            {/* Location dot */}
            {location && (
              <>
                <Circle cx={CENTER} cy={CENTER} r={20} fill={colors.blue} opacity={0.12} />
                <Circle cx={CENTER} cy={CENTER} r={8} fill={colors.blue} stroke="#fff" strokeWidth={2.5} />
              </>
            )}

            {/* Captured indicator */}
            {captured && (
              <>
                <Circle cx={CENTER} cy={CENTER} r={16} fill="none" stroke={colors.ok} strokeWidth={2} opacity={0.6} />
                <Path
                  d={`M${CENTER - 5},${CENTER} L${CENTER - 1},${CENTER + 4} L${CENTER + 6},${CENTER - 4}`}
                  stroke={colors.ok}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </>
            )}
          </Svg>

          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Acquiring GPS...</Text>
            </View>
          )}
        </View>

        {/* Coordinate display */}
        <View style={styles.coordCard}>
          <View style={styles.coordRow}>
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <Text style={styles.coordValue}>
                {location ? location.latitude.toFixed(6) : '—'}
              </Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <Text style={styles.coordValue}>
                {location ? location.longitude.toFixed(6) : '—'}
              </Text>
            </View>
          </View>
          <View style={[styles.coordRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Accuracy</Text>
              <Text style={styles.coordValue}>
                {location?.accuracy !== null && location?.accuracy !== undefined
                  ? `±${Math.round(location.accuracy)}m`
                  : '—'}
              </Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>Altitude</Text>
              <Text style={styles.coordValue}>
                {location?.altitude !== null && location?.altitude !== undefined
                  ? `${Math.round(location.altitude)}m`
                  : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Note input (shown after capture) */}
        {captured && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a description..."
              placeholderTextColor={colors.text3}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        {/* Saved confirmation banner */}
        {saved && (
          <View style={styles.savedBanner}>
            <View style={styles.savedBannerContent}>
              <SavedCheckIcon />
              <Text style={styles.savedText}>Point saved successfully!</Text>
            </View>
            <Button variant="primary" onPress={() => navigation.goBack()} style={styles.doneBtn}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </Button>
          </View>
        )}

        {/* Actions */}
        {saved ? null : !captured ? (
          <Button
            variant="primary"
            onPress={handleCapture}
            disabled={loading || !location}
            style={styles.actionBtn}
          >
            <CaptureIcon />
            <Text style={styles.primaryBtnText}>
              {loading ? 'Getting Location...' : 'Capture Point'}
            </Text>
          </Button>
        ) : (
          <View style={styles.capturedActions}>
            <Button onPress={handleCapture} style={{ flex: 1 }}>
              <RefreshIcon />
              <Text style={styles.defaultBtnText}>Recapture</Text>
            </Button>
            <Button
              variant="primary"
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 1 }}
            >
              <SaveIcon />
              <Text style={styles.primaryBtnText}>
                {saving ? 'Saving...' : 'Save Point'}
              </Text>
            </Button>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Icons ───

function SavedCheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={colors.ok} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 4L12 14.01l-3-3" stroke={colors.ok} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CaptureIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={colors.bg} strokeWidth={1.6} />
      <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={colors.bg} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function RefreshIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4v6h-6M1 20v-6h6" stroke={colors.text1} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={colors.text1} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
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
  content: {
    flex: 1,
    padding: 18,
    paddingTop: 14,
  },
  // Map
  mapContainer: {
    height: 220,
    borderRadius: 13,
    backgroundColor: '#0b1810',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(8,13,10,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  loadingText: {
    fontSize: 10,
    color: colors.amber,
    fontVariant: ['tabular-nums'],
  },
  // Coordinates
  coordCard: {
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  coordRow: {
    flexDirection: 'row',
  },
  coordItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  coordDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  coordLabel: {
    fontSize: 9,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text1,
    fontVariant: ['tabular-nums'],
  },
  // Note
  noteSection: {
    marginBottom: 14,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.text1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Saved banner
  savedBanner: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
    gap: 10,
  },
  savedBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ok,
  },
  doneBtn: {
    width: '100%',
  },
  // Actions
  actionBtn: {
    width: '100%',
  },
  capturedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bg,
  },
  defaultBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text1,
  },
});
