import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getGmbRedirectUri, GMB_PENDING_KEY } from "@/lib/gmb";
import { Loader2 } from "lucide-react";

const GmbCallback = () => {
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error || !code) {
        navigate("/onboarding?error=gmb_failed", { replace: true });
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "exchange-gmb-token",
        { body: { code, redirectUri: getGmbRedirectUri() } },
      );

      if (fnError || !data || data.error) {
        navigate("/onboarding?error=gmb_failed", { replace: true });
        return;
      }

      sessionStorage.setItem(GMB_PENDING_KEY, JSON.stringify(data));
      navigate("/onboarding", { replace: true });
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Connecting your Google Business Profile…</p>
      </div>
    </div>
  );
};

export default GmbCallback;
