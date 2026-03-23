"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type AddCatchPanelProps = {
  pickCatchMode: boolean;
  onTogglePickCatch: () => void;
  draftLngLat: { lng: number; lat: number } | null;
  onDraftClear: () => void;
  onCatchAdded: () => void;
};

function extForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function AddCatchPanel({
  pickCatchMode,
  onTogglePickCatch,
  draftLngLat,
  onDraftClear,
  onCatchAdded,
}: AddCatchPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [speciesRaw, setSpeciesRaw] = useState("");
  const [file, setFile] = useState<File | null>(null);
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
    if (!file) {
      setMessage("Choose a photo of your catch.");
      return;
    }
    if (!ALLOWED_MIME.has(file.type)) {
      setMessage("Use a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("Image must be 5 MB or smaller.");
      return;
    }

    const supabase = createBrowserSupabase();
    if (!supabase || !user) {
      setMessage("Sign in to save catches.");
      return;
    }

    setMessage(null);
    setBusy(true);

    const species = speciesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const ext = extForMime(file.type);
    const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    try {
      const { error: upErr } = await supabase.storage
        .from("catch-photos")
        .upload(objectPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (upErr) {
        setMessage(upErr.message);
        setBusy(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("catch-photos").getPublicUrl(objectPath);

      const res = await fetch("/api/catches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: title.trim() || undefined,
          notes: notes.trim() || undefined,
          species,
          image_url: publicUrl,
          longitude: draftLngLat.lng,
          latitude: draftLngLat.lat,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not save catch");
        setBusy(false);
        return;
      }

      setTitle("");
      setNotes("");
      setSpeciesRaw("");
      setFile(null);
      onDraftClear();
      onTogglePickCatch();
      onCatchAdded();
      setMessage("Catch saved to the map.");
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
        Sign in to add photos of your catches as map pins.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Catch collection
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTogglePickCatch}
          className={
            pickCatchMode
              ? "rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              : "rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }
        >
          {pickCatchMode ? "Cancel catch pin" : "Place catch on map"}
        </button>
        {pickCatchMode ? (
          <span className="text-xs text-violet-800 dark:text-violet-200">
            Click the map where you landed the fish.
          </span>
        ) : null}
      </div>

      {draftLngLat ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Pin: {draftLngLat.lat.toFixed(5)}, {draftLngLat.lng.toFixed(5)}{" "}
          <button
            type="button"
            className="ml-1 text-violet-700 underline dark:text-violet-400"
            onClick={onDraftClear}
          >
            clear
          </button>
        </p>
      ) : null}

      <form className="flex flex-col gap-2" onSubmit={submit}>
        <label className="text-xs text-zinc-600 dark:text-zinc-400">
          Photo <span className="text-red-600 dark:text-red-400">*</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="mt-1 block w-full text-xs text-zinc-700 file:mr-2 file:rounded-md file:border-0 file:bg-violet-100 file:px-2 file:py-1 file:text-violet-900 dark:text-zinc-300 dark:file:bg-violet-950 dark:file:text-violet-100"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <textarea
          placeholder="Notes (optional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <input
          placeholder="Species (comma-separated, optional)"
          value={speciesRaw}
          onChange={(e) => setSpeciesRaw(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={busy || !draftLngLat || !file}
          className="rounded-md bg-violet-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-800 disabled:opacity-50"
        >
          Save catch to map
        </button>
      </form>
      {message ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{message}</p>
      ) : null}
    </div>
  );
}
