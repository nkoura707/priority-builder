import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tone = "professional" | "friendly" | "formal";
type Scope = "all" | "four_plus" | "five_only";

const TONES: { id: Tone; name: string; description: string }[] = [
  { id: "professional", name: "Professional", description: "Warm but composed. Works for most businesses." },
  { id: "friendly", name: "Friendly", description: "Conversational and personable." },
  { id: "formal", name: "Formal", description: "Polished and traditional." },
];

const StatusBadge = ({ status }: { status: string | null }) => {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    active: { label: "Active", bg: "bg-success-light", text: "text-success", dot: "bg-success" },
    trialing: { label: "Trialing", bg: "bg-warning-light", text: "text-[hsl(38_92%_28%)]", dot: "bg-warning" },
    past_due: { label: "Past due", bg: "bg-danger-light", text: "text-danger", dot: "bg-danger" },
    canceled: { label: "Canceled", bg: "bg-muted-bg", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  };
  const v = status && map[status] ? map[status] : { label: "Trial", bg: "bg-warning-light", text: "text-[hsl(38_92%_28%)]", dot: "bg-warning" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md", v.bg, v.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", v.dot)} />
      {v.label}
    </span>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-surface border border-border rounded-xl p-6 hover-lift">
    <div className="flex items-center gap-3 mb-5">
      <div className="h-px w-6 bg-accent" />
      <h2 className="font-serif text-[20px] tracking-[-0.02em]">{title}</h2>
    </div>
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
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Tone
  const [tone, setTone] = useState<Tone>("professional");
  const [locationCount, setLocationCount] = useState(0);
  const [savingTone, setSavingTone] = useState(false);

  // Auto-reply
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [autoMin, setAutoMin] = useState(120);
  const [autoMax, setAutoMax] = useState(360);
  const [autoScope, setAutoScope] = useState<Scope>("all");
  const [savingAuto, setSavingAuto] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: profile }, { data: locs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, subscription_status, trial_ends_at, subscription_id")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("locations")
          .select("id, reply_tone, auto_reply_enabled, auto_reply_min_minutes, auto_reply_max_minutes, auto_reply_scope")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
      ]);

      const name = profile?.full_name ?? "";
      setFullName(name);
      setInitialFullName(name);
      setSubscriptionStatus(profile?.subscription_status ?? null);
      setTrialEndsAt(profile?.trial_ends_at ?? null);
      setSubscriptionId(profile?.subscription_id ?? null);

      if (locs && locs.length > 0) {
        const first = locs[0];
        setTone((first.reply_tone as Tone) ?? "professional");
        setAutoEnabled(first.auto_reply_enabled ?? true);
        setAutoMin(first.auto_reply_min_minutes ?? 120);
        setAutoMax(first.auto_reply_max_minutes ?? 360);
        setAutoScope((first.auto_reply_scope as Scope) ?? "all");
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

  const handleSaveAuto = async () => {
    if (!user) return;
    if (autoMin < 1 || autoMax < autoMin) {
      toast.error("Max delay must be greater than min delay");
      return;
    }
    setSavingAuto(true);
    const { error } = await supabase
      .from("locations")
      .update({
        auto_reply_enabled: autoEnabled,
        auto_reply_min_minutes: autoMin,
        auto_reply_max_minutes: autoMax,
        auto_reply_scope: autoScope,
      })
      .eq("user_id", user.id);
    setSavingAuto(false);
    if (error) {
      toast.error("Couldn't save auto-reply settings");
      return;
    }
    toast("Auto-reply settings saved", {
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
                    <span className="text-[15px] font-semibold">{(() => {
                      const id = subscriptionId ?? "";
                      if (id.includes("starter")) return "Starter — $39/month";
                      if (id.includes("growth")) return "Growth — $69/month";
                      if (id.includes("agency")) return "Agency — $149/month";
                      return "ReviewReply — Active subscription";
                    })()}</span>
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

            {/* Auto-reply */}
            <Card title="Auto-reply">
              <p className="text-xs text-muted-foreground mb-4">
                Replies are generated automatically and published with a randomized delay so they look natural to Google.
              </p>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <div className="text-[14px] font-medium">Enable auto-reply</div>
                  <div className="text-[13px] text-muted-foreground mt-0.5">
                    {autoEnabled ? "New reviews are replied to automatically." : "Replies stay as drafts in Pending."}
                  </div>
                </div>
                <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-b border-border">
                <div>
                  <Label htmlFor="auto_min" className="text-sm">Min delay (minutes)</Label>
                  <Input
                    id="auto_min"
                    type="number"
                    min={1}
                    value={autoMin}
                    onChange={(e) => setAutoMin(Number(e.target.value) || 0)}
                    disabled={!autoEnabled}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="auto_max" className="text-sm">Max delay (minutes)</Label>
                  <Input
                    id="auto_max"
                    type="number"
                    min={1}
                    value={autoMax}
                    onChange={(e) => setAutoMax(Number(e.target.value) || 0)}
                    disabled={!autoEnabled}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="py-4">
                <Label className="text-sm mb-2 block">Reply to</Label>
                <div className="space-y-2">
                  {([
                    { id: "all", label: "All reviews", desc: "Every new review gets a reply." },
                    { id: "four_plus", label: "4–5 star reviews only", desc: "Negative reviews stay in Pending for you to handle." },
                    { id: "five_only", label: "5 star reviews only", desc: "Most conservative — only perfect ratings." },
                  ] as { id: Scope; label: string; desc: string }[]).map((s) => {
                    const active = autoScope === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!autoEnabled}
                        onClick={() => setAutoScope(s.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all disabled:opacity-50",
                          active
                            ? "border-[#D4622A] bg-[#FDF3EE] border-2"
                            : "border-[#E8E4DF] hover:border-[#D4C8BA] bg-white",
                        )}
                      >
                        <div className="text-[14px] font-medium">{s.label}</div>
                        <div className="text-[13px] text-muted-foreground mt-0.5">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleSaveAuto} disabled={savingAuto || locationCount === 0} size="sm">
                {savingAuto ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save auto-reply settings"
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
