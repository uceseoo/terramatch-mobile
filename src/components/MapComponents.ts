/**
 * Platform-safe re-export of react-native-maps.
 *
 * On native (iOS/Android): exports the real MapView, Marker, Polygon, Polyline, etc.
 * On web: exports null placeholders so the bundler doesn't choke.
 *
 * Each screen checks `isNativeMap` before rendering MapView components,
 * and falls back to the existing SVG visualization on web.
 */
import { Platform } from 'react-native';

export const isNativeMap = Platform.OS !== 'web';

// Conditionally require to avoid web bundler errors
let RNMapView: any = null;
let RNMarker: any = null;
let RNPolygon: any = null;
let RNPolyline: any = null;
let RNCircle: any = null;
let PROVIDER_GOOGLE: any = null;

if (isNativeMap) {
  try {
    const Maps = require('react-native-maps');
    RNMapView = Maps.default;
    RNMarker = Maps.Marker;
    RNPolygon = Maps.Polygon;
    RNPolyline = Maps.Polyline;
    RNCircle = Maps.Circle;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch {
    // react-native-maps not available — stay with SVG fallback
  }
}

export {
  RNMapView as MapView,
  RNMarker as Marker,
  RNPolygon as Polygon,
  RNPolyline as Polyline,
  RNCircle as Circle,
  PROVIDER_GOOGLE,
};
