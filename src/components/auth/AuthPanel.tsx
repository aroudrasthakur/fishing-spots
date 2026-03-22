"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export function AuthPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        Sign-in is off until you set{" "}
        <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/80">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>
        . Seed spots still show on the map.
      </div>
    );
  }

  const client = createBrowserSupabase();
  if (!client) return null;

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    const { error } = await client!.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage(error.message);
  }

  async function signUp() {
    setMessage(null);
    setBusy(true);
    const { error } = await client!.auth.signUp({ email, password });
    setBusy(false);
    if (error) setMessage(error.message);
    else
      setMessage(
        "Check your email to confirm your account (or disable confirmations in Supabase for local dev).",
      );
  }

  async function signOut() {
    setBusy(true);
    await client!.auth.signOut();
    setBusy(false);
  }

  if (user) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-zinc-700 dark:text-zinc-300">
          Signed in as{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {user.email ?? user.id.slice(0, 8)}
          </span>
        </p>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={busy}
          className="self-start rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-2 text-sm" onSubmit={signIn}>
      <p className="font-medium text-zinc-800 dark:text-zinc-200">Account</p>
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <input
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Sign in
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void signUp()}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Sign up
        </button>
      </div>
      {message ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{message}</p>
      ) : null}
    </form>
  );
}
