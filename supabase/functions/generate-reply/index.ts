import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateReplyRequest {
  reviewId: string;
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

function buildUserMessage(
  reviewerName: string | null,
  starRating: number,
  reviewText: string | null,
): string {
  return `Reviewer: ${reviewerName ?? "A customer"}
Star rating: ${starRating} out of 5
Review text: ${reviewText?.trim() || "[No written review]"}
Write the reply.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as GenerateReplyRequest;
    if (!body?.reviewId || typeof body.reviewId !== "string") {
      return new Response(JSON.stringify({ error: "reviewId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: review, error: reviewErr } = await admin
      .from("reviews")
      .select(
        "id, location_id, reviewer_name, star_rating, review_text, locations!inner(user_id, business_name, reply_tone)",
      )
      .eq("id", body.reviewId)
      .maybeSingle();

    if (reviewErr || !review) {
      return new Response(JSON.stringify({ error: "Review not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore nested join
    const location = review.locations;
    if (location.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    if (!accountId || !cfToken) {
      return new Response(
        JSON.stringify({ error: "Cloudflare credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = buildSystemPrompt(location.reply_tone, location.business_name);
    const userMessage = buildUserMessage(
      review.reviewer_name,
      review.star_rating,
      review.review_text,
    );

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      },
    );

    if (!cfRes.ok) {
      const errText = await cfRes.text();
      console.error("Cloudflare AI error:", cfRes.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfJson = await cfRes.json();
    const reply: string | undefined = cfJson?.result?.response;

    if (!reply || typeof reply !== "string") {
      console.error("Unexpected Cloudflare response shape:", cfJson);
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleaned = reply.trim();

    const { error: updateErr } = await admin
      .from("reviews")
      .update({ ai_generated_reply: cleaned })
      .eq("id", review.id);

    if (updateErr) {
      console.error("Failed to save reply:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to save reply" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ reply: cleaned }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-reply error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
