// Runs hourly via pg_cron. Loops over locations with auto_reply_enabled=true,
// pulls new reviews from Google, generates AI replies, and stamps each new
// review with a randomized scheduled_publish_at (auto_reply_min..max minutes).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

interface GoogleReview {
  reviewId: string;
  reviewer?: { displayName?: string };
  starRating?: string;
  comment?: string;
  createTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
}

const TONE_GUIDE: Record<string, string> = {
  professional: "professional: warm but measured, no exclamation overuse",
  friendly: "friendly: warm, personal, conversational, 1 emoji allowed",
  formal: "formal: respectful, measured, polite",
};

function buildSystemPrompt(tone: string, businessName: string): string {
  const toneLine = TONE_GUIDE[tone] ?? TONE_GUIDE.professional;
  return `You are a review response writer for a local business called ${businessName}.
Write genuine, human-sounding replies to Google reviews.
Tone: ${tone}
- ${toneLine}

Rules:
- Address reviewer by first name if available
- Reference something specific from the review text
- 1-2 stars: acknowledge issue sincerely, invite them to contact you directly
- 3 stars: thank them, acknowledge concern, mention improvements
- 4-5 stars: genuine gratitude, echo a specific positive detail
- 40 to 75 words maximum
- No hashtags
- Never use: 'We value your feedback' or 'We take this seriously'
- Never start with 'Thank you for your review'
- End with: ${businessName} Team
- Output only the reply text, nothing else`;
}

async function refreshGoogleToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return await res.json() as { access_token: string; expires_in: number };
}

async function generateAiReply(
  tone: string,
  businessName: string,
  reviewerName: string | null,
  starRating: number,
  reviewText: string | null,
): Promise<string | null> {
  const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
  if (!accountId || !cfToken) return null;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: buildSystemPrompt(tone, businessName) },
          {
            role: "user",
            content: `Reviewer: ${reviewerName ?? "A customer"}
Star rating: ${starRating} out of 5
Review text: ${reviewText?.trim() || "[No written review]"}
Write the reply.`,
          },
        ],
      }),
    },
  );
  if (!res.ok) return null;
  const json = await res.json();
  const reply: string | undefined = json?.result?.response;
  return reply?.trim() ?? null;
}

function shouldAutoReply(scope: string, stars: number): boolean {
  if (scope === "five_only") return stars === 5;
  if (scope === "four_plus") return stars >= 4;
  return true; // 'all'
}

function randomDelayMinutes(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const stats = { locationsProcessed: 0, locationsSkipped: 0, newReviews: 0, scheduled: 0, errors: [] as string[] };

  try {
    const { data: locations, error } = await admin
      .from("locations")
      .select("*")
      .eq("auto_reply_enabled", true);

    if (error) throw error;

    for (const loc of locations ?? []) {
      try {
        // Skip locations without a real Google connection (placeholder rows)
        if (!loc.google_refresh_token || !loc.google_location_id || loc.google_location_id.startsWith("placeholder")) {
          stats.locationsSkipped++;
          continue;
        }

        // Refresh token if needed
        let accessToken: string = loc.google_access_token;
        const expiresAt = new Date(loc.token_expires_at).getTime();
        if (expiresAt <= Date.now() + 5 * 60 * 1000) {
          const refreshed = await refreshGoogleToken(loc.google_refresh_token);
          if (!refreshed?.access_token) {
            stats.errors.push(`token_refresh_failed:${loc.id}`);
            continue;
          }
          accessToken = refreshed.access_token;
          await admin
            .from("locations")
            .update({
              google_access_token: accessToken,
              token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            })
            .eq("id", loc.id);
        }

        // Pull reviews from Google
        const allReviews: GoogleReview[] = [];
        let pageToken: string | undefined;
        for (let page = 0; page < 5; page++) {
          const url = new URL(`https://mybusiness.googleapis.com/v4/${loc.google_location_id}/reviews`);
          url.searchParams.set("pageSize", "50");
          if (pageToken) url.searchParams.set("pageToken", pageToken);

          const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) {
            stats.errors.push(`google_fetch_${res.status}:${loc.id}`);
            break;
          }
          const json = await res.json();
          if (Array.isArray(json.reviews)) allReviews.push(...json.reviews);
          pageToken = json.nextPageToken;
          if (!pageToken) break;
        }

        // Find which reviews are new
        const googleIds = allReviews.map((r) => r.reviewId);
        const { data: existing } = await admin
          .from("reviews")
          .select("google_review_id")
          .eq("location_id", loc.id)
          .in("google_review_id", googleIds.length ? googleIds : [""]);
        const existingSet = new Set((existing ?? []).map((r) => r.google_review_id));

        for (const gr of allReviews) {
          const stars = STAR_MAP[gr.starRating ?? ""] ?? 0;
          if (!stars || existingSet.has(gr.reviewId)) continue;

          const isPublishedOnGoogle = !!gr.reviewReply?.comment;
          const willAutoReply = !isPublishedOnGoogle && shouldAutoReply(loc.auto_reply_scope, stars);

          let aiReply: string | null = null;
          let scheduledAt: string | null = null;

          if (willAutoReply) {
            aiReply = await generateAiReply(
              loc.reply_tone,
              loc.business_name,
              gr.reviewer?.displayName ?? null,
              stars,
              gr.comment ?? null,
            );
            if (aiReply) {
              const delay = randomDelayMinutes(loc.auto_reply_min_minutes, loc.auto_reply_max_minutes);
              scheduledAt = new Date(Date.now() + delay * 60 * 1000).toISOString();
              stats.scheduled++;
            }
          }

          await admin.from("reviews").insert({
            location_id: loc.id,
            google_review_id: gr.reviewId,
            reviewer_name: gr.reviewer?.displayName ?? null,
            star_rating: stars,
            review_text: gr.comment ?? null,
            review_date: gr.createTime ?? new Date().toISOString(),
            reply_status: isPublishedOnGoogle ? "published" : "pending",
            published_at: gr.reviewReply?.updateTime ?? null,
            ai_generated_reply: aiReply,
            scheduled_publish_at: scheduledAt,
          });
          stats.newReviews++;
        }

        stats.locationsProcessed++;
      } catch (locErr) {
        stats.errors.push(`location_${loc.id}:${String(locErr)}`);
      }
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cron-sync-reviews error:", e);
    return new Response(JSON.stringify({ error: String(e), stats }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
