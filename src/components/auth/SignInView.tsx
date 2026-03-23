"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { AuthPageShell } from "./AuthPageShell";
import { SignInForm } from "./SignInForm";

export function SignInView() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setChecked(true);
      return;
    }
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setChecked(true);
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/map");
        return;
      }
      setChecked(true);
    });
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <AuthPageShell
        title="Sign in"
        description="Supabase environment variables are not set on this deployment."
      >
        <p className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          Add{" "}
          <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-[11px] dark:bg-amber-900/80">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-[11px] dark:bg-amber-900/80">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to enable authentication.
        </p>
      </AuthPageShell>
    );
  }

  const supabase = createBrowserSupabase();
  if (!supabase) return null;

  return (
    <AuthPageShell
      title="Sign in"
      description="Use the email and password for your ReelMap US account."
      footer={
        <p className="text-[10px] leading-relaxed text-zinc-500">
          After email confirmation, Supabase redirects to{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">/auth/callback</code>{" "}
          and then to the map. Add that redirect URL in your Supabase project settings.
        </p>
      }
    >
      <SignInForm supabase={supabase} />
    </AuthPageShell>
  );
}
