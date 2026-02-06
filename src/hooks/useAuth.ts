import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, is_active")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error("Unable to load your account. Please contact support.");
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error(
          "Your account is inactive. Please contact your administrator."
        );
      }

      // --- DEBUG (remove after verification) ---
      const redirectPath =
        profile.role === "super_admin" ? "/admin/dashboard" : "/dashboard";
      console.log("[AUTH DEBUG]", {
        userId: data.user.id,
        role: profile.role,
        redirectPath,
      });
      // --- END DEBUG ---

      navigate(redirectPath, { replace: true });
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }, [navigate]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }, []);

  return { session, loading, login, logout, sendPasswordReset, updatePassword };
}
