"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type AddSpotPanelProps = {
  pickLocationMode: boolean;
  onTogglePickMode: () => void;
  draftLngLat: { lng: number; lat: number } | null;
  onDraftClear: () => void;
  onSpotAdded: () => void;
};

export function AddSpotPanel({
  pickLocationMode,
  onTogglePickMode,
  draftLngLat,
  onDraftClear,
  onSpotAdded,
}: AddSpotPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [speciesRaw, setSpeciesRaw] = useState("");
  const [accessType, setAccessType] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshUser = useCallback(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    })();
  }, []);

  useEffect(() => {
    refreshUser();
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
      },
    );
    return () => subscription.unsubscribe();
  }, [refreshUser]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draftLngLat) {
      setMessage("Choose a location on the map first.");
      return;
    }
    setMessage(null);
    setBusy(true);
    const species = speciesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title,
          description: description || undefined,
          species,
          access_type: accessType || undefined,
          longitude: draftLngLat.lng,
          latitude: draftLngLat.lat,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not save spot");
        setBusy(false);
        return;
      }
      setTitle("");
      setDescription("");
      setSpeciesRaw("");
      setAccessType("");
      onDraftClear();
      onTogglePickMode();
      onSpotAdded();
      setMessage("Spot saved.");
    } catch {
      setMessage("Network error");
    }
    setBusy(false);
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!user) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Sign in to drop your own fishing pins on the map.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTogglePickMode}
          className={
            pickLocationMode
              ? "rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              : "rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }
        >
          {pickLocationMode ? "Cancel pin drop" : "Drop pin on map"}
        </button>
        {pickLocationMode ? (
          <span className="text-xs text-amber-800 dark:text-amber-200">
            Click the map to set coordinates.
          </span>
        ) : null}
      </div>

      {draftLngLat ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Pin: {draftLngLat.lat.toFixed(5)}, {draftLngLat.lng.toFixed(5)}{" "}
          <button
            type="button"
            className="ml-1 text-emerald-700 underline dark:text-emerald-400"
            onClick={onDraftClear}
          >
            clear
          </button>
        </p>
      ) : null}

      <form className="flex flex-col gap-2" onSubmit={submit}>
        <input
          required
          placeholder="Spot title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <textarea
          placeholder="Notes (optional)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <input
          placeholder="Species (comma-separated, optional)"
          value={speciesRaw}
          onChange={(e) => setSpeciesRaw(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <input
          placeholder="Access type (e.g. bank, boat ramp)"
          value={accessType}
          onChange={(e) => setAccessType(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={busy || !draftLngLat}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Save spot
        </button>
      </form>
      {message ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{message}</p>
      ) : null}
    </div>
  );
}
