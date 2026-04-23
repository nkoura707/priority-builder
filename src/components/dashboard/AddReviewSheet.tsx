import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Star, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddReviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
}

export const AddReviewSheet = ({ open, onOpenChange, locationId }: AddReviewSheetProps) => {
  const [reviewerName, setReviewerName] = useState("");
  const [stars, setStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [fallbackLocationId, setFallbackLocationId] = useState<string>("");

  // If parent didn't pass a locationId, fetch the user's first location.
  useEffect(() => {
    if (locationId || !open) return;
    (async () => {
      const { data } = await supabase
        .from("locations")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (data?.id) setFallbackLocationId(data.id);
    })();
  }, [open, locationId]);

  const reset = () => {
    setReviewerName("");
    setStars(5);
    setHoverStars(0);
    setReviewText("");
    setDate(new Date());
  };

  const handleSubmit = async () => {
    const effectiveLocationId = locationId || fallbackLocationId;
    if (!effectiveLocationId) {
      toast.error("No location available. Please complete onboarding first.");
      return;
    }
    if (stars < 1 || stars > 5) {
      toast.error("Please select a star rating");
      return;
    }
    if (!reviewerName.trim() && !reviewText.trim()) {
      toast.error("Add a reviewer name or review text");
      return;
    }

    setSubmitting(true);
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from("reviews")
        .insert({
          location_id: effectiveLocationId,
          google_review_id: `manual_${Date.now()}`,
          reviewer_name: reviewerName.trim() || null,
          star_rating: stars,
          review_text: reviewText.trim() || null,
          review_date: date.toISOString(),
          reply_status: "pending",
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // Fire-and-forget reply generation
      supabase.functions
        .invoke("generate-reply", { body: { reviewId: inserted.id } })
        .catch((e) => console.error("generate-reply failed", e));

      toast("Review added — generating reply...", {
        style: { background: "#1C1917", color: "#fff", border: "none" },
      });

      reset();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to add review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-surface overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-[26px] font-normal tracking-[-0.02em]">
            Add a review manually
          </SheetTitle>
          <SheetDescription>
            Copy a review from Google and paste it here to generate a reply.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reviewer-name" className="label-tiny text-muted-foreground">
              Reviewer name
            </Label>
            <Input
              id="reviewer-name"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. Sarah M."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label className="label-tiny text-muted-foreground">Star rating</Label>
            <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverStars(0)}>
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverStars || stars) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStars(n)}
                    onMouseEnter={() => setHoverStars(n)}
                    className="p-1 -m-1 transition-transform hover:scale-110 active:scale-95"
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  >
                    <Star
                      size={36}
                      strokeWidth={1.5}
                      className={cn(
                        "transition-all duration-150",
                        filled ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]" : "fill-transparent text-[#D1D5DB]",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-text" className="label-tiny text-muted-foreground">
              Review text
            </Label>
            <Textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Paste the review text here..."
              className="min-h-[110px] resize-y"
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label className="label-tiny text-muted-foreground">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-surface",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-surface" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full group"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Save & generate reply
                <span className="arrow-nudge">→</span>
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
