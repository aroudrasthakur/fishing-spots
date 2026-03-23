import type { Feature, FeatureCollection, Point } from "geojson";

export type CatchProperties = {
  id: string;
  pin_kind: "catch";
  title: string | null;
  species: string[];
  notes: string | null;
  image_url: string;
  created_at: string;
};

export type CatchFeature = Feature<Point, CatchProperties>;

export type CatchFeatureCollection = FeatureCollection<Point, CatchProperties>;
