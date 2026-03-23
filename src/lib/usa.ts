/**
 * Approximate WGS84 bounds for the United States (50 states + DC; includes AK, HI, and
 * offshore areas used in common web maps). Used for map maxBounds and API validation.
 */
export const USA_BBOX: [number, number, number, number] = [
  -179.5, 17.5, -64.2, 71.6,
];

/** MapLibre: [[west, south], [east, north]] */
export const USA_BOUNDS: [[number, number], [number, number]] = [
  [USA_BBOX[0], USA_BBOX[1]],
  [USA_BBOX[2], USA_BBOX[3]],
];

/** Initial view: geographic center of the contiguous United States */
export const USA_INITIAL_VIEW = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 3.45,
} as const;

export function isLngLatInUsa(lon: number, lat: number): boolean {
  const [w, s, e, n] = USA_BBOX;
  return lon >= w && lon <= e && lat >= s && lat <= n;
}
