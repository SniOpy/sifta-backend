import { parseLatLngFromUrl, haversineKm, boundingBox } from '../../shared/utils/geo';

describe('geo utils (S06-FS-T03)', () => {
  describe('parseLatLngFromUrl', () => {
    it('extrait @lat,lng (Google Maps style)', () => {
      expect(parseLatLngFromUrl('https://www.google.com/maps/@33.5731,-7.5898,17z')).toEqual({
        lat: 33.5731,
        lng: -7.5898,
      });
    });

    it('extrait q=lat,lng', () => {
      expect(parseLatLngFromUrl('https://www.google.com/maps?q=33.5731,-7.5898')).toEqual({
        lat: 33.5731,
        lng: -7.5898,
      });
    });

    it('retourne null pour chaîne vide ou non-URL', () => {
      expect(parseLatLngFromUrl('')).toBeNull();
      expect(parseLatLngFromUrl('Casablanca')).toBeNull();
      expect(parseLatLngFromUrl(null)).toBeNull();
      expect(parseLatLngFromUrl(undefined)).toBeNull();
    });
  });

  describe('haversineKm', () => {
    it('calcule la distance entre deux points', () => {
      const a = { lat: 33.5731, lng: -7.5898 };
      const b = { lat: 33.9716, lng: -6.8498 };
      const km = haversineKm(a, b);
      expect(km).toBeGreaterThan(80);
      expect(km).toBeLessThan(120);
    });

    it('retourne 0 pour le même point', () => {
      const a = { lat: 33.5731, lng: -7.5898 };
      expect(haversineKm(a, a)).toBe(0);
    });
  });

  describe('boundingBox', () => {
    it('retourne min/max lat/lng pour un rayon donné', () => {
      const box = boundingBox(33.5, -7.5, 10);
      expect(box.minLat).toBeLessThan(33.5);
      expect(box.maxLat).toBeGreaterThan(33.5);
      expect(box.minLng).toBeLessThan(-7.5);
      expect(box.maxLng).toBeGreaterThan(-7.5);
    });
  });
});
