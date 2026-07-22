# PropTrust, PayProp, and Xpello: Strategic Positioning

Status: strategy and prototype concept, not a build spec. Nothing described here
connects to a real PayProp, bureau, or Xpello system.

This document sits alongside the existing tenant verification work and does not
replace it. The scoring model, mock data, and tests remain as implemented in
`src/lib/rental-reliability.ts`, `docs/rental-reliability-model.md`, and
`src/__tests__/rental-reliability.test.ts`. This document adds the surrounding
product narrative: how Rental Reliability, PayProp, and Xpello fit together
across the life of a tenancy.

## 1. The one-sentence positioning

PayProp manages a rental once it exists. PropTrust helps create a rental worth
managing, and stays involved as the tenant's trust profile improves over time.

PropTrust is not a payments and reconciliation platform, and it should not try
to become one first. It is the trust, verification, matching, and reputation
layer that sits before, alongside, and slightly ahead of the back-office tools
landlords already use.

## 2. Why PropTrust should not build payments/accounting first

- Payment collection, trust accounting, and reconciliation are a deep,
  regulated, and already well-served category in South Africa. PayProp is an
  established incumbent there.
- Competing head-on would mean rebuilding commodity infrastructure instead of
  building the differentiated thing PropTrust is actually good at: judging
  whether a tenant is trustworthy before money changes hands, and explaining
  that judgment in plain language.
- Every hour spent on ledger/reconciliation parity is an hour not spent on
  verification depth, TrustScore quality, or legal confidence, which are the
  parts of the journey PayProp does not cover today.
- A narrower, clearer product (trust and verification) is also easier to
  explain to landlords and letting agents in one sentence than a general
  property management suite would be.

This is a sequencing argument, not a permanent restriction. Light payment
tracking already exists in PropTrust for landlord workflow reasons (see
`src/lib/risk.ts` and the payment reminder system). The point is that PropTrust
should not chase PayProp's core accounting/reconciliation depth as a strategic
goal.

## 3. Where PayProp fits in the future ecosystem

PayProp is a reference point, not a target to clone. In a future integrated
world, the two systems would cover different, complementary halves of the
tenancy:

| Stage | Owned by |
| --- | --- |
| Finding a tenant | PropTrust |
| Verifying identity and documents | PropTrust |
| Rental Reliability / TrustScore | PropTrust |
| Lease review and legal confidence | PropTrust, with Xpello |
| Rent collection and reconciliation | PayProp (future integration) |
| Arrears and trust accounting | PayProp (future integration) |
| Ongoing payment behaviour feeding TrustScore | PropTrust, informed by PayProp data |
| Escalation if a tenant stops paying | Xpello, informed by both |

The future integration is bidirectional, not PropTrust absorbing PayProp's
job:

1. A tenant builds a TrustScore on PropTrust before they ever sign a lease.
2. Once a tenancy starts and rent is collected through PayProp, PayProp's
   verified payment records could become one more evidence source feeding the
   existing rental payment component of the score (the `rental_payment_history`
   component already defined in `src/lib/rental-reliability.ts`, currently fed
   by bank statements, proof of payment, and landlord references).
3. PropTrust could export a lease, tenant profile, or verification pack to
   PayProp when a landlord who screened a tenant on PropTrust chooses to manage
   the tenancy on PayProp.

No API contract exists for this today. Everything in this document that
mentions PayProp is a concept, not an integration.

## 4. How verified payment history strengthens TrustScore

This is already the core idea behind the shipped Rental Reliability Score, and
this document does not change that model. It restates it in ecosystem terms:

- Verified rental payment history is the single largest weighted component
  (35 of 100 points) precisely because it is the most direct evidence of how a
  tenant behaves as a renter, ahead of a generic credit score.
- Three or more verified on-time rental payments measurably reduce how much
  the score depends on the bureau component (`scoreBureau` in
  `src/lib/rental-reliability.ts` already reduces bureau weight when strong
  rent evidence exists, even without a bureau check).
- An old, small, settled, or non-rental credit item (a telecom account, a
  student loan, a thin file) is treated as a minor, decaying signal rather than
  a disqualifier. A recent judgment, fraud flag, or repeated missed rental
  payment is treated as a serious signal that triggers human review instead of
  an automatic decision.
- In the future PayProp-integrated world, ongoing rent collected through
  PayProp would feed this same component over time, so a tenant's TrustScore
  keeps improving for as long as they keep paying reliably, not just at
  application time.

TrustScore, as used in the prototype ecosystem page, is the tenant-facing
product name for this same Rental Reliability Score. It is not a second
scoring model.

## 5. How Xpello supports legal confidence for both sides

Xpello's role does not change with this document; it is restated here to show
how it connects to the lifecycle:

- For landlords, Xpello backs the platform if a tenant stops paying or a
  dispute escalates, using the breach timeline and case pack already
  prototyped in `src/app/xpello/landlord`.
- For tenants, Xpello helps them understand a lease before signing, using the
  clause-by-clause review already prototyped in `src/app/xpello/tenant`, and
  reassures tenants that a harsh-sounding lease clause still has to operate
  within South African rental, eviction, consumer, privacy, and
  property-practitioner law.
- Xpello is never positioned as representing both sides of the same dispute.
  The existing conflict-check note in `TenantLeaseReviewConcept.tsx` already
  reflects this and should stay as-is.
- Approved wording only: "fixed monthly legal support, with legal escalation
  handled under the membership terms." Do not describe cover as unlimited, and
  do not promise specific outcomes, timelines, or that court can always be
  avoided, unless Xpello has approved that exact wording.

## 6. Benefit to landlords

- A trust summary that explains a tenant's rental reliability in plain
  language, instead of a raw bureau score that may not reflect how someone
  actually pays rent.
- Legal confidence that if a tenant does stop paying, there is a defined path
  to support through Xpello, without having to learn the legal process alone.
- A tenant who arrives at PayProp (if a future sync exists) with an
  established, improving trust history rather than a blank slate.

## 7. Benefit to tenants

- A fair hearing for tenants whose credit file is thin, old, or hurt by
  something unrelated to renting. Verified rent payments can outweigh that.
- A profile they build once and can reuse across applications, that keeps
  improving as they keep paying rent reliably, on PropTrust or, in future, via
  PayProp-collected rent.
- Plain-language legal support through Xpello so a lease clause that sounds
  intimidating can be checked against what South African law actually allows,
  before it becomes a dispute.

## 8. Staying unbiased between landlords and tenants

- The tenant always sees the full explanation of their score, including
  negative factors and an avenue to explain or dispute them
  (`negativeFactors`, `tenantActions` in `rental-reliability.ts`).
- The landlord only ever sees a minimised summary: score band, confidence,
  verification badges, and category-level warning flags, never raw bureau
  detail, consistent with `landlordSummary.sensitiveDataHidden`.
- Xpello engages on the side that requested it for a given matter and does
  not represent both parties in the same dispute.
- The ecosystem page and product cards describe capability for both landlords
  and tenants side by side rather than leading with either one.

## 9. What is mocked now vs what needs to be built later

Mocked / concept only, today:

- All PayProp references, fields, and the "Future PayProp Sync" card are
  entirely illustrative. There is no PayProp account, API access, or data
  contract in place.
- Bureau data, rental payment evidence, and tenant profiles remain the
  existing mocks in `src/lib/rental-reliability.ts`.
- The Xpello legal protection and lease review flows remain concept-stage
  (`src/app/xpello/landlord`, `src/app/xpello/tenant`), unchanged by this
  document.
- The `/rental-ecosystem` prototype page added alongside this document is a
  static, read-only lifecycle and card view. It has no forms, no writes, and
  no new database tables.

Needs real confirmation before any production build:

- Whether a PayProp partnership or API access is commercially and technically
  feasible, and under what data-sharing terms.
- Exact PayProp API scope, authentication model, rate limits, and which fields
  (if any) are exposed to third parties.
- Legal basis and consent wording for PropTrust to receive or export tenant
  payment history to or from a landlord's PayProp account.
- Xpello's approved product wording, pricing, and legal-service scope; nothing
  in this document should be read as final copy without Xpello sign-off.
- Whether syncing PayProp payment history into TrustScore changes PropTrust's
  role under POPIA (see the existing open questions in
  `docs/rental-reliability-model.md` section 9, which still apply).

## 10. Integration assumptions and open questions

Assumptions made for this concept, to be validated later:

- PayProp would be a data source and, later, an export destination, not a
  system PropTrust replaces or resells.
- Any future PayProp integration is opt-in per landlord and per tenant, not a
  default data flow.
- TrustScore stays the single tenant-facing score; PayProp payment data would
  strengthen the existing rental payment component rather than create a
  second, competing score.

Open questions:

- Does PayProp have a public or partner API today, and what would a
  partnership conversation require commercially?
- Would PayProp consider PropTrust a complementary front-of-funnel partner, or
  a competitor, given PropTrust's own light payment-tracking features?
- Who owns the tenant relationship if a landlord manages payments in PayProp
  but the tenant's trust profile lives in PropTrust: does the tenant see one
  combined view, or two separate ones?
- What is the minimum viable data PayProp would need to receive from
  PropTrust for an export flow to be useful to a landlord, without over
  sharing tenant data?
