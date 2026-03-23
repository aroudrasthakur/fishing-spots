"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  createBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

export function useSupabaseAuthUser() {
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      return;
    }
    const supabase = createBrowserSupabase();
    if (!supabase) return;

    refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, [refresh]);

  return { user, configured: isSupabaseConfigured(), refresh };
}
