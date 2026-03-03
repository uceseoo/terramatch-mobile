import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { REQUIRED_ATTRS } from '../constants/schema';
import { createPolygon, type CreatePolygonData } from '../database/queries';
import type { Polygon } from '../types';

// ═══ GeoJSON Types ═══

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSONCollection {
  type: 'FeatureCollection';
  name?: string;
  features: GeoJSONFeature[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  features: ParsedFeature[];
  totalImported: number;
  totalSkipped: number;
}

interface ParsedFeature {
  poly_name: string;
  plantstart: string;
  practice: string;
  target_sys: string;
  distr: string;
  num_trees: number;
  status: string;
  pointCount: number;
  coordinates: number[][];
}

// ═══ Validation ═══

export function validateGeoJSON(raw: string): ValidationResult {
  let geojson: GeoJSONCollection;

  try {
    geojson = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ['Invalid JSON file'], features: [], totalImported: 0, totalSkipped: 0 };
  }

  if (!geojson || geojson.type !== 'FeatureCollection') {
    return { valid: false, errors: ['Not a valid GeoJSON FeatureCollection'], features: [], totalImported: 0, totalSkipped: 0 };
  }

  if (!geojson.features || !Array.isArray(geojson.features)) {
    return { valid: false, errors: ['No features array found'], features: [], totalImported: 0, totalSkipped: 0 };
  }

  const errors: string[] = [];
  const validFeatures: ParsedFeature[] = [];

  geojson.features.forEach((f, i) => {
    const fErrors: string[] = [];

    if (!f.geometry || (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon')) {
      fErrors.push(`Feature ${i + 1}: geometry must be Polygon or MultiPolygon`);
    }

    const props = f.properties || {};
    REQUIRED_ATTRS.forEach((attr) => {
      if (!props[attr] && attr !== 'num_trees') {
        fErrors.push(`Feature ${i + 1}: missing "${attr}"`);
      }
    });

    if (fErrors.length === 0) {
      const coords = f.geometry?.coordinates?.[0] as number[][] || [];
      validFeatures.push({
        poly_name: (props.poly_name as string) || `Imported-${i + 1}`,
        plantstart: (props.plantstart as string) || '',
        practice: (props.practice as string) || '',
        target_sys: (props.target_sys as string) || '',
        distr: (props.distr as string) || '',
        num_trees: Number(props.num_trees) || 0,
        status: 'draft',
        pointCount: coords.length,
        coordinates: coords,
      });
    } else {
      errors.push(...fErrors);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    features: validFeatures,
    totalImported: validFeatures.length,
    totalSkipped: geojson.features.length - validFeatures.length,
  };
}

// ═══ Import (Upload) ═══

export async function pickAndImportGeoJSON(siteId: number): Promise<ValidationResult & { savedIds: number[] }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'application/geo+json'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { valid: true, errors: [], features: [], totalImported: 0, totalSkipped: 0, savedIds: [] };
  }

  const fileUri = result.assets[0].uri;
  const pickedFile = new File(fileUri);
  const content = await pickedFile.text();
  const validation = validateGeoJSON(content);

  const savedIds: number[] = [];
  for (const feature of validation.features) {
    const id = await createPolygon({
      site_id: siteId,
      poly_name: feature.poly_name,
      plantstart: feature.plantstart,
      practice: feature.practice,
      target_sys: feature.target_sys,
      distr: feature.distr,
      num_trees: feature.num_trees,
      status: 'draft',
      coordinates: JSON.stringify(feature.coordinates),
      point_count: feature.pointCount,
    });
    savedIds.push(id);
  }

  return { ...validation, savedIds };
}

// ═══ Export (Download) ═══

function polygonsToGeoJSON(polygons: Polygon[], siteName: string, projectName: string): GeoJSONCollection {
  return {
    type: 'FeatureCollection',
    name: `${projectName} - ${siteName}`,
    features: polygons.map((pg) => {
      let coords: number[][] = [];
      if (pg.coordinates) {
        try {
          coords = JSON.parse(pg.coordinates);
        } catch {
          // Generate placeholder coordinates if parse fails
          coords = [
            [36.817, -1.286],
            [36.820, -1.284],
            [36.822, -1.288],
            [36.818, -1.290],
            [36.817, -1.286],
          ];
        }
      }

      return {
        type: 'Feature' as const,
        properties: {
          poly_name: pg.poly_name,
          plantstart: pg.plantstart,
          practice: pg.practice,
          target_sys: pg.target_sys,
          distr: pg.distr,
          num_trees: pg.num_trees,
          status: pg.status,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      };
    }),
  };
}

export async function exportGeoJSON(
  polygons: Polygon[],
  siteName: string,
  projectName: string
): Promise<{ success: boolean; message: string }> {
  if (polygons.length === 0) {
    return { success: false, message: 'No polygons to download' };
  }

  const geojson = polygonsToGeoJSON(polygons, siteName, projectName);
  const fileName = `${projectName}_${siteName}_polygons.geojson`.replace(/\s+/g, '_');
  const file = new File(Paths.cache, fileName);
  file.write(JSON.stringify(geojson, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/geo+json',
      dialogTitle: `Export ${polygons.length} polygons`,
    });
  }

  return {
    success: true,
    message: `Exported ${polygons.length} polygons as GeoJSON`,
  };
}
