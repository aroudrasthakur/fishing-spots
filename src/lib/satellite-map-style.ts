import type { StyleSpecification } from "maplibre-gl";

/**
 * Esri World Imagery (satellite) plus reference overlays for roads and labels.
 * Attribution: https://www.esri.com/en-us/legal/terms/data-attributions
 */
export const SATELLITE_BASE_STYLE = {
  version: 8,
  name: "Esri satellite",
  sources: {
    "esri-imagery": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        "© Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
    "esri-transportation": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    "esri-places": {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: "esri-imagery", type: "raster", source: "esri-imagery" },
    {
      id: "esri-transportation",
      type: "raster",
      source: "esri-transportation",
      paint: { "raster-opacity": 1 },
    },
    {
      id: "esri-places",
      type: "raster",
      source: "esri-places",
      paint: { "raster-opacity": 1 },
    },
  ],
} as const satisfies StyleSpecification;
