import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import type { User } from "./users";

const redis = Redis.fromEnv();
const COOKIE_NAME = "wire_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type Session = { userId: string; email: string };

function key(token: string): string {
  return `session:${token}`;
}

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Creates a session and sets the cookie — only callable from a Route Handler. */
export async function startSession(user: User): Promise<void> {
  const token = randomToken();
  await redis.set(key(token), { userId: user.id, email: user.email } as Session, { ex: SESSION_TTL_SECONDS });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

/** Deletes the session and clears the cookie — only callable from a Route Handler. */
export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await redis.del(key(token));
  store.delete(COOKIE_NAME);
}

export async function getCurrentSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return (await redis.get<Session>(key(token))) ?? null;
}
