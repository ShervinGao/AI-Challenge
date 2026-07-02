# Part 1 - UI/API Billing Semantics Incident

## 1. Business Glossary

| Term | Meaning in this incident | Source of truth | Must not be confused with |
|---|---|---|---|
| customer balance | The customer's prepaid wallet balance after ledger credits and debits. The inspected console contract does not itself store the full balance. | Billing ledger / customer wallet record. | provider balance / load-balancing weight |
| provider balance | Upstream provider account balance or settlement state. It is internal and must not be rendered. | Provider account systems and internal integration state. | customer wallet |
| load balance | Routing or load-balancing distribution weight for traffic/providers. | Release/routing configuration, not billing data. | money |
| official cost / total cost | Official usage cost or list-price usage report value. In the ticket this is `$100.00`; the old `Total usage cost` wording is ambiguous. | Usage reporting record; console display field `usage.officialUsageCostCents`. | actual payable debit |
| actual cost / payable cost | Ambiguous phrase. For the customer display, use `payable prepaid debit` to mean the amount debited after prepaid multiplier. | Billing ledger for truth; console display field `usage.payablePrepaidDebitCents`. | official list price |
| raw usage event | Metered workflow event before ledger debit calculation and dashboard display. | Usage metering pipeline / analysis job event history. | ledger entry |
| ledger entry | Financial debit/credit record that changes customer wallet balance. | Billing ledger. | dashboard aggregate |
| team prepaid multiplier | Customer commercial multiplier. Here `0.4` means a `$100.00` official usage cost produces a `$40.00` payable prepaid debit. | Customer billing package configuration applied by the debit path. | provider discount |
| API cost field | Structured field in the customer-facing API DTO. For this incident, cost display fields are in `AnalysisJobApiResponse.usage`. | `packages/shared-types/src/types.ts` and `apps/legacy-app/src/analysis/analysis-contract.ts`. | UI label / ledger column |
| dashboard label | Human-readable label rendered in the console, such as `Official usage cost` or `Payable prepaid debit`. | Frontend copy backed by API DTO labels. | source-of-truth value |
| reviewed AI result | Customer-safe summary derived from stored analysis job demographics. | `toReviewedResult(job)` returns `ReviewedAiResult`. | raw model output / provider metadata |

## 2. Incident Classification

The incident is primarily a customer-facing UI/API semantic labeling issue unless new evidence proves a ledger bug.

The observed numbers are internally consistent with the business rule supplied in the ticket:

```text
official usage cost: $100.00
team prepaid multiplier: 0.4
payable prepaid debit: $100.00 * 0.4 = $40.00
```

So the currently supported conclusion is:

- Not proven wrong debit: `$40.00` is the expected prepaid debit for a `0.4` multiplier.
- Not proven double billing: no inspected file shows a second ledger debit path.
- Likely wrong UI label: `Total usage cost` makes the customer read `$100.00` as the wallet debit.
- Possible API DTO/display bug: older or incomplete dashboard DTOs may collapse official usage cost and payable debit into one cost concept.
- Not enough evidence for wrong aggregate: official usage reporting may correctly preserve `$100.00`; the problem is the customer-facing distinction.

Business conclusion: official usage cost and payable prepaid debit must remain separate. The UI and API must label both concepts explicitly rather than forcing them to match.

## 3. Source-Of-Truth Map

```text
CSV / data URL upload
  -> POST /api/analysis
  -> AnalysisService.createAnalysis()
  -> MongoDB analysis_jobs document as AnalysisJob
  -> local-queue AnalysisRequested event
  -> worker updates analysis_jobs status and demographics
  -> GET /api/analysis/:jobId/console
  -> toConsoleAnalysisJob(job)
  -> AnalysisJobApiResponse.usage + reviewedResult + retry
  -> customer-facing console labels
```

| Question | Source-of-truth answer |
|---|---|
| Which storage object is the source of truth for customer balance? | The billing ledger / customer wallet record, not the legacy console, not `AnalysisJobApiResponse`, and not a dashboard label. The inspected repo does not contain the full ledger object, so code changes must not invent a replacement source of truth. |
| Which storage object is the source of truth for official usage reporting? | The usage reporting record surfaced in this repo as `AnalysisJob.officialUsageCostCents` and mapped to `usage.officialUsageCostCents`. It should remain the official list-price usage amount. |
| Which object is the source of truth for reviewed AI analysis results shown to customers? | The customer-safe `ReviewedAiResult` returned by `toReviewedResult(job)`, derived from stored `AnalysisJob.demographics`. Raw provider response and generated result data are not customer display truth. |
| Which object is the source of truth for payable prepaid debit shown in the console? | The billing ledger is authoritative for the debit; the console display uses `AnalysisJob.payablePrepaidDebitCents` mapped to `usage.payablePrepaidDebitCents` as a display copy. |
| What should the dashboard trust? | The dashboard should trust the `AnalysisJobApiResponse` API DTO for display shape and labels, while remembering it is not the ledger itself. |

## 4. API And UI Contract

Affected endpoint:

```text
GET /api/analysis/:jobId/console
```

Customer-facing API DTO:

```ts
type AnalysisJobApiResponse = {
    id: string;
    userId: string;
    sourceDataUrl: string;
    status: 'queued' | 'running' | 'partial' | 'failed' | 'retrying' | 'complete';
    usage: {
        officialUsageCostCents: number;
        officialUsageCostLabel: 'Official usage cost';
        payablePrepaidDebitCents: number;
        payablePrepaidDebitLabel: 'Payable prepaid debit';
        prepaidMultiplier: number;
    };
    reviewedResult: {
        summary: string;
        confidence: number;
        reviewedAt?: string;
    };
    retry: {
        canRetry: boolean;
        idempotencyKey: string;
        lastError?: string;
    };
};
```

UI labels rendered:

- `Official usage cost`: the official/list-price usage reporting amount, e.g. `$100.00`.
- `Payable prepaid debit`: the customer wallet debit after multiplier, e.g. `$40.00`.
- `Prepaid multiplier`: the customer package multiplier, e.g. `0.4x`.
- Avoid standalone `Total usage cost`, `actual cost`, or `official result` because those terms collapse business meanings.

State expectations:

- Loading: show that the job contract is being fetched; do not display stale costs as final.
- Empty: no job selected or no reviewed result available yet.
- Success/complete: show reviewed AI result and both separated usage/debit values.
- Failed/partial: show safe retry state and idempotency key; do not imply a failed retry creates a new bill.
- Retry: retry is an operational replay and should be presented separately from billing.

Internal fields that must not be exposed:

- raw prompts
- generated result before review
- raw provider metadata
- provider balances
- provider credentials
- provider settlement costs
- load-balancing weights
- route or fallback internals

Compatibility expectation:

- Additive labels and separated fields are safe.
- Do not rename a field in a way that makes older frontend assets interpret payable debit as official usage cost or vice versa.
- Keep official usage cost and payable prepaid debit separate across stable and canary frontend/backend combinations.

## 5. Prepaid Multiplier Treatment

The team prepaid multiplier should affect:

- Ledger debit / payable prepaid debit: yes. `$100.00 * 0.4 = $40.00`.
- API response labels: yes, because the API DTO should show both official usage and payable prepaid debit unambiguously.
- Dashboard labels: yes, because the user needs to understand why the two values differ.

The team prepaid multiplier should not affect:

- Raw usage events: no. Raw usage should preserve what happened before commercial terms are applied.
- Official usage reporting: no. Official/list-price usage remains `$100.00`.
- Provider balance: no. Customer prepaid multiplier is not a provider account balance.
- Load-balancing weights: no. Routing/load state is unrelated to money.
- Raw AI result or reviewed result: no. Analysis content is separate from billing semantics.

## 6. Fix Plan

- Layer to change: customer-facing API DTO and dashboard labels, if current implementation still renders ambiguous wording.
- Layers explicitly not changed: billing ledger semantics, provider balances, provider credentials, routing weights, load-balancing behavior, worker orchestration, and historical financial records.
- Historical data treatment: do not rewrite historical ledger entries. Existing ledger records preserve the debit event history; a label problem should be corrected in presentation and documentation, not by mutating financial history.
- Idempotency risk: retry must be tested so repeated processing of the same job/event does not create a second payable debit. The inspected console exposes an `idempotencyKey`, but that display alone does not prove the ledger path is idempotent.
- Customer-facing wording risk: avoid `Total usage cost` and unqualified `actual cost`; use `Official usage cost` and `Payable prepaid debit`.
- Accessibility risk: cost/debit distinctions must be text labels, not color-only distinctions, and status updates should be readable by assistive technology.
- Metadata risk: the reviewed result panel must render only `ReviewedAiResult`, never raw prompts, provider metadata, credentials, balances, route weights, or fallback details.

## 7. Verification Evidence

Static evidence from inspected files:

- `packages/shared-types/src/types.ts` defines separate `officialUsageCostCents`, `payablePrepaidDebitCents`, `officialUsageCostLabel`, `payablePrepaidDebitLabel`, and `prepaidMultiplier` fields.
- `packages/shared-types/src/types.ts` says `ReviewedAiResult` must not include raw prompts or provider metadata.
- `apps/legacy-app/src/analysis/analysis-contract.ts` maps `AnalysisJob` to `AnalysisJobApiResponse` with distinct `Official usage cost` and `Payable prepaid debit` labels.
- `apps/legacy-app/src/console/console.controller.ts` already states that raw prompts, provider balances, credentials, and routing weights must not be exposed in the reviewed result section.

Required test/check evidence before final submission:

- Official list-price usage is preserved: a contract test should pass a job with `officialUsageCostCents: 10000` and assert the console API returns `10000` with `Official usage cost`.
- Payable prepaid debit is preserved: the same test should assert `payablePrepaidDebitCents: 4000`, `prepaidMultiplier: 0.4`, and `Payable prepaid debit`.
- Provider balance is not touched: a static field-leak test should assert the customer API DTO/rendered HTML contains no `providerBalance`, provider credential, or provider metadata fields.
- Load-balancing weight is not touched: static and release checks should assert no `loadWeight`, `routeWeight`, `trafficWeight`, or fallback routing value is added to the customer API DTO.
- Retry does not double debit: an idempotency/ledger characterization test should replay the same job or retry event and assert one customer ledger debit for the billable usage event.
- UI renders unambiguous labels: a UI smoke or snapshot should assert `Official usage cost` and `Payable prepaid debit` are visible and `Total usage cost` is not used for the affected display.
- Raw prompts and provider metadata are not leaked: contract and UI tests should assert absent keys/text for `rawPrompt`, `prompt`, `providerMetadata`, `credentials`, `providerBalance`, `routeWeight`, and unreviewed generated result payloads.
