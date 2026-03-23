"use client";

import { useCallback, useState } from "react";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { AddCatchPanel } from "@/components/spots/AddCatchPanel";
import { AddSpotPanel } from "@/components/spots/AddSpotPanel";
import { useSupabaseAuthUser } from "@/hooks/useSupabaseAuthUser";
import { MapAuthCTA } from "./MapAuthCTA";
import { MapCollapsibleNav } from "./MapCollapsibleNav";
import { MapGuestMapLinks } from "./MapGuestMapLinks";
import { FishingMap } from "./FishingMap";

type PickMode = "spot" | "catch" | null;

export function MapPageClient() {
  const { user, configured } = useSupabaseAuthUser();
  const [pickMode, setPickMode] = useState<PickMode>(null);
  const [draftLngLat, setDraftLngLat] = useState<{ lng: number; lat: number } | null>(
    null,
  );
  const [spotsRefreshKey, setSpotsRefreshKey] = useState(0);
  const [catchesRefreshKey, setCatchesRefreshKey] = useState(0);

  const pickLocationMode = pickMode !== null;

  const onMapPick = useCallback((lng: number, lat: number) => {
    setDraftLngLat({ lng, lat });
  }, []);

  const toggleSpotPick = useCallback(() => {
    setPickMode((m) => (m === "spot" ? null : "spot"));
    setDraftLngLat(null);
  }, []);

  const toggleCatchPick = useCallback(() => {
    setPickMode((m) => (m === "catch" ? null : "catch"));
    setDraftLngLat(null);
  }, []);

  const onDraftClear = useCallback(() => setDraftLngLat(null), []);

  const onSpotAdded = useCallback(() => {
    setSpotsRefreshKey((k) => k + 1);
  }, []);

  const onCatchAdded = useCallback(() => {
    setCatchesRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <MapCollapsibleNav>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              ReelMap US
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              United States fishing map
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              A light land-and-water basemap, lakes and rivers (Natural Earth, U.S. extent), seed pins
              across the country, and community spots.{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Sign in</span> to add
              your own pins and catch photos.
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col gap-4 lg:w-[22rem]">
            <MapAuthCTA configured={configured} user={user} />
            <AddSpotPanel
              pickLocationMode={pickMode === "spot"}
              onTogglePickMode={toggleSpotPick}
              draftLngLat={draftLngLat}
              onDraftClear={onDraftClear}
              onSpotAdded={onSpotAdded}
            />
            <AddCatchPanel
              pickCatchMode={pickMode === "catch"}
              onTogglePickCatch={toggleCatchPick}
              draftLngLat={draftLngLat}
              onDraftClear={onDraftClear}
              onCatchAdded={onCatchAdded}
            />
          </div>
        </div>
      </MapCollapsibleNav>

      <div className="relative min-h-0 flex-1 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
        <div className="absolute inset-3 min-h-[420px] overflow-hidden rounded-2xl ring-1 ring-slate-200/80 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] dark:ring-slate-700/60 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] sm:inset-4">
          <FishingMap
            pickLocationMode={pickLocationMode}
            onMapPick={onMapPick}
            spotsRefreshKey={spotsRefreshKey}
            catchesRefreshKey={catchesRefreshKey}
          />
        </div>
        <div className="pointer-events-none absolute bottom-4 left-14 z-10 max-w-[min(100%-2rem,20rem)] rounded-md bg-white/90 px-2 py-1 text-[10px] leading-snug text-zinc-600 shadow dark:bg-zinc-900/90 dark:text-zinc-400">
          <span className="font-medium text-green-800 dark:text-green-400">Green</span> = seed ·{" "}
          <span className="font-medium text-amber-800 dark:text-amber-400">Amber</span> = community
          spots ·           <span className="font-medium text-violet-800 dark:text-violet-400">Violet</span> =
          catch photo. Water shading shows shore → center (illustrative, not survey depth).
        </div>
        <MapGuestMapLinks configured={configured} user={user} />
      </div>

      <LegalFooter />
    </div>
  );
}
