"use client";

import Link from "next/link";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { AuthSpinner } from "@/components/auth/auth-shared";
import { formCardClass } from "@/components/ui/form-classes";

type MapAuthCTAProps = {
  configured: boolean;
  user: User | null;
};

export function MapAuthCTA({ configured, user }: MapAuthCTAProps) {
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div
        className={`${formCardClass} border-amber-200/90 bg-amber-50/90 dark:border-amber-900/60 dark:bg-amber-950/40`}
      >
        <p className="text-xs leading-relaxed text-amber-950 dark:text-amber-100">
          <span className="font-semibold">Auth unavailable.</span> Configure Supabase env vars to
          enable pins and catch photos. The map still shows public data.
        </p>
      </div>
    );
  }

  if (user) {
    const display = user.email ?? `${user.id.slice(0, 8)}…`;
    const initial = (user.email?.[0] ?? user.id[0] ?? "?").toUpperCase();

    async function signOut() {
      const supabase = createBrowserSupabase();
      if (!supabase) return;
      setBusy(true);
      await supabase.auth.signOut();
      setBusy(false);
    }

    return (
      <div className={formCardClass}>
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-sm font-bold text-white shadow-inner"
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Signed in
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {display}
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {busy ? <AuthSpinner className="h-3.5 w-3.5" /> : null}
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={formCardClass}>
      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Contributors</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        Sign in to add spots and catch photos. Account actions stay on dedicated pages—nothing
        sensitive happens on the map URL.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/auth/sign-in"
          className="inline-flex min-w-[6.5rem] flex-1 items-center justify-center rounded-xl bg-emerald-700 px-3 py-2.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 sm:flex-none"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="inline-flex min-w-[6.5rem] flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:flex-none"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
