import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

interface GenerateReplyRequest {
  reviewId: string;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional:
    "Write in a professional, courteous tone. Be respectful and businesslike, avoiding overly casual language.",
  friendly:
    "Write in a warm, friendly, and conversational tone. Sound human and approachable, like a small business owner who genuinely cares.",
  formal:
    "Write in a formal tone. Use polished language, full sentences, and a respectful, slightly traditional voice.",
};

function buildSystemPrompt(tone: string, businessName: string): string {
  const toneInstruction = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.professional;
  return [
    `You are writing a reply on behalf of ${businessName} to a Google review.`,
    toneInstruction,
    "Rules:",
    "- Keep replies concise: 2-4 sentences, under 600 characters.",
    "- Address the reviewer by name if provided.",
    "- Reference something specific from their review when possible (don't be generic).",
    "- Thank positive reviewers sincerely. For negative reviews, acknowledge the issue, apologize where appropriate, and offer to make it right.",
    "- Never make promises about refunds, discounts, or compensation.",
    "- Do not include hashtags, emojis, links, or marketing language.",
    "- Sign off naturally (e.g., '— The team at " + businessName + "') only if it fits the tone.",
    "- Output only the reply text. No preamble, no quotes, no explanation.",
  ].join("\n");
}

function buildUserMessage(
  reviewerName: string | null,
  starRating: number,
  reviewText: string | null,
): string {
  const lines = [
    `Reviewer: ${reviewerName ?? "Anonymous"}`,
    `Rating: ${starRating} / 5`,
    `Review: ${reviewText?.trim() || "(no text provided)"}`,
    "",
    "Write the reply now.",
  ];
  return lines.join("\n");
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

    // Load review + location, verify ownership
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

    // @ts-ignore nested join type
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
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
      JSON.stringify({ reviewId: review.id, reply: cleaned }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-reply error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
