"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";

type MapGuestMapLinksProps = {
  configured: boolean;
  user: User | null;
};

/** Sign-in / sign-up controls overlaid on the map (guests only). */
export function MapGuestMapLinks({ configured, user }: MapGuestMapLinksProps) {
  if (!configured || user) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-20 flex flex-col gap-2 sm:flex-row sm:items-center">
      <Link
        href="/auth/sign-in"
        className="rounded-xl bg-emerald-700 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-lg ring-1 ring-black/5 hover:bg-emerald-800"
      >
        Sign in
      </Link>
      <Link
        href="/auth/sign-up"
        className="rounded-xl border border-zinc-200/90 bg-white/95 px-4 py-2.5 text-center text-xs font-semibold text-zinc-900 shadow-lg ring-1 ring-black/5 backdrop-blur-sm hover:bg-white dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-50 dark:hover:bg-zinc-900"
      >
        Create account
      </Link>
    </div>
  );
}
