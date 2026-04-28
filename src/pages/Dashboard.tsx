import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, Loader2, X, Inbox } from "lucide-react";
import { DashboardLayout, useDashboardLocation } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ReviewsList } from "@/components/dashboard/ReviewsList";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TabKey = "pending" | "published" | "skipped";

interface Counts {
  pending: number;
  published: number;
  skipped: number;
}

const DashboardInner = () => {
  const { user } = useAuth();
  const { selectedLocationId, loadingLocations, locations } = useDashboardLocation();
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [counts, setCounts] = useState<Counts>({ pending: 0, published: 0, skipped: 0 });
  const [syncing, setSyncing] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [autoSynced, setAutoSynced] = useState(false);

  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialDismissed, setTrialDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubscriptionStatus(data?.subscription_status ?? null);
        setTrialEndsAt(data?.trial_ends_at ?? null);
      });
  }, [user]);

  const refreshCounts = async () => {
    if (!selectedLocationId) return;
    const statuses: TabKey[] = ["pending", "published", "skipped"];
    const next: Counts = { pending: 0, published: 0, skipped: 0 };
    await Promise.all(
      statuses.map(async (s) => {
        const { count } = await supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("location_id", selectedLocationId)
          .eq("reply_status", s);
        next[s] = count ?? 0;
      }),
    );
    setCounts(next);
  };

  useEffect(() => {
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  useEffect(() => {
    if (!selectedLocationId) return;
    const ch = supabase
      .channel(`counts:${selectedLocationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `location_id=eq.${selectedLocationId}` },
        () => refreshCounts(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId]);

  const runSync = async (silent = false) => {
    if (!selectedLocationId || syncing) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-reviews", {
        body: { locationId: selectedLocationId },
      });
      if (error) throw error;
      if (data?.error === "token_expired") {
        setTokenExpired(true);
        if (!silent) toast.error("Google connection expired");
        return;
      }
      setTokenExpired(false);
      const newCount = data?.newCount ?? 0;
      if (!silent) {
        toast(`${newCount} new review${newCount === 1 ? "" : "s"} found`, {
          style: { background: "#1C1917", color: "#fff", border: "none" },
        });
      }
      await refreshCounts();
    } catch (e) {
      if (!silent) toast.error("Sync failed. Please try again.");
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!autoSynced && selectedLocationId && !loadingLocations && locations.length > 0) {
      setAutoSynced(true);
      runSync(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocationId, loadingLocations, locations.length, autoSynced]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "published", label: "Published" },
    { key: "skipped", label: "Skipped" },
  ];

  const showEmpty = !loadingLocations && counts[activeTab] === 0 && !syncing;

  // Trial banner calculation
  const showTrialBanner =
    subscriptionStatus === "trialing" && trialEndsAt && !trialDismissed;
  let trialLabel = "";
  if (showTrialBanner) {
    const msLeft = new Date(trialEndsAt!).getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    if (daysLeft < 1) trialLabel = "today";
    else if (daysLeft === 1) trialLabel = "tomorrow";
    else trialLabel = `in ${daysLeft} days`;
  }

  const showPaywall = subscriptionStatus === "canceled" || subscriptionStatus === "past_due";

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="flex items-center justify-between px-6 md:px-8 h-[58px] pl-16 md:pl-8 gap-3">
          <h1 className="font-serif text-[22px] leading-none tracking-[-0.02em]">Review Inbox</h1>
          <div className="flex items-center gap-1 bg-muted-bg rounded-lg p-1">
            <button
              type="button"
              onClick={() => runSync(false)}
              disabled={syncing || !selectedLocationId}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-press"
            >
              {syncing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Syncing…
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Sync reviews
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-4 md:px-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-[13px] -mb-px transition-colors",
                  active
                    ? "border-b-2 border-accent text-foreground font-medium"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "min-w-[18px] h-[18px] inline-flex items-center justify-center text-[11px] font-mono px-1 rounded-full",
                    active ? "bg-accent-light text-accent" : "bg-muted-bg-strong text-muted-foreground",
                  )}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {showTrialBanner && (
        <div className="bg-warning-light border-b border-[hsl(38_70%_82%)] px-6 md:px-8 py-2.5 flex items-center justify-between gap-3">
          <div className="text-sm text-[hsl(38_92%_28%)]">
            Your free trial ends {trialLabel}. Add a payment method to keep publishing.
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-surface"
              onClick={() => toast("Billing portal coming soon.")}
            >
              Add payment →
            </Button>
            <button
              onClick={() => setTrialDismissed(true)}
              aria-label="Dismiss"
              className="text-[hsl(38_92%_28%)] hover:opacity-70 p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {tokenExpired && (
        <div className="bg-warning-light border-b border-[hsl(38_70%_82%)] px-6 md:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[hsl(38_92%_28%)]">
            <AlertTriangle size={16} />
            Your Google connection needs renewal.
          </div>
          <Button size="sm" variant="outline" className="bg-surface">
            Reconnect Google
          </Button>
        </div>
      )}

      <div className="relative flex-1 flex flex-col">
        <main
          className={cn("flex-1", showPaywall && "pointer-events-none")}
          style={showPaywall ? { filter: "blur(4px)" } : undefined}
        >
          {locations.length === 0 && !loadingLocations ? (
            <div className="flex items-center justify-center px-6 py-16">
              <div className="text-center max-w-sm">
                <h2 className="font-serif text-[26px] mb-2 tracking-[-0.02em]">No location connected</h2>
                <p className="text-sm text-muted-foreground">
                  Connect a Google Business location to start syncing reviews.
                </p>
              </div>
            </div>
          ) : showEmpty ? (
            <EmptyState tab={activeTab} />
          ) : (
            <ReviewsList
              locationId={selectedLocationId}
              status={activeTab}
              loadingInitial={syncing && counts[activeTab] === 0}
            />
          )}
        </main>

        {showPaywall && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <div className="bg-surface border border-border rounded-xl shadow-sm p-8 max-w-sm text-center">
              <h2 className="font-serif text-[24px] mb-2 tracking-[-0.02em]">Your subscription has ended</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Reactivate to keep replying to reviews.
              </p>
              <Button onClick={() => toast("Billing portal coming soon.")} className="w-full">
                Reactivate — $29/month
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddReviewSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        locationId={selectedLocationId}
      />
    </>
  );
};

const EmptyState = ({ tab }: { tab: TabKey }) => {
  if (tab === "pending") {
    return (
      <div className="flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-sm">
          <svg
            className="mx-auto mb-6"
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            stroke="hsl(var(--border-strong))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 38v22a4 4 0 0 0 4 4h44a4 4 0 0 0 4-4V38" />
            <path d="M14 38l8-22a4 4 0 0 1 4-3h28a4 4 0 0 1 4 3l8 22" />
            <path d="M14 38h14l4 8h16l4-8h14" />
            <path
              className="check-draw"
              d="M32 22l6 6 12-14"
              stroke="hsl(var(--success))"
              strokeWidth="2"
            />
          </svg>
          <h2 className="font-serif text-[28px] mb-2 tracking-[-0.02em]">All caught up</h2>
          <p className="text-sm text-muted-foreground">
            New reviews will appear here when synced.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center px-6 py-20">
      <div className="text-center">
        <Inbox size={32} className="mx-auto mb-4 text-border-strong" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground capitalize">No {tab} reviews yet.</p>
      </div>
    </div>
  );
};

const Dashboard = () => (
  <DashboardLayout>
    <DashboardInner />
  </DashboardLayout>
);

export default Dashboard;
