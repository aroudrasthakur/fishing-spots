"use client";

import { useCallback, useState } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { TexasFishingMap } from "@/components/map/TexasFishingMap";
import { AddCatchPanel } from "@/components/spots/AddCatchPanel";
import { AddSpotPanel } from "@/components/spots/AddSpotPanel";

type PickMode = "spot" | "catch" | null;

export function HomeClient() {
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
      <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Texas fishing map
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Rivers, lakes, and demo water features (Natural Earth, Texas clip) plus seed spots.
              Sign in with Supabase to add pins and a photo collection of your catches.
            </p>
          </div>
          <div className="flex w-full max-w-md flex-col gap-4 lg:w-80">
            <AuthPanel />
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
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 min-h-[420px]">
          <TexasFishingMap
            pickLocationMode={pickLocationMode}
            onMapPick={onMapPick}
            spotsRefreshKey={spotsRefreshKey}
            catchesRefreshKey={catchesRefreshKey}
          />
        </div>
        <div className="pointer-events-none absolute bottom-4 left-14 z-10 max-w-[min(100%-2rem,20rem)] rounded-md bg-white/90 px-2 py-1 text-[10px] leading-snug text-zinc-600 shadow dark:bg-zinc-900/90 dark:text-zinc-400">
          <span className="font-medium text-green-800 dark:text-green-400">Green</span> = seed ·{" "}
          <span className="font-medium text-amber-800 dark:text-amber-400">Amber</span> = community
          spots · <span className="font-medium text-violet-800 dark:text-violet-400">Violet</span> =
          catch photo
        </div>
      </div>

      <LegalFooter />
    </div>
  );
}
