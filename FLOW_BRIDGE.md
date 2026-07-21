# Flow bridge — connect your own systems

## What this is

Today, when someone pays through a Flow page, Monnify moves the money and
the Wire dashboard updates. Nothing else does. If a seller tracks stock in a
spreadsheet or logs sales for their books, they still do that by hand.

This adds one optional step: a seller connects another system they already
use (inventory, bookkeeping, whatever), and after that, every confirmed sale
automatically updates it too — no manual step, no new payment processor,
Monnify still moves 100% of the money exactly as it does now.

This is *not* "let sellers use their own payment processor instead of
Monnify." That was an earlier, wrong version of this idea. Monnify stays the
only thing that touches money. This is only about what happens *after* a
payment is confirmed.

## The flow

1. **Silent identity, no signup.** The first time someone creates a Flow
   page, they get a random token stored in a browser cookie. No email, no
   password, no new friction on the existing `/sell` flow. This token is
   their seller ID going forward.

2. **An optional "connect your system" step.** Reuses the *existing*
   paste-a-curl-or-OpenAPI-spec flow already built for the developer gateway
   — same UI pattern, same `/api/gateway` endpoint underneath — just saved
   against the seller's token instead of being a one-off, throwaway gateway.

3. **The webhook gets one new branch.** `app/api/webhook/monnify/route.ts`
   already calls `recordSale()` when a payment succeeds. After that, it
   checks: does this sale's seller have a connected system? If yes, run one
   more agent turn — "a sale just happened: {title}, ₦{amount} — here are
   the tools available in the seller's system, take whatever action makes
   sense, or do nothing if nothing fits" — using the seller's own connected
   tools instead of Monnify's.

4. **A visible trail.** Not invisible magic. The dashboard shows a small
   line after a sale — "Wire updated your stock count" — so it's something
   a seller can verify happened, not something they have to blindly trust.

## Decisions already made (so this doesn't need re-litigating)

- **Identity: cookie-based token, not full accounts.** Deliberately low
  friction. Can become real auth later; not blocking this.
- **The agent prompt must be generic, not Monnify-shaped.** It can't assume
  what tools a seller's system exposes — could be `decrement_stock`, could
  be `log_expense`, could be nothing relevant. It has to be told explicitly
  that doing nothing is an acceptable outcome, so it doesn't hallucinate a
  tool call that isn't there.
- **Reuses existing infrastructure wherever possible.** The gateway
  generation flow, the `runAgent` tool-use loop, the Redis-backed stores —
  nothing about this needs new architecture, just new wiring between pieces
  that already exist.

## What's new vs. what touches existing files

**New files — zero collision risk, buildable independently of anything else
in flight:**
- Seller identity: issuing/reading the cookie token, and a Redis-backed
  record tying a token to a connected `gatewayId` (same shape as
  `lib/gateway/registry.ts`, just a new key namespace like `seller:{token}`)
- "Connect your system" UI — a thin wrapper around the existing paste-API
  component, saving against the seller token
- The "run seller's tools on a sale" function — a new function that calls
  the existing `runAgent`, just with a different system prompt and tool
  list than Flow creation uses

**Existing files — the one real integration point:**
- `app/api/webhook/monnify/route.ts` needs one additional call after
  `recordSale()` succeeds: look up the seller's connected gateway (if any),
  and call the new function above. A few lines, not a rewrite — but this is
  the file most likely to be mid-edit by whoever's actively working on
  webhook/payment logic, so it should land as a small, precise diff, not a
  drive-by rewrite of the file.
- `FlowRecord` type (`lib/store/flow.ts`) needs one new optional
  field — something like `sellerId?: string` — so a sale can be traced back
  to whether its seller has a connected system.

## Estimate

Roughly 2–4 hours of focused work if nothing blocks it — the new-file pieces
are close to mechanical (reusing what's already built), the webhook
integration is small, and the part that actually takes real time is
iterating on the agent prompt against a couple of real test APIs until it
behaves reliably (doesn't hallucinate calls, handles "nothing to do"
gracefully).

## Open items before starting

- Confirm the Gemini API quota is actually usable again — this needs live
  test calls to tune the prompt, and burning a freshly-fixed budget on that
  would be a bad way to find out it isn't fixed yet.
- Pick 1–2 real example "seller systems" to test against, if there's a
  specific one worth prioritizing (otherwise generic test APIs will be
  used).


im using openai now so ignore any gemini shit