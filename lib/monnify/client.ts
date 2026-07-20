// Monnify API client. Endpoint paths/fields verified against Monnify's own
// Confluence docs (teamapt.atlassian.net/wiki/spaces/MON) as of 2026-07-20.
// Double-check against https://developers.monnify.com/api before demo day —
// Monnify has been known to tweak field names between doc revisions.

const BASE_URL = process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com";
const API_KEY = process.env.MONNIFY_API_KEY;
const SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
export const CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const WALLET_ID = process.env.MONNIFY_WALLET_ID;

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }
  if (!API_KEY || !SECRET_KEY) {
    throw new Error("MONNIFY_API_KEY / MONNIFY_SECRET_KEY are not set (see .env.local.example)");
  }
  const basic = Buffer.from(`${API_KEY}:${SECRET_KEY}`).toString("base64");
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  const json = await res.json();
  if (!res.ok || !json.requestSuccessful) {
    throw new Error(`Monnify auth failed: ${json.responseMessage ?? res.statusText}`);
  }
  const { accessToken, expiresIn } = json.responseBody;
  cachedToken = { accessToken, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
  return accessToken;
}

async function monnifyFetch(path: string, options: { method?: string; body?: unknown; auth?: "bearer" | "basic" } = {}) {
  const { method = "GET", body, auth = "bearer" } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth === "bearer") {
    headers.Authorization = `Bearer ${await getAccessToken()}`;
  } else {
    if (!API_KEY || !SECRET_KEY) throw new Error("Monnify API credentials not set");
    headers.Authorization = `Basic ${Buffer.from(`${API_KEY}:${SECRET_KEY}`).toString("base64")}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.requestSuccessful === false) {
    throw new Error(`Monnify ${method} ${path} failed: ${json.responseMessage ?? res.statusText}`);
  }
  return json.responseBody;
}

// -- The six operations, matching the MCP tools in lib/monnify/tools.ts --

export function createInvoice(input: {
  amount: number;
  invoiceReference: string;
  description: string;
  customerEmail: string;
  customerName: string;
  expiryDate: string; // "yyyy-MM-dd HH:mm:ss"
  currencyCode?: string;
  redirectUrl?: string;
}) {
  return monnifyFetch("/api/v1/invoice/create", {
    method: "POST",
    body: { currencyCode: "NGN", contractCode: CONTRACT_CODE, ...input },
  });
}

export function createReservedAccount(input: {
  accountReference: string;
  accountName: string;
  customerEmail: string;
  customerName?: string;
  bvn?: string;
  getAllAvailableBanks?: boolean;
}) {
  return monnifyFetch("/api/v2/bank-transfer/reserved-accounts", {
    method: "POST",
    body: { currencyCode: "NGN", contractCode: CONTRACT_CODE, getAllAvailableBanks: true, ...input },
  });
}

export function verifyTransaction(input: { transactionReference: string }) {
  return monnifyFetch(`/api/v2/transactions/${encodeURIComponent(input.transactionReference)}`);
}

export function getWalletBalance(input: { walletId?: string } = {}) {
  const walletId = input.walletId ?? WALLET_ID;
  if (!walletId) throw new Error("No walletId provided and MONNIFY_WALLET_ID is not set");
  return monnifyFetch(`/api/v1/disbursements/wallet-balance?walletId=${encodeURIComponent(walletId)}`, { auth: "basic" });
}

export function initiateRefund(input: {
  transactionReference: string;
  refundReference: string;
  refundAmount: number;
  refundReason: string;
}) {
  return monnifyFetch("/api/v1/refunds/initiate-refund", { method: "POST", body: input });
}

export function listTransactions(input: { paymentReference?: string; page?: number; size?: number } = {}) {
  const params = new URLSearchParams();
  if (input.paymentReference) params.set("paymentReference", input.paymentReference);
  params.set("page", String(input.page ?? 0));
  params.set("size", String(input.size ?? 10));
  return monnifyFetch(`/api/v1/transactions/search?${params.toString()}`);
}
