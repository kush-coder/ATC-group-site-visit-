/**
 * GPS capture. Offline-first: we only need coordinates, never an online map tile.
 */
import { Geolocation } from '@capacitor/geolocation';

export interface GeoResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  time: string;
}

export const geoService = {
  async current(): Promise<GeoResult> {
    const perm = await Geolocation.checkPermissions().catch(() => null);
    if (perm && perm.location === 'denied') {
      const req = await Geolocation.requestPermissions().catch(() => null);
      if (req && req.location === 'denied') {
        throw new Error('Location permission denied');
      }
    }
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      time: new Date().toISOString(),
    };
  },
};
