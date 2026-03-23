import { NextResponse } from "next/server";
import { rowToCatchFeature } from "@/lib/catches";
import { isLngLatInUsa } from "@/lib/usa";
import { isSupabaseConfigured, createServerSupabase } from "@/lib/supabase/server";
import type { CatchFeatureCollection } from "@/types/catch";

export const runtime = "nodejs";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isAllowedCatchImageUrl(imageUrl: string, projectUrl: string): boolean {
  try {
    const parsed = new URL(imageUrl);
    const expectedPathPrefix = "/storage/v1/object/public/catch-photos/";
    if (!parsed.pathname.startsWith(expectedPathPrefix)) return false;
    const base = new URL(normalizeBaseUrl(projectUrl));
    return parsed.origin === base.origin;
  } catch {
    return false;
  }
}

export async function GET() {
  const empty: CatchFeatureCollection = { type: "FeatureCollection", features: [] };

  if (!isSupabaseConfigured()) {
    return NextResponse.json(empty);
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json(empty);
  }

  const { data, error } = await supabase
    .from("fish_catches")
    .select(
      "id, user_id, title, species, notes, image_url, longitude, latitude, created_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return NextResponse.json(empty);
  }

  const collection: CatchFeatureCollection = {
    type: "FeatureCollection",
    features: data.map(rowToCatchFeature),
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
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
    notes?: string;
    species?: string[];
    image_url?: string;
    longitude?: number;
    latitude?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  if (!imageUrl || !isAllowedCatchImageUrl(imageUrl, supabaseUrl)) {
    return NextResponse.json(
      { error: "image_url must be a public URL from this project’s catch-photos bucket" },
      { status: 400 },
    );
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

  const titleRaw = typeof body.title === "string" ? body.title.trim() : "";
  const title = titleRaw.length ? titleRaw : null;

  const species = Array.isArray(body.species)
    ? body.species.filter((s): s is string => typeof s === "string")
    : [];

  const notes =
    typeof body.notes === "string" && body.notes.trim().length
      ? body.notes.trim()
      : null;

  const { data, error } = await supabase
    .from("fish_catches")
    .insert({
      user_id: user.id,
      title,
      species,
      notes,
      image_url: imageUrl,
      longitude: lon,
      latitude: lat,
    })
    .select(
      "id, user_id, title, species, notes, image_url, longitude, latitude, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(rowToCatchFeature(data), { status: 201 });
}
