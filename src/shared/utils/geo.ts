/**
 * Utilitaires géo pour matching 3 km sans API payante (S06-FS-T03).
 * Extraction lat/lng depuis URLs Google Maps / WhatsApp.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

/**
 * Patterns d'extraction de coordonnées (lat,lng) depuis une URL.
 * Chaque regex doit capturer lat en groupe 1 et lng en groupe 2.
 * Ordre = priorité d'essai.
 */
const LAT = '(-?\\d{1,3}(?:\\.\\d+)?)';
const LNG = '(-?\\d{1,3}(?:\\.\\d+)?)';
const COORD_PATTERNS: RegExp[] = [
  // @lat,lng ou @lat,lng,zoom (Google Maps)
  new RegExp(`@${LAT},${LNG}(?:[,/]|$)`),
  // !3dlat!4dlng (URLs Google "place")
  new RegExp(`!3d${LAT}!4d${LNG}`),
  // q=loc:lat,lng (WhatsApp "envoyer ma position")
  new RegExp(`[?&]q=loc:${LAT},${LNG}(?:[,&]|$)`, 'i'),
  // query=lat,lng (Google Maps api=1)
  new RegExp(`[?&]query=${LAT},${LNG}(?:[,&]|$)`, 'i'),
  // ll=lat,lng (Apple/Google variantes)
  new RegExp(`[?&]ll=${LAT},${LNG}(?:[,&]|$)`, 'i'),
  // q=lat,lng ou q=lat,lng,zoom
  new RegExp(`[?&]q=${LAT}[, ]${LNG}(?:[,&]|$)`, 'i'),
  // q=lat+lng (plus au lieu de virgule)
  new RegExp(`[?&]q=${LAT}\\+${LNG}(?:&|$)`, 'i'),
];

/**
 * Extrait latitude et longitude depuis une URL type Google Maps / WhatsApp.
 * Formats supportés :
 * - ...@lat,lng (ex: https://www.google.com/maps/@33.5731,-7.5898,17z)
 * - ...!3dlat!4dlng (ex: https://www.google.com/maps/place/.../@.../data=...!3d35.76!4d-5.83)
 * - ?q=lat,lng / &q=lat,lng / ?q=lat+lng (ex: https://www.google.com/maps?q=33.5731,-7.5898)
 * - ?q=loc:lat,lng (lien de localisation WhatsApp)
 * - ?query=lat,lng (Google Maps api=1)
 * - ?ll=lat,lng
 *
 * Note : les liens raccourcis (ex: https://maps.app.goo.gl/xxxx) ne contiennent pas
 * de coordonnées et renvoient null — il faut les ouvrir pour obtenir un lien complet.
 *
 * @param url - URL ou chaîne contenant potentiellement des coords
 * @returns { lat, lng } ou null si non trouvé / invalide
 */
export function parseLatLngFromUrl(url: string | null | undefined): LatLng | null {
  if (url == null || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  const s = url.trim();

  for (const pattern of COORD_PATTERNS) {
    const match = s.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }
  }

  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= LAT_MIN &&
    lat <= LAT_MAX &&
    lng >= LNG_MIN &&
    lng <= LNG_MAX
  );
}

/** Rayon terrestre en km (approximation sphérique) */
const EARTH_RADIUS_KM = 6371;

/**
 * Distance en km entre deux points (formule de Haversine).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return EARTH_RADIUS_KM * c;
}

/**
 * Boîte englobante (bounds) autour d'un point pour un rayon donné en km.
 * Approximation : 1° lat ≈ 111 km, 1° lng ≈ 111*cos(lat) km.
 * @returns { minLat, maxLat, minLng, maxLng }
 */
export function boundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
