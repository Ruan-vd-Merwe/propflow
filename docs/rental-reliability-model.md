# PropTrust Tenant Verification and Rental Reliability Model

Status: prototype design, not production legal advice.

## 1. Product Flow Summary

PropTrust should run tenant verification as a tenant-consented, purpose-limited workflow for a specific rental application.

1. Tenant signs up or accepts a landlord invitation for a specific property.
2. Tenant sees the requested checks, recipients, purpose, data sources, retention window, and landlord-visible output.
3. Tenant gives granular consent for identity, rental evidence, income/affordability, references, and optional bureau checks.
4. Tenant uploads lease, payslips or bank statements, proof of rent payments, ID, and optional landlord/reference details.
5. PropTrust verifies evidence, optionally requests a bureau check, and stores consent/source/audit metadata.
6. PropTrust generates a Rental Reliability Score and plain-language explanation.
7. Tenant reviews the result before sharing and can add explanations or challenge negative factors.
8. Landlord sees a minimised trust summary: score band, confidence, verification badges, warning categories, and request-more-info actions.
9. Tenant improves the profile over time by adding recent rent proof, refreshed income evidence, references, and dispute outcomes.

### Scenario Flows

**New tenant with no rental history**

- Start with identity, income, documents, employment stability, and optional bureau check.
- Cap confidence at Low/Medium until rent evidence or references are added.
- Do not penalise for being a first-time renter; suggest guarantor/co-applicant/reference routes where appropriate.

**Tenant with 3 months proof of payment**

- Three verified on-time rent payments strongly lift the rental payment component.
- Bureau dependency reduces and missing/thin bureau data should not dominate.
- Landlord sees "3+ verified on-time rent payments" and payment confidence.

**Bad credit but good rent history**

- Minor telecom, student, old, settled, or disputed bureau items are treated differently from judgments or recent defaults.
- Recent rent behaviour can outweigh old non-rental credit issues.
- Tenant sees the negative factor and can explain or challenge it; landlord sees a category-level flag only if needed.

**Thin/no credit file**

- Bureau component becomes neutral/moderate, not a rejection.
- Rely on verified income, rent payment evidence, lease documents, and references.
- Landlord wording: "Verified by alternative evidence" instead of "poor credit".

**Serious adverse credit events**

- Recent judgments, fraud flags, debt review, repeated missed payments, or recent defaults trigger review.
- The model should not auto-decline; it should produce "review recommended" with human review and tenant representation.
- Landlord sees "adverse event review recommended", not raw creditor/account details.

## 2. Data Schema

| Table | Key fields | Privacy notes | Retention rule |
| --- | --- | --- | --- |
| `tenant_profiles` | `id uuid`, `user_id uuid`, `legal_name text`, `id_number_hash text`, `date_of_birth encrypted date`, `phone text`, `email text`, `current_address encrypted jsonb`, `created_at`, `updated_at` | Keep identity and contact PII separate from scoring output. Hash ID for matching; encrypt DOB/address. | Active account life; delete/de-identify after closure unless legal hold. |
| `consent_records` | `id uuid`, `tenant_id uuid`, `purpose text`, `scope jsonb`, `recipient_type text`, `recipient_id uuid`, `provider text`, `status enum`, `consent_text_version text`, `granted_at`, `expires_at`, `revoked_at`, `ip_hash`, `user_agent_hash` | Immutable audit record proving voluntary, specific, informed consent. | Keep longer for audit, e.g. 5-7 years subject to counsel. |
| `verification_documents` | `id uuid`, `tenant_id uuid`, `document_type enum`, `storage_uri encrypted text`, `file_hash text`, `verification_status enum`, `confidence enum`, `source text`, `verified_at`, `expires_at`, `extracted_summary jsonb` | Private storage, short-lived URLs, no public buckets. Store extracted minimum, not full raw content in scoring records. | Delete raw docs after verification/challenge window where lawful, e.g. 30-180 days. |
| `bureau_check_requests` | `id uuid`, `tenant_id uuid`, `consent_record_id uuid`, `provider enum`, `request_type text`, `status enum`, `provider_request_id encrypted text`, `requested_at`, `completed_at`, `failure_reason text` | No request without consent. Avoid logging raw payloads. | Audit retention aligned to NCA/POPIA/legal advice. |
| `bureau_check_results` | `id uuid`, `request_id uuid`, `tenant_id uuid`, `provider enum`, `result_status enum`, `score_band enum`, `thin_file boolean`, `derived_risk_signals jsonb`, `raw_report_uri encrypted nullable`, `received_at`, `expires_at` | Prefer derived signals. Raw bureau data restricted to staff/legal workflow, not landlords. | Raw payload shortest feasible; derived decision signals retained for challenge/audit. |
| `rental_payment_evidence` | `id uuid`, `tenant_id uuid`, `lease_id uuid`, `month date`, `amount_due numeric`, `amount_paid numeric`, `paid_at date`, `status enum`, `days_late int`, `source_type enum`, `confidence enum`, `evidence_uri encrypted text`, `verified_at` | Store matched rent evidence, not full bank transaction history. | Keep scored payment evidence while useful; purge raw statements early. |
| `landlord_references` | `id uuid`, `tenant_id uuid`, `reference_name text`, `reference_contact encrypted text`, `lease_period daterange`, `verified_channel enum`, `would_rent_again boolean`, `payment_rating enum`, `property_care_rating enum`, `notes_redacted text`, `received_at` | Redact irrelevant or sensitive free text. Track source quality. | Retain structured reference 2-5 years; delete free text sooner if possible. |
| `rental_reliability_scores` | `id uuid`, `tenant_id uuid`, `score_version text`, `score int`, `band enum`, `confidence enum`, `input_snapshot_hash text`, `computed_at`, `expires_at` | Reproducible score metadata without raw inputs. | Expire active use after 30-90 days; retain audit copy per policy. |
| `score_explanations` | `id uuid`, `score_id uuid`, `summary text`, `positive_factors jsonb`, `negative_factors jsonb`, `missing_factors jsonb`, `tenant_actions jsonb`, `landlord_summary jsonb` | Tenant-facing explanation richer than landlord summary. | Retain with score for dispute/audit period. |
| `tenant_disputes_or_explanations` | `id uuid`, `tenant_id uuid`, `related_entity_type enum`, `related_entity_id uuid`, `type enum`, `status enum`, `tenant_statement text`, `supporting_document_ids uuid[]`, `resolution_notes text`, `submitted_at`, `resolved_at` | Tenant-controlled context. Share only what tenant authorises or law permits. | Retain through dispute/legal period; redact/de-identify after. |

## 3. Scoring Model V1

Score is out of 100 and explicitly separates rental reliability from general credit risk.

| Component | Weight |
| --- | ---: |
| Verified rental payment history | 35 |
| Affordability/income stability | 20 |
| Bureau credit behaviour | 15 |
| Adverse legal/default events | 10 |
| Document confidence | 10 |
| Landlord/reference confidence | 5 |
| Profile completeness | 5 |

Rules:

- Three verified on-time rental payments add a strong positive lift.
- Recent rental behaviour is more important than old non-rental credit issues.
- Thin/no credit file is neutral/moderate, not a fail.
- Minor, old, small, settled, or disputed telecom/student/default items receive light treatment.
- Recent defaults, judgments, debt review, fraud flags, and repeated missed payments trigger review.
- Disputed bureau items are down-weighted until resolved and shown as tenant-action items.
- Confidence is Low, Medium, or High based on source count, source quality, and recency.

Example output:

> Score: 78/100. High rental reliability. Tenant has 3 verified on-time rent payments, stable income, and one old minor telecom default. No recent adverse rental behaviour detected.

Prototype implementation:

- Scoring function: `src/lib/rental-reliability.ts`
- Tests: `src/__tests__/rental-reliability.test.ts`
- UI prototype: `/tenant-verification`

## 4. Compliance Risk Notes

Not legal advice. South African counsel must review the final production flow.

Consent is required before:

- Any TPN, TransUnion, Experian, XDS, or aggregator bureau request.
- Uploading, analysing, or sharing income documents, bank statements, lease documents, rent proof, or ID documents.
- Contacting landlords, employers, agents, or references.
- Sharing a landlord-facing trust summary.
- Reusing data for another property, analytics beyond operational necessity, model training, or recurring checks.

Do not show landlords:

- Raw bureau reports, creditor names, tradelines, account numbers, full judgments/default details, debt review details, ID numbers, bank statements, full payslips, raw references, internal fraud rules, or protected/sensitive personal information.

Must be auditable:

- Consent wording/version, timestamp, tenant, purpose, provider, recipient, expiry, withdrawal.
- Provider calls, source data received, transformations, score versions, landlord views, and decisions.
- Tenant access, explanation, challenge, correction, withdrawal, deletion, and complaint events.

Tenant rights and challenge flow:

- Tenant can view data categories, sources, score factors, recipients, retention, and landlord-visible preview.
- Tenant can add explanations, upload supporting evidence, and challenge inaccurate/outdated/excessive data.
- Bureau-derived disputes should link to the relevant bureau process and suppress/down-weight unresolved disputed items where appropriate.
- Any automated result with material effect needs a representation/human-review route.

## 5. Bureau Integration Plan

Public pages confirm broad business credit/risk offerings, but API, sandbox, and pricing details generally require vendor onboarding. Treat all non-public details as assumptions until vendor contracts are reviewed.

| Option | Likely requirements | Data returned | Rental history? | Sandbox/cost | Complexity |
| --- | --- | --- | --- | --- | --- |
| TPN | Business account, NCA/POPIA purpose, explicit tenant consent, property-sector product access. | Tenant/rental-focused risk indicators, payment profile, default/legal markers depending on product. | Likely strongest fit because TPN is rental-sector focused. Confirm exact API fields. | Vendor-confirm; likely per-check or subscription pricing. | Medium. Best first target if API access is available. |
| TransUnion SA | Business onboarding, permissible purpose, consent records, secure integration. | Consumer profile, identity/fraud/risk products, credit/risk reporting, possible score/bands. | General credit bureau; rental-specific history not assumed. | Vendor-confirm; public site lists business products and portals. | Medium-high due to compliance and data minimisation. |
| Experian SA | Business onboarding, permissible purpose, consent and security review. | Credit/risk/identity-derived indicators depending on contracted product. | General credit data; rental-specific history not assumed. | Vendor-confirm. | Medium-high. |
| XDS | Business onboarding with XDS/Mettus, consent/purpose validation, API or batch terms. | Credit information, analytics, customer lifecycle/risk solutions. | General credit bureau; rental-specific history not assumed. | Vendor-confirm. | Medium. |
| Aggregator | Contract with verification/KYC/credit aggregator, map consent to each downstream provider. | Normalised credit/identity/income signals. | Only if aggregator includes TPN/rental datasets. | Often faster sandbox; higher per-check margin. | Low-medium initially, higher vendor-lock-in risk. |

Implementation steps:

1. Build a provider-neutral `BureauProvider` interface returning minimised derived signals.
2. Store `bureau_check_requests` and `consent_records` before any external call.
3. Never send bureau requests if consent is missing, expired, revoked, or wrong-purpose.
4. Convert raw responses to `score_band`, `thin_file`, `adverse_event_flags`, `minor_credit_items`, and `disputed_items`.
5. Encrypt or avoid raw payload storage; expose only tenant-safe explanations and landlord-safe summaries.
6. Add vendor contract checks for retention, cross-border processing, breach notices, subprocessors, and dispute workflows.

## 6. UX Screen Plan

Tenant screens:

- Build your rental trust profile: verification progress, score, confidence, and next best actions.
- Consent screen: granular checkboxes, purpose, data sources, providers, expiry, withdrawal, and landlord-visible preview.
- Upload proof of rent payments: lease/month/amount mapping and confidence status.
- Connect bureau check: optional, consent-led, with explanation that it is not pass/fail.
- View score explanation: component breakdown and reason categories.
- Explain negative credit item: structured reason, supporting documents, dispute status.
- Improve score checklist: add three months rent proof, verify income, request reference, resolve dispute.

Landlord screens:

- Applicant card: score band, confidence, expiry, and verification status.
- Trust summary: payment confidence, affordability confidence, verification badges.
- Warning flags: category-level only, e.g. "affordability pressure" or "adverse event review".
- Request more info: routed to tenant with fresh consent if needed.
- Decision capture: structured reason for audit and tenant transparency.

## 7. Prototype Implementation

The prototype intentionally does not connect to real bureaus.

- Mock bureau responses are represented in `mockRentalReliabilityProfiles`.
- Mock rent evidence includes verified on-time, inconsistent, partial, and missing cases.
- Mock consent capture appears on `/tenant-verification`.
- Score calculation and explanation generation are pure TypeScript functions.
- Landlord UI uses `landlordSummary`, which hides raw sensitive credit data.

## 8. Test Cases

Covered in Vitest:

- Bad credit but 3 months perfect rent.
- No credit history but strong income and proof of rent.
- Good credit but no affordability.
- Recent judgment/default.
- Disputed bureau item.
- Missing documents.
- Inconsistent proof of payment.

## 9. Legal/Compliance Confirmation Needed

- Whether PropTrust, landlords, and vendors are responsible parties/operators/joint responsible parties at each stage.
- Exact NCA permissible-purpose and consent wording for tenant bureau checks.
- Whether the Rental Reliability Score is regulated as creditworthiness profiling or automated decision-making.
- Required adverse-decision notices and whether PropTrust or landlords issue them.
- Whether rental payment reporting back to bureaus is planned and what NCA duties it creates.
- Whether fraud, criminal, eviction, or public-record signals need additional safeguards or prior authorisation.
- Cross-border transfer posture for cloud hosting, analytics, support tooling, and bureau vendors.
- Production retention periods for raw bureau data, bank statements, income documents, audit logs, and disputes.
- Anti-discrimination review to ensure protected characteristics and proxies are excluded.

## Source Notes

- South African Government POPIA page describes POPIA's purpose, minimum processing requirements, Information Regulator role, rights around automated decision-making, and cross-border flow regulation: https://www.gov.za/documents/protection-personal-information-act
- TransUnion South Africa public business page lists credit/risk reporting, consumer profile, identity proofing, TruValidate, income estimator, and business portals/products: https://www.transunion.co.za/business
- XDS public site describes XDS as a South African credit information bureau with customer lifecycle, credit lifecycle, analytics, and customer solutions: https://www.xds.co.za/
