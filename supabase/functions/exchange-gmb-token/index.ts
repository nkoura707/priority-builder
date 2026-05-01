import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ExchangeRequest {
  code: string;
  redirectUri: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = (await req.json()) as ExchangeRequest;
    if (!body.code || !body.redirectUri) {
      return json({ error: "missing_params" }, 400);
    }

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return json({ error: "missing_google_creds" }, 500);

    // 1. Exchange code → tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: body.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: body.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange failed:", errText);
      return json({ error: "token_exchange_failed" }, 400);
    }

    const tokens = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token || !refresh_token) {
      console.error("Missing tokens in Google response:", tokens);
      return json({ error: "missing_tokens" }, 400);
    }

    // 2. Fetch GMB accounts
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    if (!accountsRes.ok) {
      const errText = await accountsRes.text();
      console.error("GMB accounts fetch failed:", errText);
      return json(
        {
          error: "gmb_accounts_failed",
          access_token,
          refresh_token,
          expires_in,
        },
        200,
      );
    }

    const accountsData = await accountsRes.json();
    const accounts = accountsData.accounts ?? [];

    if (accounts.length === 0) {
      return json({
        accounts: [],
        locations: [],
        access_token,
        refresh_token,
        expires_in,
        account_id: "",
      });
    }

    // 3. Fetch locations for the first account (v4 endpoint per spec)
    const accountName = accounts[0].name; // "accounts/{id}"
    const accountId = accountName.replace("accounts/", "");

    const locationsRes = await fetch(
      `https://mybusiness.googleapis.com/v4/${accountName}/locations`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    let locations: unknown[] = [];
    if (locationsRes.ok) {
      const locData = await locationsRes.json();
      locations = locData.locations ?? [];
    } else {
      const errText = await locationsRes.text();
      console.error("GMB locations fetch failed:", errText);
    }

    return json({
      accounts,
      locations,
      access_token,
      refresh_token,
      expires_in,
      account_id: accountId,
    });
  } catch (err) {
    console.error("exchange-gmb-token error:", err);
    return json({ error: "internal_error" }, 500);
  }
});
