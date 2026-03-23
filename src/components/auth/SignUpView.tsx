"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { formCardClass } from "@/components/ui/form-classes";
import { AuthPageShell } from "./AuthPageShell";
import { SignUpForm } from "./SignUpForm";

export function SignUpView() {
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
        title="Create account"
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
          to enable sign-up.
        </p>
      </AuthPageShell>
    );
  }

  const supabase = createBrowserSupabase();
  if (!supabase) return null;

  return (
    <AuthPageShell
      title="Create account"
      description="Register to add fishing spots and catch photos anywhere in the U.S. map."
      footer={
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Confirmation emails use redirect{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono dark:bg-zinc-800">
            …/auth/callback?next=/map
          </code>
          . Add your site origin in Supabase → Authentication → Redirect URLs.
        </p>
      }
    >
      <SignUpForm supabase={supabase} />
    </AuthPageShell>
  );
}
