import { promises as fs } from "fs";
import path from "path";

// Deliberately a flat JSON file, not a database: this only needs to survive
// a single demo session on one running server. If you deploy to Vercel's
// serverless functions (cold, ephemeral filesystem per invocation) swap this
// for Vercel KV / Upstash Redis — same read/write shape, five-minute change.

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "flowpay-store.json");

export type FlowPayRecord = {
  slug: string;
  title: string;
  priceNaira: number;
  ticketCap: number;
  ticketsSold: number;
  revenueNaira: number;
  accountReference: string;
  accountNumber?: string;
  bankName?: string;
  checkoutUrl?: string;
  createdAt: string;
  /** Monnify transactionReferences already applied — Monnify retries webhook
   * delivery, so this is how recordSale avoids double-counting a retry. */
  processedTransactionRefs?: string[];
};

async function readAll(): Promise<Record<string, FlowPayRecord>> {
  try {
    const raw = await fs.readFile(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, FlowPayRecord>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

export async function saveFlowPay(record: FlowPayRecord) {
  const all = await readAll();
  all[record.slug] = record;
  await writeAll(all);
  return record;
}

export async function getFlowPay(slug: string) {
  const all = await readAll();
  return all[slug] ?? null;
}

export async function recordSale(slug: string, amountNaira: number, transactionReference: string) {
  const all = await readAll();
  const record = all[slug];
  if (!record) return null;

  record.processedTransactionRefs ??= [];
  if (record.processedTransactionRefs.includes(transactionReference)) {
    return record; // Already applied — Monnify retried this notification.
  }

  record.processedTransactionRefs.push(transactionReference);
  record.ticketsSold += 1;
  record.revenueNaira += amountNaira;
  await writeAll(all);
  return record;
}
