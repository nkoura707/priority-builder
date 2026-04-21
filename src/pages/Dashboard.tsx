import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabKey = "pending" | "published" | "skipped";

const tabs: { key: TabKey; label: string; count: number }[] = [
  { key: "pending", label: "Pending", count: 0 },
  { key: "published", label: "Published", count: 0 },
  { key: "skipped", label: "Skipped", count: 0 },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  return (
    <DashboardLayout>
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E8E4DF]">
        <div className="flex items-center justify-between px-6 md:px-8 py-4 pl-16 md:pl-8">
          <h1 className="font-serif text-[22px] leading-none">Review Inbox</h1>
          <Button variant="outline" size="sm" disabled>
            Sync reviews
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 md:px-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors",
                  active
                    ? "border-[#D4622A] text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    active
                      ? "bg-[#FDF3EE] text-[#D4622A]"
                      : "bg-[#F1EEE9] text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Empty state */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-[#F1EEE9] flex items-center justify-center">
            <CheckCircle2 size={32} className="text-[#E8E4DF]" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-[26px] mb-2">All caught up</h2>
          <p className="text-sm text-muted-foreground">
            New reviews will appear here when synced.
          </p>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Dashboard;
