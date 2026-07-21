import { Redis } from "@upstash/redis";

// Ties a WhatsApp sender's phone number to a Wire identity — the WhatsApp
// equivalent of lib/store/seller.ts's cookie token. A phone number is used
// directly as the Flow "sellerId" (see lib/store/flow.ts's sellerId field
// and getFlowsBySeller), so a WhatsApp-created Flow needs no account at all
// by default. userId is only set once the sender links to an existing web
// account (see the "link this number to <email>" command in the webhook
// route) — same no-password trust model the browser's sellerId cookie
// already uses, just asserted over a chat message instead of a cookie.

const redis = Redis.fromEnv();

export type WhatsAppLinkRecord = {
  phone: string;
  userId?: string;
  firstSeenAt: string;
  linkedAt?: string;
};

function key(phone: string): string {
  return `wa-link:${phone}`;
}

export async function getWhatsAppLink(phone: string): Promise<WhatsAppLinkRecord | null> {
  return (await redis.get<WhatsAppLinkRecord>(key(phone))) ?? null;
}

/** First-contact bookkeeping — cheap no-op on every message after the first. */
export async function touchWhatsAppLink(phone: string): Promise<WhatsAppLinkRecord> {
  const existing = await getWhatsAppLink(phone);
  if (existing) return existing;
  const record: WhatsAppLinkRecord = { phone, firstSeenAt: new Date().toISOString() };
  await redis.set(key(phone), record);
  return record;
}

export async function linkWhatsAppToUser(phone: string, userId: string): Promise<WhatsAppLinkRecord> {
  const record: WhatsAppLinkRecord = {
    ...(await touchWhatsAppLink(phone)),
    userId,
    linkedAt: new Date().toISOString(),
  };
  await redis.set(key(phone), record);
  return record;
}

/** Meta retries webhook delivery on timeout/non-2xx, same as Monnify — this
 * is how the route below avoids running the agent (and sending a duplicate
 * reply) twice for the same inbound message id. */
export async function markMessageProcessed(messageId: string): Promise<boolean> {
  const result = await redis.set(`wa-msg:${messageId}`, "1", { nx: true, ex: 60 * 60 * 24 });
  return result === "OK";
}
