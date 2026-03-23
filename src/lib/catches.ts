import type { CatchFeature } from "@/types/catch";

export type FishCatchRow = {
  id: string;
  user_id: string;
  title: string | null;
  species: string[];
  notes: string | null;
  image_url: string;
  longitude: number;
  latitude: number;
  created_at: string;
};

export function rowToCatchFeature(row: FishCatchRow): CatchFeature {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [row.longitude, row.latitude],
    },
    properties: {
      id: row.id,
      pin_kind: "catch",
      title: row.title,
      species: row.species ?? [],
      notes: row.notes,
      image_url: row.image_url,
      created_at: row.created_at,
    },
  };
}
