// Monnify API client. getWalletBalance verified directly against
// developers.monnify.com (GET /api/v2/disbursements/wallet-balance,
// ?accountNumber=, Bearer auth) as of 2026-07-21 — a prior version of this
// file had it as v1 with ?walletId= and Basic auth, which 404s. The other
// five operations are still unverified against live docs; double-check
// before demo day.

const BASE_URL = process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com";
const API_KEY = process.env.MONNIFY_API_KEY;
const SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
export const CONTRACT_CODE = process.env.MONNIFY_CONTRACT_CODE;
const WALLET_ACCOUNT_NUMBER = process.env.MONNIFY_WALLET_ACCOUNT_NUMBER;

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

export type IncomeSplitEntry = { subAccountCode: string; splitPercentage: number };

export function createInvoice(input: {
  amount: number;
  invoiceReference: string;
  description: string;
  customerEmail: string;
  customerName: string;
  expiryDate: string; // "yyyy-MM-dd HH:mm:ss"
  currencyCode?: string;
  redirectUrl?: string;
  incomeSplitConfig?: IncomeSplitEntry[];
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
  incomeSplitConfig?: IncomeSplitEntry[];
}) {
  return monnifyFetch("/api/v2/bank-transfer/reserved-accounts", {
    method: "POST",
    body: { currencyCode: "NGN", contractCode: CONTRACT_CODE, getAllAvailableBanks: true, ...input },
  });
}

// Sub-accounts + bank list verified live against the real sandbox account
// (2026-07-21): GET /api/v1/sub-accounts and GET /api/v1/banks both returned
// real data rather than a "feature not enabled" error, confirming
// transaction splitting is already active here — Monnify's docs say this
// normally needs explicit activation per account, so don't assume it's on
// elsewhere. The incomeSplitConfig field on createInvoice/createReservedAccount
// above is NOT independently verified against a real split payout — only
// sub-account creation/listing were tested live.
export function createSubAccount(input: {
  bankCode: string;
  accountNumber: string;
  email: string;
  defaultSplitPercentage: number;
  currencyCode?: string;
}): Promise<Array<{ subAccountCode: string; accountName?: string; bankName?: string }>> {
  return monnifyFetch("/api/v1/sub-accounts", {
    method: "POST",
    body: [{ currencyCode: "NGN", ...input }],
  });
}

export function listBanks(): Promise<Array<{ name: string; code: string }>> {
  return monnifyFetch("/api/v1/banks");
}

export function verifyTransaction(input: { transactionReference: string }) {
  return monnifyFetch(`/api/v2/transactions/${encodeURIComponent(input.transactionReference)}`);
}

// Recurring billing (card tokenization): NOT independently verified live —
// doing so requires a real card payment, which wasn't available to test in
// this session. Endpoint path and body fields are copied from Monnify's docs
// (developers.monnify.com/docs/collections/recurring-payments/card-tokenization).
// The flow: a customer pays once by card via createInvoice, the webhook
// re-queries that transaction with verifyTransaction to pull a cardToken out
// of the response, and this function charges that token on a schedule with
// no customer interaction. Confirm the cardToken field name in a real
// verifyTransaction response before relying on this in production.
export function chargeCardToken(input: {
  cardToken: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  currencyCode?: string;
}) {
  return monnifyFetch("/api/v1/merchant/cards/charge-card-token", {
    method: "POST",
    body: { currencyCode: "NGN", contractCode: CONTRACT_CODE, apiKey: API_KEY, ...input },
  });
}

export function getWalletBalance(input: { accountNumber?: string } = {}) {
  const accountNumber = input.accountNumber ?? WALLET_ACCOUNT_NUMBER;
  if (!accountNumber) throw new Error("No accountNumber provided and MONNIFY_WALLET_ACCOUNT_NUMBER is not set");
  return monnifyFetch(`/api/v2/disbursements/wallet-balance?accountNumber=${encodeURIComponent(accountNumber)}`);
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
