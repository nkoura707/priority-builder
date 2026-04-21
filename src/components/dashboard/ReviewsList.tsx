import { useEffect, useState } from "react";
import { Loader2, Star, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ReviewRow {
  id: string;
  reviewer_name: string | null;
  star_rating: number;
  review_text: string | null;
  review_date: string;
  ai_generated_reply: string | null;
  reply_text: string | null;
  reply_status: string;
}

const AVATAR_COLORS = ["#FDE68A", "#BBF7D0", "#BFDBFE", "#DDD6FE", "#FED7AA", "#FECACA"];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function avatarColor(name: string | null): string {
  return AVATAR_COLORS[hashString(name ?? "?") % AVATAR_COLORS.length];
}

function initial(name: string | null): string {
  return (name?.trim()?.[0] ?? "?").toUpperCase();
}

function relativeDate(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function borderColor(stars: number): string {
  if (stars >= 4) return "#16A34A";
  if (stars === 3) return "#CA8A04";
  return "#DC2626";
}

const Stars = ({ count }: { count: number }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={14}
        fill={i <= count ? "#F59E0B" : "#D1D5DB"}
        stroke="none"
      />
    ))}
  </span>
);

const SkeletonCard = () => (
  <div className="bg-white border border-[#E8E4DF] rounded-lg p-5 overflow-hidden">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full skeleton-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 skeleton-shimmer rounded" />
        <div className="h-2 w-20 skeleton-shimmer rounded" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 w-full skeleton-shimmer rounded" />
      <div className="h-3 w-4/5 skeleton-shimmer rounded" />
    </div>
    <div className="mt-5 h-20 skeleton-shimmer rounded" />
  </div>
);

const ReviewCard = ({
  review,
  onRegenerate,
  onSkip,
  onPublish,
  onDraftChange,
}: {
  review: ReviewRow;
  onRegenerate: (id: string) => void;
  onSkip: (id: string) => void;
  onPublish: (id: string, text: string) => void;
  onDraftChange: (id: string, text: string) => void;
}) => {
  const [confirmingSkip, setConfirmingSkip] = useState(false);
  const [busy, setBusy] = useState<"regen" | "publish" | "skip" | null>(null);

  const draft = review.ai_generated_reply ?? "";
  const isGenerating = review.ai_generated_reply === null;
  const isLowStar = review.star_rating <= 2;

  return (
    <article
      className="bg-white border border-[#E8E4DF] rounded-lg overflow-hidden"
      style={{ borderLeft: `4px solid ${borderColor(review.star_rating)}` }}
    >
      <div className="p-5">
        {/* Row 1 */}
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold text-[#1C1917]"
            style={{ backgroundColor: avatarColor(review.reviewer_name) }}
          >
            {initial(review.reviewer_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-semibold text-[#1C1917]">
                {review.reviewer_name ?? "Anonymous"}
              </span>
              <Stars count={review.star_rating} />
              <span className="text-xs text-muted-foreground">
                · {relativeDate(review.review_date)}
              </span>
              {isLowStar && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626]">
                  Needs response
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="mt-4">
          {review.review_text ? (
            <p className="text-[15px] text-[#374151] leading-[1.7] whitespace-pre-line">
              {review.review_text}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Left a star rating without a written review
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-dashed border-[#E8E4DF]" />

        {/* Draft label */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-wider font-medium text-[#D4622A]">
            Draft reply
          </span>
          {isGenerating && (
            <Loader2 size={12} className="animate-spin text-[#D4622A]" />
          )}
        </div>

        {/* Editable textarea */}
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(review.id, e.target.value)}
          placeholder={isGenerating ? "Generating reply..." : "Write your reply..."}
          disabled={isGenerating}
          className="w-full bg-[#FFFBEB] border border-[#E8C87A] rounded-md p-3 text-[14px] text-[#1C1917] leading-relaxed resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#D4622A]/30"
        />

        {/* Bottom row */}
        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={async () => {
                setBusy("regen");
                await onRegenerate(review.id);
                setBusy(null);
              }}
              disabled={busy !== null || isGenerating}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              {busy === "regen" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RotateCcw size={14} />
              )}
              Regenerate
            </button>
            {confirmingSkip ? (
              <span className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">Skip this review?</span>
                <button
                  className="text-[#DC2626] font-medium hover:underline"
                  onClick={async () => {
                    setBusy("skip");
                    await onSkip(review.id);
                    setBusy(null);
                  }}
                >
                  Yes, skip
                </button>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setConfirmingSkip(false)}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingSkip(true)}
                disabled={busy !== null}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
          <Button
            size="sm"
            disabled={!draft || isGenerating || busy !== null}
            onClick={async () => {
              setBusy("publish");
              await onPublish(review.id, draft);
              setBusy(null);
            }}
          >
            {busy === "publish" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>Publish reply →</>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

export const ReviewsList = ({
  locationId,
  loadingInitial,
}: {
  locationId: string;
  loadingInitial: boolean;
}) => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load pending reviews
  const refresh = async () => {
    if (!locationId) return;
    const { data } = await supabase
      .from("reviews")
      .select("id, reviewer_name, star_rating, review_text, review_date, ai_generated_reply, reply_text, reply_status")
      .eq("location_id", locationId)
      .eq("reply_status", "pending")
      .order("review_date", { ascending: false });
    setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // Realtime updates so AI replies appear as they finish
  useEffect(() => {
    if (!locationId) return;
    const channel = supabase
      .channel(`reviews:${locationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `location_id=eq.${locationId}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const handleDraftChange = (id: string, text: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ai_generated_reply: text } : r)),
    );
  };

  const handleRegenerate = async (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ai_generated_reply: null } : r)),
    );
    await supabase.functions.invoke("generate-reply", { body: { reviewId: id } });
    await refresh();
  };

  const handleSkip = async (id: string) => {
    await supabase.from("reviews").update({ reply_status: "skipped" }).eq("id", id);
    await refresh();
  };

  const handlePublish = async (id: string, text: string) => {
    // Local-only publish for now (Google publish endpoint comes later)
    await supabase
      .from("reviews")
      .update({
        reply_text: text,
        reply_status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", id);
    await refresh();
  };

  if (loadingInitial || loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto px-6 py-6">
        {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto px-6 py-6">
      {reviews.map((r) => (
        <ReviewCard
          key={r.id}
          review={r}
          onRegenerate={handleRegenerate}
          onSkip={handleSkip}
          onPublish={handlePublish}
          onDraftChange={handleDraftChange}
        />
      ))}
    </div>
  );
};
