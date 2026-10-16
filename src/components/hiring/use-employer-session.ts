"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/db/supabase-browser";

export type EmployerSession = { status: "loading" } | { status: "guest" } | { status: "user"; email: string | null };

export function useEmployerSession() {
  const [session, setSession] = useState<EmployerSession>({ status: "loading" });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ? { status: "user", email: data.session.user.email ?? null } : { status: "guest" });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ? { status: "user", email: next.user.email ?? null } : { status: "guest" });
    });
    return () => subscription.unsubscribe();
  }, []);

  return session;
}
