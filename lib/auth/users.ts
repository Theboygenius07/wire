import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

function key(email: string): string {
  return `user:${email.toLowerCase()}`;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return (await redis.get<User>(key(email))) ?? null;
}

/** Returns null if the email is already taken (atomic — SET NX). */
export async function createUser(email: string, passwordHash: string): Promise<User | null> {
  const user: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  const result = await redis.set(key(email), user, { nx: true });
  return result === "OK" ? user : null;
}
