/**
 * Google Business Profile OAuth constants.
 * The client ID is a public identifier — safe to expose in frontend code.
 * The matching client SECRET stays server-side in edge function env vars.
 */
export const GOOGLE_CLIENT_ID =
  "18881781731-u4rd3ovel83gshd7bo4kicigotou0rjj.apps.googleusercontent.com";

export const GMB_SCOPE = "https://www.googleapis.com/auth/business.manage";

export const getGmbRedirectUri = () =>
  `${window.location.origin}/auth/gmb/callback`;

export const buildGmbAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getGmbRedirectUri(),
    response_type: "code",
    scope: GMB_SCOPE,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export type GmbAccount = { name: string; accountName?: string };
export type GmbLocation = {
  name: string; // "accounts/{accountId}/locations/{locationId}"
  locationName?: string;
  title?: string;
  storefrontAddress?: { addressLines?: string[]; locality?: string; administrativeArea?: string };
  address?: { addressLines?: string[]; locality?: string; administrativeArea?: string };
};

export type ExchangeGmbTokenResponse = {
  accounts: GmbAccount[];
  locations: GmbLocation[];
  access_token: string;
  refresh_token: string;
  expires_in: number;
  account_id: string;
};

/** Stash the OAuth result in sessionStorage so onboarding can pick it up after redirect. */
export const GMB_PENDING_KEY = "gmb_pending_oauth";
