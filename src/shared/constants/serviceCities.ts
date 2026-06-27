/**
 * Villes de service.
 * Phase test : seule Tanger est active. Les autres sont prévues ("bientôt").
 * Doit rester aligné avec le frontend (src/constants/cities.ts).
 */
export const ACTIVE_CITIES = ['Tanger'] as const;

export const UPCOMING_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Fès',
  'Essaouira',
  'Agadir',
  'Oujda',
  'Tétouan',
] as const;

/**
 * Vérifie qu'une ville fait partie des villes actuellement desservies.
 */
export function isActiveCity(city: string | null | undefined): boolean {
  if (!city) return false;
  return (ACTIVE_CITIES as readonly string[]).includes(city.trim());
}
