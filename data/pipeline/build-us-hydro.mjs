/**
 * Downloads Natural Earth 50m lakes + lake/river centerlines, clips to a USA bounding box,
 * writes public/data/us-hydro.geojson
 *
 * Each feature has _depth_rank (size-based: larger water → higher rank).
 * Lakes are split into _hydro_zone rings (shallow / mid / deep) using negative buffers so each
 * body reads lighter near the shore and darker toward the interior — illustrative only, not real
 * bathymetry. Rivers are duplicated per zone and drawn as stacked widths (bank → channel).
 *
 * Run: npm run build:hydro
 * Attribution: Natural Earth (public domain).
 */
import * as turf from "@turf/turf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const outDir = path.join(root, "public", "data");
const outFile = path.join(outDir, "us-hydro.geojson");

/** Same as src/lib/usa.ts USA_BBOX */
const USA_BBOX = [-179.5, 17.5, -64.2, 71.6];

const MIN_SHALLOW_RING_M2 = 1;
const MIN_RING_AREA_M2 = 80;
const MIN_DEEP_AREA_M2 = 120;

/** Larger surface water → higher rank → darker blue on the map */
function lakeRankFromAreaKm2(km2) {
  if (!Number.isFinite(km2) || km2 <= 0) return 1;
  if (km2 < 1) return 1;
  if (km2 < 10) return 2;
  if (km2 < 100) return 3;
  if (km2 < 1000) return 4;
  if (km2 < 10000) return 5;
  return 6;
}

/** Longer river lines → higher rank → darker / wider styling */
function riverRankFromLengthKm(km) {
  if (!Number.isFinite(km) || km <= 0) return 1;
  if (km < 10) return 1;
  if (km < 50) return 2;
  if (km < 150) return 3;
  if (km < 400) return 4;
  return 5;
}

/**
 * Equivalent radius (km) from area — used to scale buffer insets per lake.
 */
function characteristicRadiusKm(areaKm2) {
  return Math.sqrt(Math.max(areaKm2, 1e-12) / Math.PI);
}

/**
 * Two inset distances (km) from shore: first ring (shallow band), second (mid/deep split).
 */
function lakeInsetsKm(areaKm2) {
  const r = characteristicRadiusKm(areaKm2);
  const inset1 = Math.max(0.008, Math.min(2.2, 0.2 * r));
  const inset2 = Math.max(0.022, Math.min(4.8, 0.48 * r));
  return inset2 > inset1 ? { inset1, inset2 } : { inset1, inset2: inset1 * 1.35 };
}

function safeAreaM2(feat) {
  try {
    const a = turf.area(feat);
    return Number.isFinite(a) ? a : 0;
  } catch {
    return 0;
  }
}

/**
 * @param {import('geojson').Feature<import('geojson').Polygon | import('geojson').MultiPolygon>} polyFeat
 * @param {Record<string, unknown>} baseProps
 * @param {string} hydroId
 * @returns {import('geojson').Feature[]}
 */
function lakePolygonToZoneFeatures(polyFeat, baseProps, hydroId) {
  const areaKm2 = safeAreaM2(polyFeat) / 1_000_000;
  const { inset1, inset2 } = lakeInsetsKm(areaKm2);
  const outer = polyFeat;

  let shrink1;
  let shrink2;
  try {
    shrink1 = turf.buffer(outer, -inset1, { units: "kilometers" });
  } catch {
    shrink1 = undefined;
  }
  try {
    shrink2 = turf.buffer(outer, -inset2, { units: "kilometers" });
  } catch {
    shrink2 = undefined;
  }

  const a1 = shrink1 ? safeAreaM2(shrink1) : 0;
  const a2 = shrink2 ? safeAreaM2(shrink2) : 0;
  const validShrink1 = shrink1 && a1 >= MIN_DEEP_AREA_M2;
  const validShrink2 = shrink2 && a2 >= MIN_DEEP_AREA_M2 && a2 < a1 - 50;

  /** @type {import('geojson').Feature[]} */
  const out = [];

  if (!validShrink1) {
    out.push(
      turf.feature(outer.geometry, {
        ...baseProps,
        _hydro_zone: "uniform",
        _hydro_id: hydroId,
      }),
    );
    return out;
  }

  const shallowDiff = turf.difference(
    turf.featureCollection([outer, shrink1]),
  );
  if (
    !shallowDiff ||
    safeAreaM2(shallowDiff) < MIN_SHALLOW_RING_M2
  ) {
    out.push(
      turf.feature(outer.geometry, {
        ...baseProps,
        _hydro_zone: "uniform",
        _hydro_id: hydroId,
      }),
    );
    return out;
  }

  shallowDiff.properties = {
    ...baseProps,
    _hydro_zone: "shallow",
    _hydro_id: hydroId,
  };
  out.push(shallowDiff);

  if (validShrink2) {
    const midDiff = turf.difference(
      turf.featureCollection([shrink1, shrink2]),
    );
    if (midDiff && safeAreaM2(midDiff) >= MIN_RING_AREA_M2) {
      midDiff.properties = {
        ...baseProps,
        _hydro_zone: "mid",
        _hydro_id: hydroId,
      };
      out.push(midDiff);
    }
    shrink2.properties = {
      ...baseProps,
      _hydro_zone: "deep",
      _hydro_id: hydroId,
    };
    out.push(shrink2);
  } else {
    shrink1.properties = {
      ...baseProps,
      _hydro_zone: "deep",
      _hydro_id: hydroId,
    };
    out.push(shrink1);
  }

  return out;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function main() {
  return (async () => {
    const usClip = turf.bboxPolygon(USA_BBOX);

    const [lakes, rivers] = await Promise.all([
      fetchJson(
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson",
      ),
      fetchJson(
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson",
      ),
    ]);

    const outFeatures = [];
    let lakeSeq = 0;
    let riverSeq = 0;

    for (const f of lakes.features) {
      if (!f.geometry) continue;
      try {
        if (turf.booleanIntersects(f, usClip)) {
          const clipped = turf.intersect(
            turf.feature(f.geometry, f.properties),
            usClip,
          );
          if (clipped) {
            const areaM2 = turf.area(clipped);
            const areaKm2 = areaM2 / 1_000_000;
            const _depth_rank = lakeRankFromAreaKm2(areaKm2);
            const baseProps = {
              ...f.properties,
              _hydro_kind: "lake",
              _source: "Natural Earth 50m",
              _area_km2: Math.round(areaKm2 * 1000) / 1000,
              _depth_rank,
            };
            const flattened = turf.flatten(clipped);
            for (const part of flattened.features) {
              const zones = lakePolygonToZoneFeatures(
                part,
                baseProps,
                `lake-${lakeSeq}`,
              );
              outFeatures.push(...zones);
              lakeSeq += 1;
            }
          }
        }
      } catch {
        /* ignore invalid geometries */
      }
    }

    for (const f of rivers.features) {
      if (!f.geometry) continue;
      try {
        if (turf.booleanIntersects(f, usClip)) {
          const lineFeat = turf.feature(f.geometry, f.properties);
          const lenKm = turf.length(lineFeat, { units: "kilometers" });
          const _depth_rank = riverRankFromLengthKm(lenKm);
          const baseProps = {
            ...f.properties,
            _hydro_kind: "river",
            _source: "Natural Earth 50m",
            _length_km: Math.round(lenKm * 100) / 100,
            _depth_rank,
          };
          const hid = `river-${riverSeq}`;
          riverSeq += 1;
          for (const zone of ["shallow", "mid", "deep"]) {
            outFeatures.push({
              type: "Feature",
              geometry: f.geometry,
              properties: {
                ...baseProps,
                _hydro_zone: zone,
                _hydro_id: hid,
              },
            });
          }
        }
      } catch {
        /* ignore */
      }
    }

    fs.mkdirSync(outDir, { recursive: true });
    const fc = turf.featureCollection(outFeatures);
    fs.writeFileSync(outFile, JSON.stringify(fc));
    console.log(
      `Wrote ${outFeatures.length} features to ${path.relative(root, outFile)}`,
    );
  })();
}

main();
