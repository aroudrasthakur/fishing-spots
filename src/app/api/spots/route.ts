import { readFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { isLngLatInUsa } from "@/lib/usa";
import { isSupabaseConfigured, createServerSupabase } from "@/lib/supabase/server";
import { rowToSpotFeature } from "@/lib/spots";
import type { SpotFeatureCollection } from "@/types/spot";

export const runtime = "nodejs";

function loadSeed(): SpotFeatureCollection {
  const file = path.join(
    process.cwd(),
    "public",
    "data",
    "us-spots-seed.geojson",
  );
  const raw = readFileSync(file, "utf-8");
  return JSON.parse(raw) as SpotFeatureCollection;
}

export async function GET() {
  const seed = loadSeed();
  const features = [...seed.features];

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("spots")
        .select(
          "id, user_id, title, description, species, access_type, longitude, latitude, created_at",
        )
        .order("created_at", { ascending: false });

      if (!error && data?.length) {
        for (const row of data) {
          features.push(rowToSpotFeature(row));
        }
      }
    }
  }

  const collection: SpotFeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  return NextResponse.json(collection);
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Add env vars and run the SQL migration." },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: {
    title?: string;
    description?: string;
    species?: string[];
    access_type?: string;
    longitude?: number;
    latitude?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const lon = Number(body.longitude);
  const lat = Number(body.latitude);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return NextResponse.json(
      { error: "longitude and latitude must be numbers" },
      { status: 400 },
    );
  }

  if (!isLngLatInUsa(lon, lat)) {
    return NextResponse.json(
      { error: "Coordinates must fall within the United States (approximate bounds)" },
      { status: 400 },
    );
  }

  const species = Array.isArray(body.species)
    ? body.species.filter((s): s is string => typeof s === "string")
    : [];

  const { data, error } = await supabase
    .from("spots")
    .insert({
      user_id: user.id,
      title,
      description:
        typeof body.description === "string" ? body.description.trim() || null : null,
      species,
      access_type:
        typeof body.access_type === "string" ? body.access_type.trim() || null : null,
      longitude: lon,
      latitude: lat,
    })
    .select(
      "id, user_id, title, description, species, access_type, longitude, latitude, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(rowToSpotFeature(data), { status: 201 });
}
