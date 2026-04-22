import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tone = "professional" | "friendly" | "formal";

const TONES: { id: Tone; name: string; description: string }[] = [
  { id: "professional", name: "Professional", description: "Warm but composed. Works for most businesses." },
  { id: "friendly", name: "Friendly", description: "Conversational and personable." },
  { id: "formal", name: "Formal", description: "Polished and traditional." },
];

const StatusBadge = ({ status }: { status: string | null }) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: "Active", bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
    trialing: { label: "Trialing", bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
    past_due: { label: "Past due", bg: "bg-[#FEE2E2]", text: "text-[#DC2626]" },
    canceled: { label: "Canceled", bg: "bg-[#F1EEE9]", text: "text-muted-foreground" },
  };
  const v = status && map[status] ? map[status] : { label: "Trial", bg: "bg-[#FEF3C7]", text: "text-[#92400E]" };
  return (
    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", v.bg, v.text)}>
      {v.label}
    </span>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-white border border-[#E8E4DF] rounded-[10px] p-6">
    <h2 className="font-serif text-[20px] mb-5">{title}</h2>
    {children}
  </section>
);

const SettingsInner = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Account
  const [fullName, setFullName] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  // Billing
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  // Tone
  const [tone, setTone] = useState<Tone>("professional");
  const [locationCount, setLocationCount] = useState(0);
  const [savingTone, setSavingTone] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: profile }, { data: locs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, subscription_status, trial_ends_at")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("locations")
          .select("id, reply_tone")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      const name = profile?.full_name ?? "";
      setFullName(name);
      setInitialFullName(name);
      setSubscriptionStatus(profile?.subscription_status ?? null);
      setTrialEndsAt(profile?.trial_ends_at ?? null);

      if (locs && locs.length > 0) {
        setTone((locs[0].reply_tone as Tone) ?? "professional");
        setLocationCount(locs.length);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleNameBlur = async () => {
    if (!user || fullName === initialFullName) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    setSavingName(false);
    if (error) {
      toast.error("Couldn't save name");
      setFullName(initialFullName);
      return;
    }
    setInitialFullName(fullName);
    toast("Name updated", { style: { background: "#1C1917", color: "#fff", border: "none" } });
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setResetSending(false);
    if (error) {
      toast.error("Couldn't send reset email");
      return;
    }
    toast("Password reset email sent", {
      style: { background: "#1C1917", color: "#fff", border: "none" },
    });
  };

  const handleSaveTone = async () => {
    if (!user) return;
    setSavingTone(true);
    const { error } = await supabase
      .from("locations")
      .update({ reply_tone: tone })
      .eq("user_id", user.id);
    setSavingTone(false);
    if (error) {
      toast.error("Couldn't save tone");
      return;
    }
    toast("Reply tone saved", {
      style: { background: "#1C1917", color: "#fff", border: "none" },
    });
  };

  const trialDateLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <>
      <header className="sticky top-0 z-20 bg-white border-b border-[#E8E4DF]">
        <div className="flex items-center justify-between px-6 md:px-8 py-4 pl-16 md:pl-8">
          <h1 className="font-serif text-[22px] leading-none">Settings</h1>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4622A]" />
          </div>
        ) : (
          <>
            {/* Account */}
            <Card title="Account">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name" className="text-sm">Full name</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      id="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={handleNameBlur}
                      placeholder="Your name"
                    />
                    {savingName && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Email</Label>
                  <Input value={user?.email ?? ""} readOnly disabled className="mt-1.5" />
                </div>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={resetSending}
                  className="text-sm text-[#D4622A] hover:underline disabled:opacity-50"
                >
                  {resetSending ? "Sending…" : "Send password reset email"}
                </button>
              </div>
            </Card>

            {/* Billing */}
            <Card title="Billing">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold">Growth — $29/month</span>
                    <StatusBadge status={subscriptionStatus} />
                  </div>
                  {subscriptionStatus === "trialing" && trialDateLabel && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Trial ends {trialDateLabel}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast("Billing portal coming soon.")}
                >
                  Manage billing →
                </Button>
              </div>
            </Card>

            {/* Reply tone */}
            <Card title="Reply tone">
              {locationCount > 1 && (
                <p className="text-xs text-muted-foreground mb-3">
                  This applies to all your locations.
                </p>
              )}
              <div className="space-y-2 mb-5">
                {TONES.map((t) => {
                  const active = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border transition-all",
                        active
                          ? "border-[#D4622A] bg-[#FDF3EE] border-2"
                          : "border-[#E8E4DF] hover:border-[#D4C8BA] bg-white",
                      )}
                    >
                      <div className="text-[14px] font-medium">{t.name}</div>
                      <div className="text-[13px] text-muted-foreground mt-0.5">{t.description}</div>
                    </button>
                  );
                })}
              </div>
              <Button onClick={handleSaveTone} disabled={savingTone || locationCount === 0} size="sm">
                {savingTone ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save preferences"
                )}
              </Button>
            </Card>
          </>
        )}
      </main>
    </>
  );
};

const Settings = () => (
  <DashboardLayout>
    <SettingsInner />
  </DashboardLayout>
);

export default Settings;
