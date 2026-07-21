import { Redis } from "@upstash/redis";

// A seller's Monnify sub-account — created once via /api/payout, then
// referenced (not recreated) on every future sale so their cut routes
// straight to their own bank account via Monnify's transaction-splitting,
// instead of pooling in the platform's own wallet with no payout step.

const redis = Redis.fromEnv();

export type PayoutAccount = {
  subAccountCode: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  splitPercentage: number;
  createdAt: string;
};

function key(userId: string): string {
  return `payout:${userId}`;
}

export async function savePayoutAccount(userId: string, account: PayoutAccount) {
  await redis.set(key(userId), account);
  return account;
}

export async function getPayoutAccount(userId: string): Promise<PayoutAccount | null> {
  return (await redis.get<PayoutAccount>(key(userId))) ?? null;
}
