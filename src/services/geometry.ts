/**
 * Geometry utilities for polygon calculations.
 * All coordinate pairs are [longitude, latitude] (GeoJSON standard).
 */

/**
 * Calculate the area of a polygon using the Shoelace formula.
 * Applies a cos(lat) correction for equatorial Africa projection.
 *
 * @param coords Array of [lng, lat] pairs (ring does NOT need to be closed)
 * @returns Area in hectares
 */
export function calculateAreaHectares(coords: number[][]): number {
  if (coords.length < 3) return 0;

  // Close the ring if not already closed
  const ring = [...coords];
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([...first]);
  }

  // Shoelace formula in degrees, with cos(lat) correction
  // Average latitude for the projection correction
  const avgLat = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
  const cosLat = Math.cos((avgLat * Math.PI) / 180);

  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const x1 = ring[i][0] * cosLat;
    const y1 = ring[i][1];
    const x2 = ring[i + 1][0] * cosLat;
    const y2 = ring[i + 1][1];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area) / 2;

  // Convert from square degrees to hectares
  // 1 degree ≈ 111,320 meters at equator
  const metersPerDeg = 111_320;
  const sqMeters = area * metersPerDeg * metersPerDeg;
  return sqMeters / 10_000; // hectares
}

/**
 * Close a polygon ring by appending the first point if needed.
 * @param coords Array of [lng, lat] pairs
 * @returns Closed ring
 */
export function closeRing(coords: number[][]): number[][] {
  if (coords.length < 2) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return coords;
  }
  return [...coords, [...first]];
}

/**
 * Calculate the distance between two points in meters using the Haversine formula.
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Convert lat/lng coordinates to SVG viewbox coordinates for rendering.
 * Returns scaled x,y pairs that fit within the given width/height with padding.
 */
export function coordsToSVG(
  coords: number[][],
  width: number,
  height: number,
  padding: number = 20
): { x: number; y: number }[] {
  if (coords.length === 0) return [];

  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const lngRange = maxLng - minLng || 0.0001;
  const latRange = maxLat - minLat || 0.0001;

  const drawW = width - padding * 2;
  const drawH = height - padding * 2;

  return coords.map((c) => ({
    x: padding + ((c[0] - minLng) / lngRange) * drawW,
    // Flip Y axis (lat increases upward, SVG y increases downward)
    y: padding + ((maxLat - c[1]) / latRange) * drawH,
  }));
}
