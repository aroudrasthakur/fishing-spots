import type { SpotFeature } from "@/types/spot";

export type SpotRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  species: string[];
  access_type: string | null;
  longitude: number;
  latitude: number;
  created_at: string;
};

export function rowToSpotFeature(row: SpotRow): SpotFeature {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [row.longitude, row.latitude],
    },
    properties: {
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      species: row.species ?? [],
      access_type: row.access_type ?? undefined,
      source: "user",
      created_at: row.created_at,
    },
  };
}
