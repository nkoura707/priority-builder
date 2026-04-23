import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import {
  buildGmbAuthUrl,
  GMB_PENDING_KEY,
  type ExchangeGmbTokenResponse,
  type GmbLocation,
} from "@/lib/gmb";

type Tone = "professional" | "friendly" | "formal";

const TONES: { id: Tone; name: string; description: string; sample: string }[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Warm but composed. Works for most businesses.",
    sample:
      "Thank you for taking the time to share your experience, Sarah. We're glad the pasta lived up to expectations and hope to see you again soon.",
  },
  {
    id: "friendly",
    name: "Friendly",
    description: "Conversational and personable. Like a note from the owner.",
    sample:
      "Sarah, this absolutely made our day! So happy you loved the pasta — come back soon, we'll save you a table by the window.",
  },
  {
    id: "formal",
    name: "Formal",
    description: "Polished and traditional. Best for upscale establishments.",
    sample:
      "Dear Sarah, we are most grateful for your kind review. It would be our pleasure to welcome you back to Osteria Marco at your convenience.",
  },
];

type NormalizedLocation = {
  id: string; // google_location_id (last segment of `name`)
  fullName: string; // raw `name` from API e.g. "accounts/x/locations/y"
  title: string;
  address: string;
};

const normalizeLocations = (raw: GmbLocation[]): NormalizedLocation[] =>
  raw.map((loc) => {
    const idSegment = (loc.name ?? "").split("/").pop() ?? "";
    const addr = loc.storefrontAddress ?? loc.address;
    const lines = addr?.addressLines?.join(", ") ?? "";
    const cityState = [addr?.locality, addr?.administrativeArea].filter(Boolean).join(", ");
    const address = [lines, cityState].filter(Boolean).join(" • ");
    return {
      id: idSegment,
      fullName: loc.name,
      title: loc.title ?? loc.locationName ?? "Unnamed location",
      address,
    };
  });

const Onboarding = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [pendingOAuth, setPendingOAuth] = useState<ExchangeGmbTokenResponse | null>(null);
  const [locations, setLocations] = useState<NormalizedLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [tone, setTone] = useState<Tone>("professional");
  const [finishing, setFinishing] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  // Pick up OAuth result from sessionStorage when returning from /auth/gmb/callback
  useEffect(() => {
    const raw = sessionStorage.getItem(GMB_PENDING_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ExchangeGmbTokenResponse;
      setPendingOAuth(parsed);
      const normalized = normalizeLocations(parsed.locations ?? []);
      setLocations(normalized);
      if (normalized.length > 0) setSelectedLocation(normalized[0].id);
      // Auto-advance: connection succeeded, move past the connect step
      // We stay on Step 1 but show the location picker.
    } catch (e) {
      console.error("Failed to parse pending OAuth payload", e);
      sessionStorage.removeItem(GMB_PENDING_KEY);
    }
  }, []);

  // Show error toast if OAuth callback failed
  useEffect(() => {
    if (searchParams.get("error") === "gmb_failed") {
      toast.error("Couldn't connect to Google. Please try again.");
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleConnect = () => {
    window.location.href = buildGmbAuthUrl();
  };

  const handleStep1Continue = async () => {
    if (!user || !pendingOAuth || !selectedLocation) return;
    const loc = locations.find((l) => l.id === selectedLocation);
    if (!loc) return;

    setSavingLocation(true);
    const expiresAt = new Date(Date.now() + pendingOAuth.expires_in * 1000).toISOString();

    const { error } = await supabase.from("locations").insert({
      user_id: user.id,
      google_account_id: pendingOAuth.account_id,
      google_location_id: loc.id,
      business_name: loc.title,
      address: loc.address || null,
      google_access_token: pendingOAuth.access_token,
      google_refresh_token: pendingOAuth.refresh_token,
      token_expires_at: expiresAt,
    });

    setSavingLocation(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    sessionStorage.removeItem(GMB_PENDING_KEY);
    setStep(2);
  };

  const finish = async () => {
    if (!user) return;
    setFinishing(true);

    // Persist selected tone on the location we just created (real GMB flow)
    if (pendingOAuth && selectedLocation) {
      await supabase
        .from("locations")
        .update({ reply_tone: tone })
        .eq("user_id", user.id)
        .eq("google_location_id", selectedLocation);
    }

    // Ensure the user has at least one location row so the dashboard works
    // even when the real GMB flow hasn't been completed yet.
    const { data: existingLocs } = await supabase
      .from("locations")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (!existingLocs || existingLocs.length === 0) {
      const { error: insertErr } = await supabase.from("locations").insert({
        user_id: user.id,
        google_account_id: "pending",
        google_location_id: "pending_" + user.id,
        business_name: "My Business",
        address: null,
        google_access_token: "pending",
        google_refresh_token: "pending",
        token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        reply_tone: tone,
      });
      if (insertErr) {
        toast.error(insertErr.message);
        setFinishing(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
      setFinishing(false);
      return;
    }
    navigate("/dashboard", { replace: true });
  };

  const progressPct = ((step - 1) / 2) * 100 + 10;

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-[40%_60%]">
      {/* Left: dark animated panel */}
      <aside
        className="hidden lg:flex flex-col text-white p-10 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--sidebar-bg)) 0%, hsl(222 22% 4%) 100%)",
        }}
      >
        <Logo variant="light" size={20} />

        <div className="flex-1 flex items-center justify-center relative">
          <div className="relative w-full max-w-[320px] h-[280px]">
            <div
              className="absolute inset-0 bg-white/[0.04] border border-white/10 rounded-xl p-5 animate-in-fade"
              style={{ animation: "in-fade 0.5s ease 0s both, in-fade 0.5s ease reverse 2.5s both" }}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#FDE68A] text-[#7c5a00] flex items-center justify-center text-xs font-semibold">
                  S
                </div>
                <div className="text-[13px] font-medium">Sarah M.</div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={11} fill="#F59E0B" stroke="none" />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-[12px] text-white/60 leading-relaxed">
                Best brunch in the neighborhood. The truffle pasta was incredible…
              </p>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-white/40 tracking-wider uppercase">
          Step {step} of 3
        </div>
      </aside>

      {/* Right: form */}
      <main className="flex flex-col min-h-screen">
        <header className="px-6 lg:px-10 py-5 flex items-center justify-between">
          <div className="lg:hidden">
            <Logo size={20} />
          </div>
          <div className="lg:hidden text-[11px] text-muted-foreground tracking-wider uppercase">
            Step {step} of 3
          </div>
          <button
            onClick={signOut}
            className="ml-auto text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </header>

        <div className="flex-1 flex items-start justify-center px-6 lg:px-10 pt-8 pb-16">
          <div className="w-full max-w-[480px]">
            {/* Progress bar */}
            <div
              className="h-[3px] bg-muted-bg-strong rounded-full overflow-hidden mb-12"
              aria-label={`Step ${step} of 3`}
            >
              <div
                className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="animate-in-up">
              {step === 1 && (
                <Step1
                  connected={!!pendingOAuth}
                  locations={locations}
                  selectedLocation={selectedLocation}
                  setSelectedLocation={setSelectedLocation}
                  onConnect={handleConnect}
                  onContinue={handleStep1Continue}
                  saving={savingLocation}
                />
              )}
              {step === 2 && (
                <Step2 tone={tone} setTone={setTone} onContinue={() => setStep(3)} onBack={() => setStep(1)} />
              )}
              {step === 3 && <Step3 onFinish={finish} finishing={finishing} onBack={() => setStep(2)} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ---------- Step 1 ---------- */
const Step1 = ({
  connected,
  locations,
  selectedLocation,
  setSelectedLocation,
  onConnect,
  onContinue,
  saving,
}: {
  connected: boolean;
  locations: NormalizedLocation[];
  selectedLocation: string;
  setSelectedLocation: (v: string) => void;
  onConnect: () => void;
  onContinue: () => void;
  saving: boolean;
}) => (
  <>
    <h1 className="font-serif text-[36px] leading-[1.05] mb-3 tracking-[-0.02em]">Connect your Google Business</h1>
    <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
      We need permission to read your reviews and post replies on your behalf. This is a one-time setup.
    </p>

    {!connected ? (
      <Button onClick={onConnect} className="w-full h-11" size="lg">
        <GoogleIcon />
        Connect with Google
      </Button>
    ) : locations.length === 0 ? (
      <>
        <div className="flex items-center gap-2 text-[13px] text-success mb-5">
          <Check className="h-4 w-4" />
          Connected — but we couldn't find any business locations on this Google account.
        </div>
        <p className="text-[13px] text-muted-foreground mb-6">
          Make sure the Google account you connected has access to a verified Google Business Profile.
        </p>
        <Button variant="outline" onClick={onConnect} className="w-full h-11">
          Try a different account
        </Button>
      </>
    ) : (
      <>
        <div className="flex items-center gap-2 text-[13px] text-success mb-5">
          <Check className="h-4 w-4" />
          Connected. Found {locations.length} location{locations.length === 1 ? "" : "s"}.
        </div>
        <label className="label-tiny text-muted-foreground block mb-3">Choose a location to start with</label>
        <div className="space-y-2 mb-6">
          {locations.map((loc) => {
            const active = selectedLocation === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedLocation(loc.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  active
                    ? "border-accent bg-accent-light border-2"
                    : "border-border hover:border-border-strong bg-surface"
                }`}
              >
                <div className="text-[14px] font-medium text-foreground">{loc.title}</div>
                {loc.address && (
                  <div className="text-[13px] text-muted-foreground mt-0.5">{loc.address}</div>
                )}
              </button>
            );
          })}
        </div>
        <Button onClick={onContinue} disabled={!selectedLocation || saving} className="w-full h-11" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
        </Button>
      </>
    )}
  </>
);

/* ---------- Step 2 ---------- */
const Step2 = ({
  tone,
  setTone,
  onContinue,
  onBack,
}: {
  tone: Tone;
  setTone: (t: Tone) => void;
  onContinue: () => void;
  onBack: () => void;
}) => (
  <>
    <h1 className="font-serif text-[36px] leading-[1.05] mb-3 tracking-[-0.02em]">How should your replies sound?</h1>
    <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
      Pick a tone for your AI-drafted replies. You can change this anytime.
    </p>

    <div className="space-y-3 mb-8">
      {TONES.map((t) => {
        const active = tone === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTone(t.id)}
            className={`w-full text-left p-5 rounded-lg transition-all ${
              active
                ? "border-2 border-accent bg-accent-light"
                : "border border-border hover:border-border-strong bg-surface"
            }`}
            style={active ? undefined : { padding: "calc(1.25rem + 1px)" }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[15px] font-medium text-foreground">{t.name}</span>
              {active && (
                <span className="h-4 w-4 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-3 w-3 text-accent-foreground" strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground mb-3">{t.description}</p>
            <p className="text-[13px] text-foreground/80 italic leading-relaxed border-l-2 border-border pl-3">
              "{t.sample}"
            </p>
          </button>
        );
      })}
    </div>

    <div className="flex gap-2">
      <Button variant="outline" onClick={onBack} className="h-11">
        Back
      </Button>
      <Button onClick={onContinue} className="flex-1 h-11" size="lg">
        Continue
      </Button>
    </div>
  </>
);

/* ---------- Step 3 ---------- */
const Step3 = ({
  onFinish,
  finishing,
  onBack,
}: {
  onFinish: () => void;
  finishing: boolean;
  onBack: () => void;
}) => (
  <>
    <h1 className="font-serif text-[36px] leading-[1.05] mb-3 tracking-[-0.02em]">You're all set up.</h1>
    <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
      Your 7-day free trial has started. No payment needed yet — we'll remind you before it ends.
    </p>

    <div className="bg-muted-bg rounded-lg p-5 mb-8">
      <div className="relative flex items-start justify-between">
        <div className="absolute top-2 left-2 right-2 h-px bg-border-strong" />
        {[
          { label: "Today", sub: "Trial starts", active: true },
          { label: "Day 7", sub: "Trial ends", active: false },
          { label: "Day 8", sub: "First charge — $29", active: false },
        ].map((item, i) => (
          <div key={i} className="relative flex flex-col items-center text-center" style={{ width: "33%" }}>
            <span
              className={`h-4 w-4 rounded-full border-2 ${
                item.active ? "bg-accent border-accent" : "bg-surface border-border-strong"
              }`}
            />
            <span className="label-tiny text-muted-foreground mt-3">{item.label}</span>
            <span className="text-[12px] text-foreground mt-1">{item.sub}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="flex gap-2">
      <Button variant="outline" onClick={onBack} className="h-11" disabled={finishing}>
        Back
      </Button>
      <Button onClick={onFinish} disabled={finishing} className="flex-1 h-11" size="lg">
        {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Open my dashboard"}
      </Button>
    </div>
  </>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.997 10.997 0 0012 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11.002 11.002 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

export default Onboarding;
