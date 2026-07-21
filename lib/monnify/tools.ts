import { z } from "zod";
import * as monnify from "./client";
import type { GatewayTool } from "../gateway/types";

// Single source of truth for "Monnify as MCP tools". Both the real MCP server
// (lib/mcp/server.ts, for Claude Desktop / Cursor) and the in-app Playground /
// Flow orchestrator (which talk to OpenAI directly) register tools from
// this list, so there's exactly one place that defines what an agent can do.

export const monnifyTools = [
  {
    name: "create_invoice",
    description:
      "Create a Monnify invoice for a customer. Returns a checkoutUrl (card payment) and a virtual accountNumber/bankName (bank transfer).",
    schema: {
      amount: z.number().positive().describe("Amount to charge, in NGN"),
      invoiceReference: z.string().describe("Unique reference you generate for this invoice"),
      description: z.string().describe("What the customer is paying for"),
      customerEmail: z.string().email(),
      customerName: z.string(),
      expiryDate: z.string().describe('Format: "yyyy-MM-dd HH:mm:ss"'),
    },
    handler: monnify.createInvoice,
  },
  {
    name: "create_reserved_account",
    description:
      "Reserve a permanent virtual bank account for a customer. Anything paid into it is attributed to that customer automatically.",
    schema: {
      accountReference: z.string().describe("Unique reference you generate for this account"),
      accountName: z.string().describe("Name shown to the payer"),
      customerEmail: z.string().email(),
      customerName: z.string().optional(),
    },
    handler: monnify.createReservedAccount,
  },
  {
    name: "verify_transaction",
    description: "Look up the status of a transaction by its transactionReference.",
    schema: {
      transactionReference: z.string(),
    },
    handler: monnify.verifyTransaction,
  },
  {
    name: "get_wallet_balance",
    description: "Get the available balance of the merchant's Monnify wallet.",
    schema: {
      accountNumber: z.string().optional().describe("Defaults to MONNIFY_WALLET_ACCOUNT_NUMBER if omitted"),
    },
    handler: monnify.getWalletBalance,
  },
  {
    name: "initiate_refund",
    description: "Refund all or part of a transaction back to the customer.",
    schema: {
      transactionReference: z.string(),
      refundReference: z.string().describe("Unique reference you generate for this refund"),
      refundAmount: z.number().positive(),
      refundReason: z.string(),
    },
    handler: monnify.initiateRefund,
  },
  {
    name: "list_transactions",
    description: "Search/list transactions, optionally filtered by paymentReference.",
    schema: {
      paymentReference: z.string().optional(),
      page: z.number().int().min(0).optional(),
      size: z.number().int().min(1).max(50).optional(),
    },
    handler: monnify.listTransactions,
  },
] as const;

export type MonnifyToolName = (typeof monnifyTools)[number]["name"];

// The same six tools, widened to the generic shape lib/mcp/server.ts and
// lib/openai/agent.ts consume — every consumer of "an agent's tool list"
// takes GatewayTool[], whether the tools came from here or from a pasted API.
export const monnifyGatewayTools = monnifyTools as unknown as GatewayTool[];
