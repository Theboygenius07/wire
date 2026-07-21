"use client";

// Silent seller identity: a random token in a long-lived cookie, set the
// first time someone visits /connect. No signup, no password — just enough
// to tie "this browser" to a connected gateway across visits.

const COOKIE_NAME = "wire_seller_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function getOrCreateSellerId(): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);

  const id = crypto.randomUUID();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
  return id;
}
