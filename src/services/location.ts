import * as Location from 'expo-location';

export interface GPSPoint {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
}

export interface GPSStats {
  accuracy: number | null;
  elevation: number | null;
  speed: number | null;
}

/**
 * Request foreground location permissions.
 * Returns true if granted.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Get a single high-accuracy location fix.
 */
export async function getCurrentLocation(): Promise<GPSPoint> {
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    altitude: loc.coords.altitude,
    altitudeAccuracy: loc.coords.altitudeAccuracy,
  };
}

/**
 * Start watching position with a callback.
 * Returns a subscription that can be removed to stop tracking.
 *
 * @param onUpdate Called with each new GPS fix (always called — no filtering)
 * @param onStats Called with GPS stats on every reading, regardless of accuracy
 */
export async function startTracking(
  onUpdate: (point: GPSPoint, stats: GPSStats) => void,
  onStats?: (stats: GPSStats) => void
): Promise<Location.LocationSubscription> {
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      distanceInterval: 0, // report every update regardless of distance
      timeInterval: 1000, // ms between updates
    },
    (loc) => {
      const point: GPSPoint = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        altitude: loc.coords.altitude,
        altitudeAccuracy: loc.coords.altitudeAccuracy,
      };
      const stats: GPSStats = {
        accuracy: loc.coords.accuracy,
        elevation: loc.coords.altitude,
        speed: loc.coords.speed,
      };

      // Always report stats
      onStats?.(stats);

      // Always accept the point — let the UI decide what to do with low-accuracy data
      onUpdate(point, stats);
    }
  );
  return subscription;
}
