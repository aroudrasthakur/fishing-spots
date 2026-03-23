"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import {
  applyLightMapWaterStyle,
  CARTO_POSITRON_STYLE_URL,
} from "@/lib/light-map-water";
import { USA_BOUNDS, USA_INITIAL_VIEW } from "@/lib/usa";
import type { CatchFeature, CatchFeatureCollection } from "@/types/catch";
import type { SpotFeature, SpotFeatureCollection } from "@/types/spot";

/**
 * Lake zones come from build-us-hydro (negative buffers): shallow = near shore, deep = interior.
 * _depth_rank still nudges overall tone (bigger water → slightly darker).
 */
const lakeShallowFillPaint = {
  "fill-color": "#c4f0ff",
  "fill-opacity": 0.9,
} as const;

const lakeMidFillPaint = {
  "fill-color": [
    "interpolate",
    ["linear"],
    ["coalesce", ["to-number", ["get", "_depth_rank"]], 3],
    1,
    "#7fdcf2",
    3,
    "#3cbde0",
    6,
    "#1580a3",
  ],
  "fill-opacity": 0.93,
} as const;

const lakeDeepFillPaint = {
  "fill-color": [
    "interpolate",
    ["linear"],
    ["coalesce", ["to-number", ["get", "_depth_rank"]], 3],
    1,
    "#4ab8d4",
    3,
    "#0d7a9a",
    6,
    "#021f2a",
  ],
  "fill-opacity": 0.96,
} as const;

const lakeUniformFillPaint = {
  "fill-color": [
    "interpolate",
    ["linear"],
    ["coalesce", ["to-number", ["get", "_depth_rank"]], 3],
    1,
    "#9ee8f8",
    3,
    "#35b8dc",
    6,
    "#063747",
  ],
  "fill-opacity": 0.92,
} as const;

/** Same centerline, three widths: outer halo = shallow banks, inner = channel */
const riverRankScale = [
  "match",
  ["coalesce", ["to-number", ["get", "_depth_rank"]], 3],
  1,
  0.9,
  2,
  1.2,
  3,
  1.65,
  4,
  2.15,
  5,
  2.75,
  1.65,
] as const;

const riverShallowLinePaint = {
  "line-color": "#c5f1ff",
  "line-width": ["*", 3.8, riverRankScale],
  "line-opacity": 0.36,
  "line-blur": 0.45,
} as const;

const riverMidLinePaint = {
  "line-color": "#5ecfef",
  "line-width": ["*", 2.15, riverRankScale],
  "line-opacity": 0.62,
  "line-blur": 0.2,
} as const;

const riverDeepLinePaint = {
  "line-color": [
    "interpolate",
    ["linear"],
    ["coalesce", ["to-number", ["get", "_depth_rank"]], 3],
    1,
    "#2aa3c4",
    3,
    "#0a6f8c",
    6,
    "#023544",
  ],
  "line-width": ["*", 1, riverRankScale],
  "line-opacity": 0.98,
} as const;

const spotCirclePaint = {
  "circle-radius": 7,
  "circle-stroke-width": 2,
  "circle-stroke-color": "#ffffff",
} as const;

const catchCirclePaint = {
  "circle-radius": 8,
  "circle-stroke-width": 2,
  "circle-stroke-color": "#ffffff",
  "circle-color": "#7c5cf0",
} as const;

type FishingMapProps = {
  onMapPick?: (lng: number, lat: number) => void;
  pickLocationMode?: boolean;
  /** Increment to refetch spots from /api/spots */
  spotsRefreshKey?: number;
  /** Increment to refetch catches from /api/catches */
  catchesRefreshKey?: number;
};

export function FishingMap({
  onMapPick,
  pickLocationMode = false,
  spotsRefreshKey = 0,
  catchesRefreshKey = 0,
}: FishingMapProps) {
  const [hydro, setHydro] = useState<GeoJSON.FeatureCollection | null>(null);
  const [spots, setSpots] = useState<SpotFeatureCollection | null>(null);
  const [catches, setCatches] = useState<CatchFeatureCollection | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<SpotFeature | null>(null);
  const [selectedCatch, setSelectedCatch] = useState<CatchFeature | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hydroRes = await fetch("/data/us-hydro.geojson");
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/catches");
        if (!res.ok) return;
        const json = (await res.json()) as CatchFeatureCollection;
        if (!cancelled) setCatches(json);
      } catch {
        if (!cancelled) {
          setCatches({ type: "FeatureCollection", features: [] });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catchesRefreshKey]);

  const spotsData: SpotFeatureCollection = useMemo(
    () => spots ?? { type: "FeatureCollection" as const, features: [] },
    [spots],
  );

  const catchesData: CatchFeatureCollection = useMemo(
    () => catches ?? { type: "FeatureCollection" as const, features: [] },
    [catches],
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

  const onMapLoad = useCallback((e: { target: MapLibreMap }) => {
    applyLightMapWaterStyle(e.target);
  }, []);

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (pickLocationMode && onMapPick) {
        setSelectedSpot(null);
        setSelectedCatch(null);
        onMapPick(e.lngLat.lng, e.lngLat.lat);
        return;
      }
      const feats = e.features ?? [];
      const catchHit = feats.find((f) => f.layer?.id === "catches");
      const spotHit = feats.find(
        (f) => f.layer?.id === "spots-seed" || f.layer?.id === "spots-user",
      );

      setSelectedSpot(null);
      setSelectedCatch(null);

      if (catchHit && catchHit.geometry.type === "Point") {
        const coords = catchHit.geometry.coordinates as [number, number];
        setSelectedCatch({
          type: "Feature",
          geometry: { type: "Point", coordinates: coords },
          properties: (catchHit.properties ?? {}) as CatchFeature["properties"],
        });
        return;
      }
      if (spotHit && spotHit.geometry.type === "Point") {
        const coords = spotHit.geometry.coordinates as [number, number];
        setSelectedSpot({
          type: "Feature",
          geometry: { type: "Point", coordinates: coords },
          properties: (spotHit.properties ?? {}) as SpotFeature["properties"],
        });
      }
    },
    [pickLocationMode, onMapPick],
  );

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
      {loadError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100/95 p-4 text-center text-sm text-red-800 dark:bg-zinc-900/95 dark:text-red-200">
          {loadError}
        </div>
      ) : null}
      <Map
        initialViewState={{
          longitude: USA_INITIAL_VIEW.longitude,
          latitude: USA_INITIAL_VIEW.latitude,
          zoom: USA_INITIAL_VIEW.zoom,
        }}
        style={{ width: "100%", height: "100%", minHeight: 320 }}
        mapStyle={CARTO_POSITRON_STYLE_URL}
        maxBounds={USA_BOUNDS}
        minZoom={2}
        maxZoom={19}
        interactiveLayerIds={
          pickLocationMode ? [] : ["catches", "spots-user", "spots-seed"]
        }
        cursor={pickLocationMode ? "crosshair" : "grab"}
        onLoad={onMapLoad}
        onClick={onMapClick}
      >
        <NavigationControl position="top-left" showCompass={false} />

        {hydroLakes && hydroLakes.features.length > 0 ? (
          <Source id="us-hydro-lakes" type="geojson" data={hydroLakes}>
            <Layer
              id="us-hydro-lake-shallow"
              type="fill"
              filter={["==", ["get", "_hydro_zone"], "shallow"]}
              paint={lakeShallowFillPaint as never}
            />
            <Layer
              id="us-hydro-lake-mid"
              type="fill"
              filter={["==", ["get", "_hydro_zone"], "mid"]}
              paint={lakeMidFillPaint as never}
            />
            <Layer
              id="us-hydro-lake-deep"
              type="fill"
              filter={["==", ["get", "_hydro_zone"], "deep"]}
              paint={lakeDeepFillPaint as never}
            />
            <Layer
              id="us-hydro-lake-uniform"
              type="fill"
              filter={["==", ["get", "_hydro_zone"], "uniform"]}
              paint={lakeUniformFillPaint as never}
            />
          </Source>
        ) : null}
        {hydroRivers && hydroRivers.features.length > 0 ? (
          <Source id="us-hydro-rivers" type="geojson" data={hydroRivers}>
            <Layer
              id="us-hydro-river-shallow"
              type="line"
              filter={["==", ["get", "_hydro_zone"], "shallow"]}
              paint={riverShallowLinePaint as never}
            />
            <Layer
              id="us-hydro-river-mid"
              type="line"
              filter={["==", ["get", "_hydro_zone"], "mid"]}
              paint={riverMidLinePaint as never}
            />
            <Layer
              id="us-hydro-river-deep"
              type="line"
              filter={["==", ["get", "_hydro_zone"], "deep"]}
              paint={riverDeepLinePaint as never}
            />
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

        {catchesData.features.length > 0 ? (
          <Source id="catches" type="geojson" data={catchesData}>
            <Layer id="catches" type="circle" paint={catchCirclePaint} />
          </Source>
        ) : null}

        {selectedCatch ? (
          <Popup
            longitude={selectedCatch.geometry.coordinates[0]}
            latitude={selectedCatch.geometry.coordinates[1]}
            anchor="top"
            onClose={() => setSelectedCatch(null)}
            closeButton
            closeOnClick={false}
            maxWidth="320px"
          >
            <CatchPopupBody feature={selectedCatch} />
          </Popup>
        ) : selectedSpot ? (
          <Popup
            longitude={selectedSpot.geometry.coordinates[0]}
            latitude={selectedSpot.geometry.coordinates[1]}
            anchor="top"
            onClose={() => setSelectedSpot(null)}
            closeButton
            closeOnClick={false}
            maxWidth="320px"
          >
            <SpotPopupBody feature={selectedSpot} />
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}

function CatchPopupBody({ feature }: { feature: CatchFeature }) {
  const p = feature.properties;
  const species = p.species?.length ? p.species.join(", ") : null;
  const heading =
    p.title && p.title.trim().length > 0 ? p.title.trim() : "Fish catch";
  return (
    <div className="min-w-[200px] max-w-[280px] text-zinc-900">
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
        <img
          src={p.image_url}
          alt={heading}
          className="h-44 w-full object-cover"
          loading="lazy"
        />
      </div>
      <h3 className="mt-2 font-semibold text-zinc-950">{heading}</h3>
      {p.notes ? <p className="mt-1 text-sm text-zinc-600">{p.notes}</p> : null}
      {species ? (
        <p className="mt-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">Species:</span> {species}
        </p>
      ) : null}
      <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-400">
        Catch photo pin
      </p>
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
