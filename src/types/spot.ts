import type { Feature, FeatureCollection, Point } from "geojson";

export type SpotProperties = {
  id?: string;
  title: string;
  description?: string | null;
  species?: string[];
  access_type?: string | null;
  source?: "seed" | "user";
  created_at?: string;
};

export type SpotFeature = Feature<Point, SpotProperties>;

export type SpotFeatureCollection = FeatureCollection<Point, SpotProperties>;
