import type { Map as MapLibreMap } from "maplibre-gl";

/** Carto Positron (light vector); we restyle for a soft white-land / depth-graded blue-water look. */
export const CARTO_POSITRON_STYLE_URL =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const LAND = "#f6f8fc";
const LAND_PARK = "#f0fdf6";
const WHITE = "#ffffff";

/** Open ocean reads darker when zoomed out (depth illusion), lighter near shore when zoomed in */
const WATER_FILL_ZOOM = [
  "interpolate",
  ["linear"],
  ["zoom"],
  2,
  "#023e5c",
  3.5,
  "#054a6e",
  5,
  "#0b5f8a",
  7,
  "#1273a8",
  10,
  "#1a8cc4",
  14,
  "#3db3e0",
  18,
  "#5ec8eb",
] as const;

const WATER_SHADOW_ZOOM = [
  "interpolate",
  ["linear"],
  ["zoom"],
  2,
  "#012a3d",
  6,
  "#063652",
  12,
  "#0f4d6e",
  18,
  "#2a8cbd",
] as const;

const WATERWAY_COLOR_ZOOM = [
  "interpolate",
  ["linear"],
  ["zoom"],
  4,
  "#0a4f6e",
  8,
  "#1273a8",
  12,
  "#1d8fc4",
  16,
  "#4db8e8",
] as const;

const WATERWAY_WIDTH_ZOOM = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3,
  0.35,
  6,
  0.65,
  10,
  1.1,
  14,
  1.8,
] as const;

function safeSetPaint(
  map: MapLibreMap,
  layerId: string,
  prop: string,
  value: unknown,
) {
  try {
    map.setPaintProperty(layerId, prop, value);
  } catch {
    /* layer or paint property may not exist on this style version */
  }
}

/**
 * Refined light basemap: cool white land, zoom-graded blue water (darker = “deeper” at world scale),
 * soft roads and labels.
 */
export function applyLightMapWaterStyle(map: MapLibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const id = layer.id;
    const lid = id.toLowerCase();

    if (layer.type === "background") {
      safeSetPaint(map, id, "background-color", WHITE);
      continue;
    }

    if (layer.type === "fill") {
      if (lid === "water") {
        safeSetPaint(map, id, "fill-color", [...WATER_FILL_ZOOM]);
        safeSetPaint(map, id, "fill-opacity", 1);
        continue;
      }
      if (lid === "water_shadow") {
        safeSetPaint(map, id, "fill-color", [...WATER_SHADOW_ZOOM]);
        safeSetPaint(map, id, "fill-opacity", 0.75);
        continue;
      }
      if (lid === "landcover") {
        safeSetPaint(map, id, "fill-color", LAND);
        safeSetPaint(map, id, "fill-opacity", 0.85);
        continue;
      }
      if (lid.startsWith("park_")) {
        safeSetPaint(map, id, "fill-color", LAND_PARK);
        safeSetPaint(map, id, "fill-opacity", 0.9);
        continue;
      }
      if (lid.startsWith("landuse")) {
        safeSetPaint(map, id, "fill-color", "#f1f5f9");
        safeSetPaint(map, id, "fill-opacity", 0.75);
        continue;
      }
      if (lid === "building" || lid === "building-top") {
        safeSetPaint(map, id, "fill-color", "#e8ecf3");
        safeSetPaint(map, id, "fill-opacity", 0.5);
        continue;
      }
      if (lid.startsWith("tunnel_") && lid.endsWith("_fill")) {
        safeSetPaint(map, id, "fill-color", "#f1f5f9");
        continue;
      }
      if (lid.startsWith("road_") && lid.endsWith("_fill")) {
        safeSetPaint(map, id, "fill-color", WHITE);
        continue;
      }
      if (lid.startsWith("bridge_") && lid.endsWith("_fill")) {
        safeSetPaint(map, id, "fill-color", WHITE);
        continue;
      }
    }

    if (layer.type === "line") {
      if (lid === "waterway") {
        safeSetPaint(map, id, "line-color", [...WATERWAY_COLOR_ZOOM]);
        safeSetPaint(map, id, "line-width", [...WATERWAY_WIDTH_ZOOM]);
        safeSetPaint(map, id, "line-opacity", 0.95);
        continue;
      }
      if (lid.includes("boundary_country")) {
        safeSetPaint(map, id, "line-color", "#94a3b8");
        safeSetPaint(map, id, "line-opacity", 0.35);
        safeSetPaint(map, id, "line-width", 0.8);
        continue;
      }
      if (lid.includes("boundary_state")) {
        safeSetPaint(map, id, "line-color", "#cbd5e1");
        safeSetPaint(map, id, "line-opacity", 0.28);
        continue;
      }
      if (lid.includes("boundary")) {
        safeSetPaint(map, id, "line-opacity", 0.2);
        continue;
      }
      if (lid.startsWith("road_") && lid.endsWith("_case")) {
        safeSetPaint(map, id, "line-color", "#e2e8f0");
        safeSetPaint(map, id, "line-opacity", 0.65);
        continue;
      }
      if (lid === "rail" || lid === "rail_dash") {
        safeSetPaint(map, id, "line-color", "#cbd5e1");
        safeSetPaint(map, id, "line-opacity", 0.55);
      }
    }

    if (layer.type === "symbol" && lid.startsWith("watername")) {
      safeSetPaint(map, id, "text-color", "#f0f9ff");
      safeSetPaint(map, id, "text-halo-color", "#0a3d5c");
      safeSetPaint(map, id, "text-halo-width", 1.25);
    }

    if (layer.type === "symbol" && lid.startsWith("place_")) {
      safeSetPaint(map, id, "text-color", "#475569");
      safeSetPaint(map, id, "text-halo-color", "#ffffff");
      safeSetPaint(map, id, "text-halo-width", 1.2);
      safeSetPaint(map, id, "text-halo-blur", 0.3);
    }
  }
}
