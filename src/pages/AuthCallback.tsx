import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Supabase auth callback handler ONLY (email confirm, Google sign-in via Lovable broker).
 * NOT for Google Business Profile — that has its own /auth/gmb/callback route.
 *
 * Routing logic (PRD §6.2):
 *   if profile.onboarding_complete === false → /onboarding
 *   else                                    → /dashboard
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const route = async () => {
      // Wait briefly for Supabase to hydrate session from URL hash if present
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;
      navigate(profile?.onboarding_complete ? "/dashboard" : "/onboarding", { replace: true });
    };

    route();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
