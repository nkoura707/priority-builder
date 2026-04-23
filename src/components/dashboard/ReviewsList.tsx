import { useEffect, useState } from "react";
import { Loader2, Star, RotateCcw, Undo2, PenLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReviewRow {
  id: string;
  reviewer_name: string | null;
  star_rating: number;
  review_text: string | null;
  review_date: string;
  ai_generated_reply: string | null;
  reply_text: string | null;
  reply_status: string;
  published_at: string | null;
}

type Status = "pending" | "published" | "skipped";

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
  if (stars >= 4) return "hsl(var(--success))";
  if (stars === 3) return "hsl(var(--warning))";
  return "hsl(var(--danger))";
}

const Stars = ({ count }: { count: number }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={15}
        fill={i <= count ? "#F59E0B" : "#D1D5DB"}
        stroke="none"
      />
    ))}
  </span>
);

const SkeletonCard = () => (
  <div className="bg-surface border border-border rounded-xl p-5 overflow-hidden">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full skeleton-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 skeleton-shimmer" />
        <div className="h-2 w-20 skeleton-shimmer" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 w-full skeleton-shimmer" />
      <div className="h-3 w-4/5 skeleton-shimmer" />
    </div>
    <div className="mt-5 h-20 skeleton-shimmer" />
  </div>
);

const ReviewHeader = ({ review }: { review: ReviewRow }) => {
  const isLowStar = review.star_rating <= 2;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold text-foreground"
        style={{ backgroundColor: avatarColor(review.reviewer_name) }}
      >
        {initial(review.reviewer_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-semibold text-foreground">
            {review.reviewer_name ?? "Anonymous"}
          </span>
          <Stars count={review.star_rating} />
          <span className="text-xs text-muted-foreground">
            · {relativeDate(review.review_date)}
          </span>
          {isLowStar && review.reply_status === "pending" && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-danger-light text-danger">
              Needs response
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewBody = ({ text }: { text: string | null }) =>
  text ? (
    <p className="text-[15px] text-foreground/80 leading-[1.7] whitespace-pre-line">{text}</p>
  ) : (
    <p className="text-sm italic text-muted-foreground">
      Left a star rating without a written review
    </p>
  );

const PendingCard = ({
  review,
  onRegenerate,
  onSkip,
  onPublish,
  onDraftChange,
  index,
}: {
  review: ReviewRow;
  onRegenerate: (id: string) => void;
  onSkip: (id: string) => void;
  onPublish: (id: string, text: string) => void;
  onDraftChange: (id: string, text: string) => void;
  index: number;
}) => {
  const [confirmingSkip, setConfirmingSkip] = useState(false);
  const [busy, setBusy] = useState<"regen" | "publish" | "skip" | null>(null);
  const [publishedAnim, setPublishedAnim] = useState(false);

  const draft = review.ai_generated_reply ?? "";
  const isGenerating = review.ai_generated_reply === null;
  const charCount = draft.length;
  const charLimit = 600;

  return (
    <article
      className={cn(
        "bg-surface border border-border rounded-xl overflow-hidden hover-lift animate-in-up",
        publishedAnim && "opacity-0 scale-95 translate-y-2 transition-all duration-300",
      )}
      style={{
        borderLeft: `3px solid ${borderColor(review.star_rating)}`,
        animationDelay: `${Math.min(index, 6) * 60}ms`,
      }}
    >
      <div className="p-5">
        <ReviewHeader review={review} />
        <div className="mt-4">
          <ReviewBody text={review.review_text} />
        </div>

        <div className="my-5 border-t border-dashed border-border" />

        <div className="flex items-center gap-1.5 mb-2">
          <PenLine size={12} className="text-accent" />
          <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-accent">
            Draft reply
          </span>
          {isGenerating && <Loader2 size={12} className="animate-spin text-accent" />}
        </div>

        <div className="relative focus-glow rounded-lg transition-all">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(review.id, e.target.value)}
            placeholder={isGenerating ? "Generating reply..." : "Write your reply..."}
            disabled={isGenerating}
            className="w-full bg-draft-bg border border-draft-border rounded-lg p-3 pb-7 text-[14px] text-foreground leading-relaxed resize-y min-h-[88px] focus:outline-none focus:bg-[hsl(48_100%_94%)] transition-colors"
          />
          {!isGenerating && (
            <span className="absolute bottom-2 right-3 text-[11px] font-mono text-muted-foreground/70 pointer-events-none">
              {charCount} / {charLimit}
            </span>
          )}
        </div>

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
                  className="text-danger font-medium hover:underline"
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
              setPublishedAnim(true);
              await new Promise((r) => setTimeout(r, 280));
              await onPublish(review.id, draft);
              setBusy(null);
            }}
          >
            {busy === "publish" ? <Loader2 size={14} className="animate-spin" /> : <>Publish reply →</>}
          </Button>
        </div>
      </div>
    </article>
  );
};

const PublishedCard = ({ review, index }: { review: ReviewRow; index: number }) => (
  <article
    className="bg-surface border border-border rounded-xl overflow-hidden hover-lift animate-in-up"
    style={{
      borderLeft: `3px solid ${borderColor(review.star_rating)}`,
      animationDelay: `${Math.min(index, 6) * 60}ms`,
    }}
  >
    <div className="p-5">
      <ReviewHeader review={review} />
      <div className="mt-4">
        <ReviewBody text={review.review_text} />
      </div>
      <div className="my-5 border-t border-dashed border-border" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-success">
          Published reply
        </span>
        {review.published_at && (
          <span className="text-xs text-muted-foreground">
            · {relativeDate(review.published_at)}
          </span>
        )}
      </div>
      <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-line bg-success-light border border-[hsl(158_50%_82%)] rounded-lg p-3">
        {review.reply_text ?? ""}
      </p>
    </div>
  </article>
);

const SkippedCard = ({
  review,
  onRestore,
  index,
}: {
  review: ReviewRow;
  onRestore: (id: string) => void;
  index: number;
}) => {
  const [busy, setBusy] = useState(false);
  return (
    <article
      className="bg-surface border border-border rounded-xl overflow-hidden opacity-90 animate-in-up"
      style={{
        borderLeft: `3px solid ${borderColor(review.star_rating)}`,
        animationDelay: `${Math.min(index, 6) * 60}ms`,
      }}
    >
      <div className="p-5">
        <ReviewHeader review={review} />
        <div className="mt-4">
          <ReviewBody text={review.review_text} />
        </div>
        <div className="mt-5 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onRestore(review.id);
              setBusy(false);
            }}
          >
            {busy ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Undo2 size={14} className="mr-1.5" />
            )}
            Restore to pending
          </Button>
        </div>
      </div>
    </article>
  );
};

export const ReviewsList = ({
  locationId,
  status,
  loadingInitial,
}: {
  locationId: string;
  status: Status;
  loadingInitial: boolean;
}) => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!locationId) return;
    const { data } = await supabase
      .from("reviews")
      .select(
        "id, reviewer_name, star_rating, review_text, review_date, ai_generated_reply, reply_text, reply_status, published_at",
      )
      .eq("location_id", locationId)
      .eq("reply_status", status)
      .order(status === "published" ? "published_at" : "review_date", { ascending: false });
    setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, status]);

  useEffect(() => {
    if (!locationId) return;
    const channel = supabase
      .channel(`reviews:${locationId}:${status}`)
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
  }, [locationId, status]);

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

  const handleRestore = async (id: string) => {
    await supabase.from("reviews").update({ reply_status: "pending" }).eq("id", id);
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
      {reviews.map((r, idx) => {
        if (status === "published") return <PublishedCard key={r.id} review={r} index={idx} />;
        if (status === "skipped")
          return <SkippedCard key={r.id} review={r} onRestore={handleRestore} index={idx} />;
        return (
          <PendingCard
            key={r.id}
            review={r}
            index={idx}
            onRegenerate={handleRegenerate}
            onSkip={handleSkip}
            onPublish={handlePublish}
            onDraftChange={handleDraftChange}
          />
        );
      })}
    </div>
  );
};
