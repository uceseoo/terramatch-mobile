import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import Svg, { Path, Circle, Line, Polygon as SvgPolygon } from 'react-native-svg';
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import Header from '../components/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { getSiteById, getPolygonsForSite } from '../database/queries';
import { pickAndImportGeoJSON, exportGeoJSON } from '../services/geojson';
import type { RootStackParamList, Polygon, Site } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Site'>;
type Route = RouteProp<RootStackParamList, 'Site'>;

// ─── Icons ───
function PlusIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={colors.bg} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function PolygonIcon({ size = 28, color = colors.text3 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6l4-3 8 2 4 5-2 8-6 2-6-4z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M13 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7 21l3-9 3 3v6M14 13l2-3-3-3-3 3" stroke={colors.green} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GpsIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={colors.green} strokeWidth={1.6} />
      <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={colors.green} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function CamIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={colors.green} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={4} stroke={colors.green} strokeWidth={1.6} />
    </Svg>
  );
}

function FileDownIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M12 12v6M9 15l3 3 3-3" stroke={colors.text1} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FileUpIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M12 18v-6M9 15l3-3 3 3" stroke={colors.text1} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={colors.text3} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function MyLocIcon({ active }: { active: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={active ? colors.blue : colors.text3} strokeWidth={1.6} />
      <Path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke={active ? colors.blue : colors.text3} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

interface SiteData extends Site {
  polygonCount: number;
  projectName: string;
}

interface UploadResult {
  valid: boolean;
  errors: string[];
  totalImported: number;
  totalSkipped: number;
}

export default function SiteScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { siteId, projectName } = route.params;

  const [site, setSite] = useState<SiteData | null>(null);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [showCollect, setShowCollect] = useState(false);
  const [myLocVisible, setMyLocVisible] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [siteId])
  );

  const loadData = async () => {
    const s = await getSiteById(siteId);
    setSite(s);
    const p = await getPolygonsForSite(siteId);
    setPolygons(p);
  };

  // ─── Download GeoJSON ───
  const handleDownload = async () => {
    if (polygons.length === 0) {
      Alert.alert('No Data', 'No polygons to download');
      return;
    }
    const result = await exportGeoJSON(polygons, site?.name || '', projectName);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
  };

  // ─── Upload GeoJSON ───
  const handleUpload = async () => {
    try {
      const result = await pickAndImportGeoJSON(siteId);
      if (result.totalImported === 0 && result.errors.length === 0) return; // cancelled
      setUploadResult({
        valid: result.valid,
        errors: result.errors,
        totalImported: result.totalImported,
        totalSkipped: result.totalSkipped,
      });
      await loadData(); // refresh polygon list
    } catch (err) {
      setUploadResult({
        valid: false,
        errors: [`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`],
        totalImported: 0,
        totalSkipped: 0,
      });
    }
  };

  if (!site) return null;

  return (
    <View style={styles.container}>
      <Header
        title={site.name}
        subtitle={projectName}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            onPress={() => setShowCollect(!showCollect)}
            style={styles.collectBtn}
            activeOpacity={0.7}
          >
            <PlusIcon />
            <Text style={styles.collectBtnText}>Collect</Text>
          </TouchableOpacity>
        }
      />

      {/* Collect Dropdown Modal */}
      <Modal visible={showCollect} transparent animationType="fade" onRequestClose={() => setShowCollect(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCollect(false)}>
          <View style={styles.collectMenu}>
            {[
              { icon: <WalkIcon />, label: 'Track Polygon', desc: 'Walk & trace boundary', onPress: () => { setShowCollect(false); navigation.navigate('TrackPolygon', { siteId }); } },
              { icon: <GpsIcon />, label: 'Collect Point', desc: 'Drop a GPS point', onPress: () => { setShowCollect(false); navigation.navigate('CollectPoint', { siteId }); } },
              { icon: <CamIcon />, label: 'Capture Photo', desc: 'Geotagged photo', onPress: () => { setShowCollect(false); Alert.alert('Photo Captured', 'Photo captured with GPS tag!'); } },
            ].map((item, i) => (
              <TouchableOpacity key={i} onPress={item.onPress} style={styles.collectItem} activeOpacity={0.7}>
                <View style={styles.collectItemIcon}>{item.icon}</View>
                <View>
                  <Text style={styles.collectItemLabel}>{item.label}</Text>
                  <Text style={styles.collectItemDesc}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.scroll}>
        {/* Site Map Mockup */}
        <View style={styles.mapContainer}>
          {/* Grid background */}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {Array.from({ length: 18 }).map((_, i) => (
              <Line key={`h${i}`} x1="0" y1={i * 10} x2="400" y2={i * 10} stroke={colors.green} strokeWidth={0.5} opacity={0.12} />
            ))}
            {Array.from({ length: 40 }).map((_, i) => (
              <Line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="200" stroke={colors.green} strokeWidth={0.5} opacity={0.12} />
            ))}
          </Svg>
          {/* Rendered polygons */}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            {polygons.map((pg, i) => {
              const shapes = [
                '40,30 75,18 95,40 85,75 50,70',
                '105,25 140,22 150,55 130,78 98,60',
                '170,30 205,18 225,40 215,75 180,70',
                '235,25 270,22 280,55 260,78 228,60',
              ];
              const col = pg.status === 'approved' ? colors.ok : pg.status === 'needs-review' ? colors.amber : colors.green;
              return (
                <SvgPolygon key={pg.id} points={shapes[i % 4]} fill={col} fillOpacity={0.15} stroke={col} strokeWidth={1.5} />
              );
            })}
            {/* My location */}
            {myLocVisible && (
              <>
                <Circle cx={185} cy={75} r={12} fill={colors.blue} opacity={0.15} />
                <Circle cx={185} cy={75} r={5} fill={colors.blue} stroke="#fff" strokeWidth={2} />
              </>
            )}
          </Svg>
          {/* My location toggle */}
          <View style={styles.mapControls}>
            <TouchableOpacity
              onPress={() => setMyLocVisible(!myLocVisible)}
              style={[styles.mapBtn, myLocVisible && styles.mapBtnActive]}
            >
              <MyLocIcon active={myLocVisible} />
            </TouchableOpacity>
          </View>
          {/* Map label */}
          <View style={styles.mapLabel}>
            <Text style={styles.mapLabelText}>
              {polygons.length} polygons{myLocVisible ? ' · Live' : ''}
            </Text>
          </View>
        </View>

        {/* Download / Upload bar */}
        <View style={styles.ioBar}>
          <Button small onPress={handleDownload} style={styles.ioBtn}>
            <FileDownIcon />
            <Text style={styles.ioBtnText}>Download GeoJSON</Text>
          </Button>
          <Button small onPress={handleUpload} style={styles.ioBtn}>
            <FileUpIcon />
            <Text style={styles.ioBtnText}>Upload GeoJSON</Text>
          </Button>
        </View>

        {/* Upload result banner */}
        {uploadResult && (
          <View style={[styles.uploadBanner, uploadResult.valid ? styles.uploadBannerOk : styles.uploadBannerErr]}>
            <View style={styles.uploadBannerHeader}>
              <Text style={[styles.uploadBannerTitle, { color: uploadResult.valid ? colors.ok : colors.red }]}>
                {uploadResult.valid
                  ? `Imported ${uploadResult.totalImported} polygons`
                  : 'Import completed with issues'}
              </Text>
              <TouchableOpacity onPress={() => setUploadResult(null)} style={{ padding: 2 }}>
                <CloseIcon />
              </TouchableOpacity>
            </View>
            {uploadResult.totalImported > 0 && !uploadResult.valid && (
              <Text style={styles.uploadImported}>{uploadResult.totalImported} polygons imported successfully</Text>
            )}
            {uploadResult.totalSkipped > 0 && (
              <Text style={styles.uploadSkipped}>{uploadResult.totalSkipped} features skipped</Text>
            )}
            {uploadResult.errors.length > 0 && (
              <View>
                {uploadResult.errors.slice(0, 5).map((err, i) => (
                  <Text key={i} style={styles.uploadError}>• {err}</Text>
                ))}
                {uploadResult.errors.length > 5 && (
                  <Text style={styles.uploadMore}>...and {uploadResult.errors.length - 5} more</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Polygon list */}
        <View style={styles.polySection}>
          <Text style={styles.sectionHeader}>Polygons</Text>
          {polygons.length === 0 ? (
            <View style={styles.emptyState}>
              <PolygonIcon size={28} color={colors.text3} />
              <Text style={styles.emptyTitle}>No polygons yet.</Text>
              <Text style={styles.emptyHint}>
                Tap <Text style={{ color: colors.green, fontWeight: '700' }}>+ Collect</Text> or{' '}
                <Text style={{ color: colors.text1, fontWeight: '700' }}>Upload GeoJSON</Text>
              </Text>
            </View>
          ) : (
            polygons.map((pg) => (
              <Card
                key={pg.id}
                onPress={() => navigation.navigate('PolygonDetail', { polygonId: pg.id })}
              >
                <View style={styles.polyHeader}>
                  <Text style={styles.polyName} numberOfLines={1}>{pg.poly_name}</Text>
                  <Badge status={pg.status} />
                </View>
                <View style={styles.polyMeta}>
                  <Text style={styles.polyMetaText}>{pg.practice}</Text>
                  <Text style={styles.polyMetaDot}>·</Text>
                  <Text style={styles.polyMetaText}>{pg.target_sys}</Text>
                  <Text style={styles.polyMetaDot}>·</Text>
                  <Text style={styles.polyMetaText}>{pg.num_trees.toLocaleString()} trees</Text>
                </View>
              </Card>
            ))
          )}
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
  // Collect button in header
  collectBtn: {
    backgroundColor: colors.green,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  collectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bg,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 18,
  },
  collectMenu: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 6,
    minWidth: 195,
  },
  collectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  collectItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.greenBg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text1,
  },
  collectItemDesc: {
    fontSize: 10,
    color: colors.text3,
  },
  // Map
  mapContainer: {
    marginHorizontal: 18,
    marginTop: 14,
    height: 160,
    borderRadius: 13,
    backgroundColor: '#0b1810',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mapControls: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  mapBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(8,13,10,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blueBg,
  },
  mapLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  mapLabelText: {
    fontSize: 10,
    color: colors.text3,
    backgroundColor: 'rgba(8,13,10,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  // Download / Upload
  ioBar: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 12,
  },
  ioBtn: {
    flex: 1,
  },
  ioBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text1,
  },
  // Upload result
  uploadBanner: {
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 12,
    borderRadius: 11,
    borderWidth: 1,
  },
  uploadBannerOk: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  uploadBannerErr: {
    backgroundColor: colors.redBg,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  uploadBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  uploadImported: {
    fontSize: 11,
    color: colors.ok,
    marginTop: 4,
  },
  uploadSkipped: {
    fontSize: 11,
    color: colors.amber,
    marginTop: 4,
  },
  uploadError: {
    fontSize: 10,
    color: colors.red,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  uploadMore: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 2,
  },
  // Polygon section
  polySection: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text3,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  emptyState: {
    padding: 28,
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 8,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 11,
    color: colors.text3,
    textAlign: 'center',
  },
  polyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  polyName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text1,
    flex: 1,
    marginRight: 8,
  },
  polyMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  polyMetaText: {
    fontSize: 10,
    color: colors.text3,
  },
  polyMetaDot: {
    fontSize: 10,
    color: colors.text3,
  },
});
