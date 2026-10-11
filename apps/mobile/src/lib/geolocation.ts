import * as Location from 'expo-location';
import { Platform } from 'react-native';

export const SAINT_BRIEUC_REGION = {
  latitude: 48.5142,
  longitude: -2.7658,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export type LocationResult =
  | { status: 'granted'; latitude: number; longitude: number; accuracyM: number | null }
  | { status: 'denied'; reason: 'permission' | 'unavailable' | 'error' };

export async function requestApproximateLocation(): Promise<LocationResult> {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return { status: 'denied', reason: 'unavailable' };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            status: 'granted',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyM: position.coords.accuracy ?? null,
          }),
        () => resolve({ status: 'denied', reason: 'permission' }),
        { enableHighAccuracy: false, maximumAge: 300_000, timeout: 8_000 },
      );
    });
  }
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) {
      return { status: 'denied', reason: 'permission' };
    }
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: true,
    });
    return {
      status: 'granted',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracyM: position.coords.accuracy ?? null,
    };
  } catch {
    return { status: 'denied', reason: 'error' };
  }
}

export function simulatedSaintBrieucLocation() {
  return {
    latitude: SAINT_BRIEUC_REGION.latitude + 0.004,
    longitude: SAINT_BRIEUC_REGION.longitude - 0.003,
    accuracyM: 1200,
  };
}
