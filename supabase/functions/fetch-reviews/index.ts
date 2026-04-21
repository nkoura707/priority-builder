import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FetchReviewsRequest {
  locationId: string;
}

interface GoogleReview {
  reviewId: string;
  reviewer?: { displayName?: string };
  starRating?: string; // "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE"
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: { comment?: string; updateTime?: string };
}

const STAR_MAP: Record<string, number> = {
  ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
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

  if (!res.ok) {
    console.error("Google token refresh failed:", res.status, await res.text());
    return null;
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as FetchReviewsRequest;
    if (!body?.locationId) return jsonResponse({ error: "locationId is required" }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Load location & verify ownership
    const { data: location, error: locErr } = await admin
      .from("locations")
      .select("*")
      .eq("id", body.locationId)
      .maybeSingle();

    if (locErr || !location) return jsonResponse({ error: "Location not found" }, 404);
    if (location.user_id !== userData.user.id) return jsonResponse({ error: "Forbidden" }, 403);

    // 2. Refresh token if expiring within 5 min
    let accessToken: string = location.google_access_token;
    const expiresAt = new Date(location.token_expires_at).getTime();
    const fiveMinFromNow = Date.now() + 5 * 60 * 1000;

    if (expiresAt <= fiveMinFromNow) {
      const refreshed = await refreshGoogleToken(location.google_refresh_token);
      if (!refreshed?.access_token) return jsonResponse({ error: "token_expired" }, 200);

      accessToken = refreshed.access_token;
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      await admin
        .from("locations")
        .update({ google_access_token: accessToken, token_expires_at: newExpiry })
        .eq("id", location.id);
    }

    // 3. Fetch reviews from Google (max 5 pages)
    const allReviews: GoogleReview[] = [];
    let pageToken: string | undefined;
    const baseUrl =
      `https://mybusiness.googleapis.com/v4/${location.google_location_id}/reviews`;

    for (let page = 0; page < 5; page++) {
      const url = new URL(baseUrl);
      url.searchParams.set("pageSize", "50");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 401) return jsonResponse({ error: "token_expired" }, 200);
      if (!res.ok) {
        console.error("Google reviews fetch failed:", res.status, await res.text());
        break;
      }

      const json = await res.json();
      if (Array.isArray(json.reviews)) allReviews.push(...json.reviews);
      pageToken = json.nextPageToken;
      if (!pageToken) break;
    }

    // 4. Load existing reviews for this location
    const googleIds = allReviews.map((r) => r.reviewId);
    const { data: existing } = await admin
      .from("reviews")
      .select("id, google_review_id, reply_status")
      .eq("location_id", location.id)
      .in("google_review_id", googleIds.length ? googleIds : [""]);

    const existingMap = new Map(
      (existing ?? []).map((r) => [r.google_review_id, r]),
    );

    const newRows: Array<{
      location_id: string;
      google_review_id: string;
      reviewer_name: string | null;
      star_rating: number;
      review_text: string | null;
      review_date: string;
      reply_status: string;
      published_at: string | null;
    }> = [];

    const toMarkPublished: string[] = [];

    for (const gr of allReviews) {
      const stars = STAR_MAP[gr.starRating ?? ""] ?? 0;
      if (!stars) continue;

      const existingRow = existingMap.get(gr.reviewId);
      if (existingRow) {
        if (existingRow.reply_status === "published") continue;
        if (existingRow.reply_status === "pending" && gr.reviewReply?.comment) {
          toMarkPublished.push(existingRow.id);
        }
        continue;
      }

      newRows.push({
        location_id: location.id,
        google_review_id: gr.reviewId,
        reviewer_name: gr.reviewer?.displayName ?? null,
        star_rating: stars,
        review_text: gr.comment ?? null,
        review_date: gr.createTime ?? new Date().toISOString(),
        reply_status: gr.reviewReply?.comment ? "published" : "pending",
        published_at: gr.reviewReply?.updateTime ?? null,
      });
    }

    // 5. Update existing rows newly replied on Google
    if (toMarkPublished.length) {
      await admin
        .from("reviews")
        .update({ reply_status: "published", published_at: new Date().toISOString() })
        .in("id", toMarkPublished);
    }

    // 6. Insert new rows
    let insertedRows: { id: string; reply_status: string }[] = [];
    if (newRows.length) {
      const { data: inserted, error: insErr } = await admin
        .from("reviews")
        .insert(newRows)
        .select("id, reply_status");
      if (insErr) console.error("Insert reviews error:", insErr);
      else insertedRows = inserted ?? [];
    }

    // 7. Trigger generate-reply for new pending rows (max 10, 500ms gap)
    const toGenerate = insertedRows.filter((r) => r.reply_status === "pending").slice(0, 10);
    const functionsBase = `${supabaseUrl}/functions/v1/generate-reply`;

    for (let i = 0; i < toGenerate.length; i++) {
      try {
        await fetch(functionsBase, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ reviewId: toGenerate[i].id }),
        });
      } catch (err) {
        console.error("generate-reply trigger failed:", err);
      }
      if (i < toGenerate.length - 1) await new Promise((r) => setTimeout(r, 500));
    }

    // 8. Count total pending
    const { count: totalPending } = await admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("location_id", location.id)
      .eq("reply_status", "pending");

    return jsonResponse({
      newCount: insertedRows.filter((r) => r.reply_status === "pending").length,
      totalPending: totalPending ?? 0,
    });
  } catch (e) {
    console.error("fetch-reviews error:", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});
