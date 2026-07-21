import { cookies } from "next/headers";

// Silent identity, no signup: the first time a seller creates a FlowPay
// page, they get a random token in a browser cookie. That token is what
// ties a "connected system" (lib/seller/store.ts) back to their sales.

const COOKIE_NAME = "wire_seller_token";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function randomToken(len = 16): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, len);
}

export async function getSellerToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

/** Only callable from a Route Handler / Server Action (needs to set a cookie). */
export async function getOrCreateSellerToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const token = randomToken();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return token;
}
