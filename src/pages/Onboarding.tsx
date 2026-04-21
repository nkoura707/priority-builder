import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

type Tone = "professional" | "friendly" | "formal";

const SAMPLE_LOCATIONS = [
  { id: "loc_1", name: "Osteria Marco — Downtown", address: "123 Main St" },
  { id: "loc_2", name: "Osteria Marco — Riverside", address: "456 Oak Ave" },
];

const TONES: { id: Tone; name: string; description: string; sample: string }[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Warm but composed. Works for most businesses.",
    sample: "Thank you for taking the time to share your experience, Sarah. We're glad the pasta lived up to expectations and hope to see you again soon.",
  },
  {
    id: "friendly",
    name: "Friendly",
    description: "Conversational and personable. Like a note from the owner.",
    sample: "Sarah, this absolutely made our day! So happy you loved the pasta — come back soon, we'll save you a table by the window.",
  },
  {
    id: "formal",
    name: "Formal",
    description: "Polished and traditional. Best for upscale establishments.",
    sample: "Dear Sarah, we are most grateful for your kind review. It would be our pleasure to welcome you back to Osteria Marco at your convenience.",
  },
];

const Onboarding = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [connecting, setConnecting] = useState(false);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [tone, setTone] = useState<Tone>("professional");
  const [finishing, setFinishing] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    // Simulate fetching locations from GMB API
    await new Promise((r) => setTimeout(r, 900));
    setLocationsLoaded(true);
    setSelectedLocation(SAMPLE_LOCATIONS[0].id);
    setConnecting(false);
  };

  const finish = async () => {
    if (!user) return;
    setFinishing(true);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Logo size={20} />
        <button
          onClick={signOut}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Log out
        </button>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 pt-8 pb-16">
        <div className="w-full max-w-[480px]">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-10" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  n === step
                    ? "w-8 bg-accent"
                    : n < step
                      ? "w-1.5 bg-accent"
                      : "w-1.5 bg-border-strong"
                }`}
              />
            ))}
          </div>

          <div className="bg-surface border border-border rounded-xl p-8">
            {step === 1 && (
              <Step1
                connecting={connecting}
                locationsLoaded={locationsLoaded}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                onConnect={handleConnect}
                onContinue={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <Step2 tone={tone} setTone={setTone} onContinue={() => setStep(3)} onBack={() => setStep(1)} />
            )}
            {step === 3 && <Step3 onFinish={finish} finishing={finishing} onBack={() => setStep(2)} />}
          </div>
        </div>
      </main>
    </div>
  );
};

/* ---------- Step 1 ---------- */
const Step1 = ({
  connecting,
  locationsLoaded,
  selectedLocation,
  setSelectedLocation,
  onConnect,
  onContinue,
}: {
  connecting: boolean;
  locationsLoaded: boolean;
  selectedLocation: string;
  setSelectedLocation: (v: string) => void;
  onConnect: () => void;
  onContinue: () => void;
}) => (
  <>
    <h1 className="font-serif text-[32px] leading-tight mb-3">Connect your Google Business</h1>
    <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
      We need permission to read your reviews and post replies on your behalf. This is a one-time setup.
    </p>

    {!locationsLoaded ? (
      <Button onClick={onConnect} disabled={connecting} className="w-full h-11" size="lg">
        {connecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Connecting…
          </>
        ) : (
          <>
            <GoogleIcon />
            Connect with Google
          </>
        )}
      </Button>
    ) : (
      <>
        <div className="flex items-center gap-2 text-[13px] text-success mb-5">
          <Check className="h-4 w-4" />
          Connected. Found {SAMPLE_LOCATIONS.length} locations.
        </div>
        <label className="label-tiny text-muted-foreground block mb-3">Choose a location to start with</label>
        <div className="space-y-2 mb-6">
          {SAMPLE_LOCATIONS.map((loc) => {
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
                <div className="text-[14px] font-medium text-foreground">{loc.name}</div>
                <div className="text-[13px] text-muted-foreground mt-0.5">{loc.address}</div>
              </button>
            );
          })}
        </div>
        <Button onClick={onContinue} disabled={!selectedLocation} className="w-full h-11" size="lg">
          Continue
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
    <h1 className="font-serif text-[32px] leading-tight mb-3">How should your replies sound?</h1>
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
    <h1 className="font-serif text-[32px] leading-tight mb-3">You're all set up.</h1>
    <p className="text-muted-foreground text-[15px] leading-relaxed mb-8">
      Your 7-day free trial has started. No payment needed yet — we'll remind you before it ends.
    </p>

    {/* Timeline */}
    <div className="bg-muted-bg rounded-lg p-5 mb-8">
      <div className="relative flex items-start justify-between">
        {/* line */}
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
