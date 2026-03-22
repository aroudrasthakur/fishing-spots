/**
 * Downloads Natural Earth 10m lakes & North America rivers + US states boundary,
 * clips features to Texas, writes public/data/texas-hydro.geojson
 *
 * Run: npm run build:hydro
 * Attribution: Natural Earth (public domain). US state boundary: PublicaMundi sample GeoJSON (verify terms for production).
 */
import * as turf from "@turf/turf";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const outDir = path.join(root, "public", "data");
const outFile = path.join(outDir, "texas-hydro.geojson");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function main() {
  return (async () => {
    const [states, lakes, rivers] = await Promise.all([
      fetchJson(
        "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json",
      ),
      fetchJson(
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson",
      ),
      fetchJson(
        "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_north_america.geojson",
      ),
    ]);

    const texas = states.features.find(
      (f) => f.properties?.name === "Texas",
    );
    if (!texas) throw new Error("Texas feature not found in us-states");

    const outFeatures = [];

    for (const f of lakes.features) {
      if (!f.geometry) continue;
      try {
        if (turf.booleanIntersects(f, texas)) {
          const clipped = turf.intersect(
            turf.feature(f.geometry, f.properties),
            texas,
          );
          if (clipped) {
            clipped.properties = {
              ...f.properties,
              _hydro_kind: "lake",
              _source: "Natural Earth 10m",
            };
            outFeatures.push(clipped);
          }
        }
      } catch {
        /* ignore invalid geometries */
      }
    }

    for (const f of rivers.features) {
      if (!f.geometry) continue;
      try {
        if (turf.booleanIntersects(f, texas)) {
          outFeatures.push({
            type: "Feature",
            geometry: f.geometry,
            properties: {
              ...f.properties,
              _hydro_kind: "river",
              _source: "Natural Earth 10m",
            },
          });
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
