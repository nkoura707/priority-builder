import { useEffect, useState } from "react";
import { Loader2, MapPin, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LocationRow {
  id: string;
  business_name: string;
  address: string | null;
  reply_tone: string;
}

const ToneBadge = ({ tone }: { tone: string }) => (
  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FDF3EE] text-[#D4622A] capitalize">
    {tone}
  </span>
);

const LocationsInner = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("locations")
      .select("id, business_name, address, reply_tone")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setLocations(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const { error } = await supabase.from("locations").delete().eq("id", id);
    setRemovingId(null);
    setConfirmingId(null);
    if (error) {
      toast.error("Couldn't remove location");
      return;
    }
    toast("Location removed", {
      style: { background: "#1C1917", color: "#fff", border: "none" },
    });
    await refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-surface border-b border-border">
        <div className="flex items-center justify-between px-6 md:px-8 h-[58px] pl-16 md:pl-8">
          <h1 className="font-serif text-[22px] leading-none tracking-[-0.02em]">Locations</h1>
          <Button size="sm" onClick={() => toast("Connecting more locations is coming soon.")}>
            <Plus size={14} className="mr-1.5" />
            Add another location
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        ) : locations.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-10 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-muted-bg flex items-center justify-center">
              <MapPin size={22} className="text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-[22px] mb-1 tracking-[-0.02em]">No locations yet</h2>
            <p className="text-sm text-muted-foreground">
              Connect a Google Business location to get started.
            </p>
          </div>
        ) : (
          locations.map((loc, idx) => {
            const confirming = confirmingId === loc.id;
            const removing = removingId === loc.id;
            return (
              <div
                key={loc.id}
                className="bg-surface border border-border rounded-xl p-5 flex items-start justify-between gap-4 hover-lift animate-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-semibold text-foreground">
                      {loc.business_name}
                    </h3>
                    <ToneBadge tone={loc.reply_tone} />
                  </div>
                  {loc.address && (
                    <p className="text-sm text-muted-foreground mt-1">{loc.address}</p>
                  )}
                </div>

                {confirming ? (
                  <div className="flex items-center gap-3 text-sm shrink-0">
                    <span className="text-muted-foreground hidden sm:inline">Are you sure?</span>
                    <button
                      onClick={() => handleRemove(loc.id)}
                      disabled={removing}
                      className="text-danger font-medium hover:underline disabled:opacity-50"
                    >
                      {removing ? "Removing…" : "Yes, remove"}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      disabled={removing}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingId(loc.id)}
                    className="shrink-0"
                  >
                    Remove
                  </Button>
                )}
              </div>
            );
          })
        )}
      </main>
    </>
  );
};

const Locations = () => (
  <DashboardLayout>
    <LocationsInner />
  </DashboardLayout>
);

export default Locations;
