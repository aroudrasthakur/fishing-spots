"use client";

import { useCallback, useState } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { TexasFishingMap } from "@/components/map/TexasFishingMap";
import { AddSpotPanel } from "@/components/spots/AddSpotPanel";

export function HomeClient() {
  const [pickLocationMode, setPickLocationMode] = useState(false);
  const [draftLngLat, setDraftLngLat] = useState<{ lng: number; lat: number } | null>(
    null,
  );
  const [spotsRefreshKey, setSpotsRefreshKey] = useState(0);

  const onMapClickForSpot = useCallback((lng: number, lat: number) => {
    setDraftLngLat({ lng, lat });
  }, []);

  const onTogglePickMode = useCallback(() => {
    setPickLocationMode((v) => !v);
    if (pickLocationMode) setDraftLngLat(null);
  }, [pickLocationMode]);

  const onDraftClear = useCallback(() => setDraftLngLat(null), []);

  const onSpotAdded = useCallback(() => {
    setSpotsRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Texas fishing map
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Rivers, lakes, and demo water features (Natural Earth, Texas clip) plus seed spots.
              Sign in with Supabase to add your own pins.
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col gap-4 lg:w-80">
            <AuthPanel />
            <AddSpotPanel
              pickLocationMode={pickLocationMode}
              onTogglePickMode={onTogglePickMode}
              draftLngLat={draftLngLat}
              onDraftClear={onDraftClear}
              onSpotAdded={onSpotAdded}
            />
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 min-h-[420px]">
          <TexasFishingMap
          pickLocationMode={pickLocationMode}
          onMapClickForSpot={onMapClickForSpot}
            spotsRefreshKey={spotsRefreshKey}
          />
        </div>
        <div className="pointer-events-none absolute bottom-4 left-14 z-10 rounded-md bg-white/90 px-2 py-1 text-[10px] text-zinc-600 shadow dark:bg-zinc-900/90 dark:text-zinc-400">
          <span className="font-medium text-green-800 dark:text-green-400">Green</span> = seed ·{" "}
          <span className="font-medium text-amber-800 dark:text-amber-400">Amber</span> = community
        </div>
      </div>

      <LegalFooter />
    </div>
  );
}
