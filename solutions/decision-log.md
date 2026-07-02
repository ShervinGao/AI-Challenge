# Decision Log

> Required. Record semantic and contract decisions before modifying billing, usage, routing, failover, release, API, or customer-facing UI behavior.

## Business And Product Glossary

| Term | Meaning in this task | Source of truth | Must not be confused with |
|---|---|---|---|
| balance | A money balance means the customer's prepaid wallet balance. It is not visible in the inspected console contract except through the separate payable debit display. | Billing ledger / customer wallet record, not dashboard copy. | provider account balance / load-balancing weight / customer wallet label text |
| provider | Upstream AI provider or provider account used behind the workflow. Provider metadata, credentials, and balances are internal only. | Provider integration and secrets storage, outside the customer API DTO. | customer account / reviewed result / public dashboard label |
| load | Routing or load-balancing weight for traffic distribution. It is operational routing state, not a money value. | Release/routing configuration and rollout state. | customer balance / provider balance / official usage cost |
| account | Customer account means Acme Team; provider account means upstream vendor account; logged-in console user means the person using the console. | Customer account store for customer identity; provider credential store for upstream identity. | wallet balance / upstream credential / support user session |
| usage | Raw usage event is the metered workflow activity; official usage reporting is the list-price reporting value; UI event is only frontend behavior. | Analysis usage reporting record and `AnalysisJob.officialUsageCostCents` for this console display. | ledger entry / dashboard aggregate / click or UI event |
| official cost | The list-price usage cost used for official usage reporting. In the incident it is `$100.00`. | `usage.officialUsageCostCents` in `AnalysisJobApiResponse`, populated from `AnalysisJob.officialUsageCostCents` or the usage-reporting source. | actual payable debit / provider settlement |
| actual cost | Ambiguous term that should not appear alone in the customer UI. If used internally, it must be qualified as either actual payable debit or provider settlement. | Qualified field only; customer UI should use `payablePrepaidDebitLabel`. | official cost / total cost / provider cost |
| total cost | Deprecated customer-facing wording for this incident because it collapses official cost and payable debit. | Do not use as the authoritative contract label for the affected display. | official usage cost / payable prepaid debit |
| payable debit | The customer amount debited after the prepaid multiplier. In the incident it is `$40.00`. | Billing ledger for customer wallet truth; `usage.payablePrepaidDebitCents` for console display. | official usage reporting / provider settlement |
| ledger | Append-only financial record of customer wallet debits and credits. It is the source for customer balance and should not be rewritten for a label incident. | Billing ledger / customer wallet records. | analysis job status / dashboard label / API DTO copy |
| dashboard label | Human-readable frontend text such as `Official usage cost` or `Payable prepaid debit`. | Frontend copy backed by the console API DTO label fields. | ledger field / database column / internal metric name |
| api dto | Customer-facing response shape returned by `GET /api/analysis/:jobId/console`, currently `AnalysisJobApiResponse`. | `packages/shared-types/src/types.ts` plus `apps/legacy-app/src/analysis/analysis-contract.ts`. | frontend copy / MongoDB document / ledger schema |
| generated result | Raw or generated AI output before review. It must not be shown directly to customers. | Worker/provider response before customer-safe mapping. | reviewed AI result / exported report |
| reviewed result | Customer-safe analysis summary returned as `ReviewedAiResult`. | `AnalysisJob.demographics` mapped by `toReviewedResult()` into `reviewedResult`. | raw prompt / raw provider metadata / generated result |
| upload job | The analysis workflow job created for a CSV/data URL upload. | MongoDB `analysis_jobs` document represented by `AnalysisJob`. | file object / worker attempt / customer report |
| retry | Idempotent operational replay for failed or partial jobs. It must not create a second customer debit for the same billable usage event. | Console contract `retry.idempotencyKey` and the billing/ledger idempotency key used by the debit path. | duplicate customer request / new billable event |
| stable | Stable deployment target/image or stable public API contract, depending on context. For release decisions, it means the stable image receiving primary traffic. | `ops/current-rollout-state.json` and release command log. | Git branch named stable / unchanged UI text |
| canary | Deployment target/image receiving canary traffic. A public canary must not be updated in place for an urgent billing-label patch. | `ops/current-rollout-state.json` and release command log. | private shadow test / stable target / API contract stability |

## Decision Entries

### 2026-07-02 12:18 CST - Billing label incident classification

- Context: Acme Team saw `Total usage cost: $100.00` while its prepaid wallet was debited `$40.00` with a prepaid multiplier of `0.4`.
- Decision: Treat the incident as primarily a customer-facing UI/API semantic labeling issue unless later evidence proves a ledger bug. `$100.00` is the official usage cost; `$40.00` is the payable prepaid debit.
- Source of truth: Customer balance remains the billing ledger / customer wallet record. Official usage reporting remains the usage reporting record exposed to this console as `AnalysisJob.officialUsageCostCents`. The console display comes from `AnalysisJobApiResponse.usage`.
- API / UI contract impact: The affected API DTO must keep `officialUsageCostCents` and `payablePrepaidDebitCents` separate and render labels that do not imply those values should match.
- Alternatives rejected: Rewriting historical ledger entries; changing the prepaid multiplier; collapsing official and payable amounts into one `total cost`; inferring a double-billing bug from the `$100/$40` mismatch alone.
- Risk: If the UI keeps saying `Total usage cost`, customers may believe the wallet debit is inconsistent. If engineering changes the ledger to make UI copy match, financial history may be corrupted.
- Verification: Contract tests should assert the API returns both values and labels; ledger tests should prove no additional debit occurs on retry.

### 2026-07-02 12:18 CST - Customer-safe result and metadata boundary

- Context: The existing contract exposes `ReviewedAiResult` and states raw prompts and provider metadata must not appear there.
- Decision: The customer-facing console may display only reviewed result fields, job status, retry metadata safe for support, and separated usage/debit labels. It must not expose raw prompts, provider balances, provider metadata, credentials, or routing weights.
- Source of truth: `AnalysisJob.demographics` is mapped through `toReviewedResult()` for customer display; provider integration responses remain internal.
- API / UI contract impact: `GET /api/analysis/:jobId/console` should return `reviewedResult`, `usage`, `status`, and `retry` only through the shared `AnalysisJobApiResponse` contract.
- Alternatives rejected: Rendering the raw third-party provider response; surfacing provider account balance or provider settlement cost; adding routing/load weights to the console for debugging.
- Risk: Metadata leakage would expose internal prompts, upstream account details, or routing controls to customers.
- Verification: Tests or static contract checks should fail if fields such as `rawPrompt`, `providerMetadata`, `providerBalance`, `credential`, `routeWeight`, or `loadWeight` appear in the customer API DTO or rendered dashboard.

### 2026-07-02 12:18 CST - Historical ledger and retry treatment

- Context: The incident report asks whether historical ledger entries should be rewritten and whether a failed retry could double-charge anything.
- Decision: Do not rewrite historical ledger entries for this incident. Retry must be treated as an idempotent operational replay, not a new billable event, unless a new source usage event is intentionally created and recorded by the ledger path.
- Source of truth: Historical customer wallet state remains the ledger. The console's `retry.idempotencyKey` is display/support evidence, not a new ledger key by itself.
- API / UI contract impact: UI wording should say `Payable prepaid debit` rather than `actual cost`; retry display should show whether retry is allowed and the idempotency key without promising that retry itself changes billing.
- Alternatives rejected: Backfilling ledger values to `$100.00`; adding compensating ledger entries before proving an incorrect debit; hiding retry state to avoid explaining idempotency.
- Risk: A retry implementation that lacks ledger idempotency could double debit; this has not been proven from the inspected code and must be tested before any billing-path change.
- Verification: Add a retry characterization test that processes the same job or event twice and asserts a single customer ledger debit while official usage reporting remains stable.

### 2026-07-02 12:18 CST - Stable/canary release terminology

- Context: Billing-label fixes are customer-facing, and the challenge also includes public canary release safety rules.
- Decision: For any release of this incident fix, `stable` and `canary` must be interpreted as deployment targets/images and traffic weights, not Git branches or subjective quality labels.
- Source of truth: `ops/current-rollout-state.json` for observed rollout state; `solutions/release-command-log.md` for action-by-action release decisions.
- API / UI contract impact: The urgent UI/API label patch should preserve compatibility between frontend assets and the backend API DTO across stable and canary traffic.
- Alternatives rejected: Updating a public canary in place without a rollback target; changing API field meanings while frontend assets are split across stable/canary.
- Risk: Mixed frontend/backend versions could reintroduce ambiguous dashboard labels or hide the reviewed result.
- Verification: Release smoke checks must cover traffic weights, rollback target, API contract compatibility, dashboard label rendering, billing semantics, and reviewed AI result visibility.
