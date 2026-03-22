/** Texas approximate bounds (WGS84): west, south, east, north */
export const TEXAS_BBOX: [number, number, number, number] = [
  -106.65, 25.84, -93.51, 36.5,
];

/** Fit bounds for MapLibre: [[west, south], [east, north]] */
export const TEXAS_BOUNDS: [[number, number], [number, number]] = [
  [TEXAS_BBOX[0], TEXAS_BBOX[1]],
  [TEXAS_BBOX[2], TEXAS_BBOX[3]],
];

export const TEXAS_INITIAL_VIEW = {
  longitude: -99.35,
  latitude: 31.35,
  zoom: 5.4,
} as const;
