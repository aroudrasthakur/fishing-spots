"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import { TEXAS_BOUNDS, TEXAS_INITIAL_VIEW } from "@/lib/texas";
import type { SpotFeature, SpotFeatureCollection } from "@/types/spot";

const BASE_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const lakeFillLayer = {
  id: "texas-hydro-lake",
  type: "fill" as const,
  paint: {
    "fill-color": "#5ba3c6",
    "fill-opacity": 0.35,
  },
};

const riverLineLayer = {
  id: "texas-hydro-river",
  type: "line" as const,
  paint: {
    "line-color": "#2d6a8f",
    "line-width": 1.2,
  },
};

const spotCirclePaint = {
  "circle-radius": 7,
  "circle-stroke-width": 1.5,
  "circle-stroke-color": "#ffffff",
} as const;

type TexasFishingMapProps = {
  onMapClickForSpot?: (lng: number, lat: number) => void;
  pickLocationMode?: boolean;
  /** Increment to refetch spots from /api/spots */
  spotsRefreshKey?: number;
};

export function TexasFishingMap({
  onMapClickForSpot,
  pickLocationMode = false,
  spotsRefreshKey = 0,
}: TexasFishingMapProps) {
  const [hydro, setHydro] = useState<GeoJSON.FeatureCollection | null>(null);
  const [spots, setSpots] = useState<SpotFeatureCollection | null>(null);
  const [selected, setSelected] = useState<SpotFeature | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hydroRes = await fetch("/data/texas-hydro.geojson");
        if (!hydroRes.ok) throw new Error("Failed to load water data");
        const hydroJson = (await hydroRes.json()) as GeoJSON.FeatureCollection;
        if (!cancelled) setHydro(hydroJson);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Load error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const spotsRes = await fetch("/api/spots");
        if (!spotsRes.ok) throw new Error("Failed to load spots");
        const spotsJson = (await spotsRes.json()) as SpotFeatureCollection;
        if (!cancelled) setSpots(spotsJson);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Load error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spotsRefreshKey]);

  const spotsData: SpotFeatureCollection = useMemo(
    () => spots ?? { type: "FeatureCollection" as const, features: [] },
    [spots],
  );

  const hydroLakes = useMemo(() => {
    if (!hydro) return null;
    const features = hydro.features.filter(
      (f) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
    );
    return { type: "FeatureCollection" as const, features };
  }, [hydro]);

  const hydroRivers = useMemo(() => {
    if (!hydro) return null;
    const features = hydro.features.filter(
      (f) =>
        f.geometry?.type === "LineString" || f.geometry?.type === "MultiLineString",
    );
    return { type: "FeatureCollection" as const, features };
  }, [hydro]);

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (pickLocationMode && onMapClickForSpot) {
        onMapClickForSpot(e.lngLat.lng, e.lngLat.lat);
        return;
      }
      const f = e.features?.[0];
      if (f && f.geometry.type === "Point") {
        const coords = f.geometry.coordinates as [number, number];
        setSelected({
          type: "Feature",
          geometry: { type: "Point", coordinates: coords },
          properties: (f.properties ?? {}) as SpotFeature["properties"],
        });
        return;
      }
      setSelected(null);
    },
    [pickLocationMode, onMapClickForSpot],
  );

  return (
    <div className="relative h-full w-full">
      {loadError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100/95 p-4 text-center text-sm text-red-800 dark:bg-zinc-900/95 dark:text-red-200">
          {loadError}
        </div>
      ) : null}
      <Map
        initialViewState={{
          longitude: TEXAS_INITIAL_VIEW.longitude,
          latitude: TEXAS_INITIAL_VIEW.latitude,
          zoom: TEXAS_INITIAL_VIEW.zoom,
        }}
        style={{ width: "100%", height: "100%", minHeight: 320 }}
        mapStyle={BASE_STYLE}
        maxBounds={TEXAS_BOUNDS}
        minZoom={4}
        maxZoom={18}
        interactiveLayerIds={pickLocationMode ? [] : ["spots-seed", "spots-user"]}
        cursor={pickLocationMode ? "crosshair" : "grab"}
        onClick={onMapClick}
      >
        <NavigationControl position="top-left" showCompass={false} />

        {hydroLakes && hydroLakes.features.length > 0 ? (
          <Source id="texas-hydro-lakes" type="geojson" data={hydroLakes}>
            <Layer {...lakeFillLayer} />
          </Source>
        ) : null}
        {hydroRivers && hydroRivers.features.length > 0 ? (
          <Source id="texas-hydro-rivers" type="geojson" data={hydroRivers}>
            <Layer {...riverLineLayer} />
          </Source>
        ) : null}

        {spotsData.features.length > 0 ? (
          <Source id="spots" type="geojson" data={spotsData}>
            <Layer
              id="spots-seed"
              type="circle"
              filter={["==", ["get", "source"], "seed"]}
              paint={{ ...spotCirclePaint, "circle-color": "#166534" }}
            />
            <Layer
              id="spots-user"
              type="circle"
              filter={["==", ["get", "source"], "user"]}
              paint={{ ...spotCirclePaint, "circle-color": "#b45309" }}
            />
          </Source>
        ) : null}

        {selected ? (
          <Popup
            longitude={selected.geometry.coordinates[0]}
            latitude={selected.geometry.coordinates[1]}
            anchor="top"
            onClose={() => setSelected(null)}
            closeButton
            closeOnClick={false}
            maxWidth="320px"
          >
            <SpotPopupBody feature={selected} />
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}

function SpotPopupBody({ feature }: { feature: SpotFeature }) {
  const p = feature.properties;
  const species = p.species?.length ? p.species.join(", ") : null;
  return (
    <div className="min-w-[200px] max-w-[280px] text-zinc-900">
      <h3 className="font-semibold text-zinc-950">{p.title}</h3>
      {p.description ? (
        <p className="mt-1 text-sm text-zinc-600">{p.description}</p>
      ) : null}
      {species ? (
        <p className="mt-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">Species:</span> {species}
        </p>
      ) : null}
      {p.access_type ? (
        <p className="mt-1 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">Access:</span> {p.access_type}
        </p>
      ) : null}
      <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-400">
        {p.source === "user" ? "Community spot" : "Seed / overview pin"}
      </p>
    </div>
  );
}
