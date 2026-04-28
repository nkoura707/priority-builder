// Runs every 5 minutes via pg_cron. Finds reviews where scheduled_publish_at <= now()
// and publishes the AI reply to Google, then marks them as published.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const stats = { attempted: 0, published: 0, errors: [] as string[] };

  try {
    // Pull due reviews with their location joined in
    const { data: due, error } = await admin
      .from("reviews")
      .select("id, location_id, google_review_id, ai_generated_reply, scheduled_publish_at")
      .eq("reply_status", "pending")
      .not("ai_generated_reply", "is", null)
      .not("scheduled_publish_at", "is", null)
      .lte("scheduled_publish_at", new Date().toISOString())
      .limit(50);

    if (error) throw error;
    if (!due || due.length === 0) {
      return new Response(JSON.stringify({ ...stats, message: "nothing_due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache locations
    const locIds = [...new Set(due.map((r) => r.location_id))];
    const { data: locations } = await admin
      .from("locations")
      .select("id, google_location_id, google_access_token, google_refresh_token, token_expires_at, auto_reply_enabled")
      .in("id", locIds);
    const locMap = new Map((locations ?? []).map((l) => [l.id, l]));

    for (const review of due) {
      stats.attempted++;
      const loc = locMap.get(review.location_id);
      if (!loc) {
        stats.errors.push(`no_location:${review.id}`);
        continue;
      }
      if (!loc.auto_reply_enabled) continue; // owner disabled in the meantime
      if (!loc.google_refresh_token || !loc.google_location_id || loc.google_location_id.startsWith("placeholder")) {
        stats.errors.push(`no_google_connection:${review.id}`);
        continue;
      }

      // Refresh token if needed
      let accessToken: string = loc.google_access_token;
      if (new Date(loc.token_expires_at).getTime() <= Date.now() + 5 * 60 * 1000) {
        const refreshed = await refreshGoogleToken(loc.google_refresh_token);
        if (!refreshed?.access_token) {
          stats.errors.push(`token_refresh_failed:${review.id}`);
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

      // PUT reply on Google
      const res = await fetch(
        `https://mybusiness.googleapis.com/v4/${loc.google_location_id}/reviews/${review.google_review_id}/reply`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comment: review.ai_generated_reply }),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("Google reply publish failed:", res.status, errText);
        stats.errors.push(`google_publish_${res.status}:${review.id}`);
        continue;
      }

      await admin
        .from("reviews")
        .update({
          reply_status: "published",
          reply_text: review.ai_generated_reply,
          published_at: new Date().toISOString(),
        })
        .eq("id", review.id);
      stats.published++;
    }

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cron-publish-replies error:", e);
    return new Response(JSON.stringify({ error: String(e), stats }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
