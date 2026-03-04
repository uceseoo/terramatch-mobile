import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, Alert, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import Header from '../components/Header';
import Button from '../components/Button';
import { requestLocationPermission, getCurrentLocation, type GPSPoint } from '../services/location';
import { getDatabase } from '../database/db';
import type { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CapturePhoto'>;
type Route = RouteProp<RootStackParamList, 'CapturePhoto'>;

export default function CapturePhotoScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { siteId } = route.params;

  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [location, setLocation] = useState<GPSPoint | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    acquireLocationAndPhoto();
  }, []);

  const acquireLocationAndPhoto = async () => {
    // Request permissions in parallel
    const [locGranted, camResult] = await Promise.all([
      requestLocationPermission(),
      ImagePicker.requestCameraPermissionsAsync(),
    ]);

    if (!locGranted) {
      Alert.alert('Permission Needed', 'Location permission is required to geotag photos.');
    }

    // Get location in background
    if (locGranted) {
      try {
        const loc = await getCurrentLocation();
        setLocation(loc);
      } catch {
        // Location will show as unavailable
      }
    }

    // Launch camera
    if (camResult.status === 'granted') {
      launchCamera();
    } else {
      // Fall back to image picker (works on web)
      launchPicker();
    }
  };

  const launchCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPhoto({ uri: result.assets[0].uri });
        // Try to get fresh location at capture time
        try {
          const loc = await getCurrentLocation();
          setLocation(loc);
        } catch {}
      } else {
        // User cancelled camera — go back
        navigation.goBack();
      }
    } catch {
      // Camera not available (e.g. web), fall back to picker
      launchPicker();
    }
  };

  const launchPicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPhoto({ uri: result.assets[0].uri });
        // Try to get location
        try {
          const loc = await getCurrentLocation();
          setLocation(loc);
        } catch {}
      } else {
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Could not access photos.');
      navigation.goBack();
    }
  };

  const handleRetake = () => {
    setPhoto(null);
    setSaved(false);
    launchCamera();
  };

  const handleSave = async () => {
    if (!photo) return;
    setSaving(true);

    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO photos (site_id, file_path, latitude, longitude, accuracy, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          siteId,
          photo.uri,
          location?.latitude ?? null,
          location?.longitude ?? null,
          location?.accuracy ?? null,
          note.trim() || null,
        ]
      );

      setSaved(true);
    } catch {
      Alert.alert('Save Error', 'Failed to save photo.');
    } finally {
      setSaving(false);
    }
  };

  if (!photo) {
    return (
      <View style={styles.container}>
        <Header title="Capture Photo" subtitle="Opening camera..." onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <CamIconLarge />
          <Text style={styles.loadingText}>Waiting for camera...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Capture Photo"
        subtitle="Geotagged photo"
        onBack={() => {
          if (!saved && photo) {
            Alert.alert('Discard Photo?', 'This photo has not been saved.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Discard', onPress: () => navigation.goBack() },
            ]);
          } else {
            navigation.goBack();
          }
        }}
      />

      <View style={styles.content}>
        {/* Photo preview */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
          {/* GPS tag overlay */}
          <View style={styles.gpsTag}>
            <GpsIcon />
            <Text style={styles.gpsTagText}>
              {location
                ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                : 'No GPS'}
            </Text>
          </View>
        </View>

        {/* Location info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Latitude</Text>
            <Text style={styles.infoValue}>
              {location ? location.latitude.toFixed(6) : '—'}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Longitude</Text>
            <Text style={styles.infoValue}>
              {location ? location.longitude.toFixed(6) : '—'}
            </Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <Text style={styles.infoLabel}>Accuracy</Text>
            <Text style={styles.infoValue}>
              {location?.accuracy != null ? `±${Math.round(location.accuracy)}m` : '—'}
            </Text>
          </View>
        </View>

        {/* Note */}
        {!saved && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Describe what you see..."
              placeholderTextColor={colors.text3}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        {/* Saved banner */}
        {saved && (
          <View style={styles.savedBanner}>
            <SavedCheckIcon />
            <Text style={styles.savedText}>Photo saved with GPS tag!</Text>
          </View>
        )}

        {/* Actions */}
        {saved ? (
          <Button variant="primary" onPress={() => navigation.goBack()} style={styles.fullBtn}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </Button>
        ) : (
          <View style={styles.actionRow}>
            <Button onPress={handleRetake} style={{ flex: 1 }}>
              <RetakeIcon />
              <Text style={styles.defaultBtnText}>Retake</Text>
            </Button>
            <Button
              variant="primary"
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 1 }}
            >
              <SaveIcon />
              <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Save Photo'}</Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Icons ───

function CamIconLarge() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={colors.text3} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={4} stroke={colors.text3} strokeWidth={1.2} />
    </Svg>
  );
}

function GpsIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={colors.blue} strokeWidth={1.6} />
      <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={colors.blue} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function RetakeIcon() {
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

function SavedCheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke={colors.ok} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 4L12 14.01l-3-3" stroke={colors.ok} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.text3,
  },
  // Photo
  photoContainer: {
    height: 220,
    borderRadius: 13,
    backgroundColor: '#0b1810',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  gpsTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(8,13,10,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gpsTagText: {
    fontSize: 10,
    color: colors.blue,
    fontVariant: ['tabular-nums'],
  },
  // Info card
  infoCard: {
    borderRadius: 12,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.text3,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
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
  // Saved
  savedBanner: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  savedText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ok,
  },
  // Actions
  fullBtn: {
    width: '100%',
  },
  actionRow: {
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
