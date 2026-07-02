# Spec — AI Workflow FullStack Urgent Change

> Complete this before modifying code.

## 1. Current-State Understanding

- Customer-facing symptom: The console shows “Total usage cost: $100.00”, while the customer prepaid wallet was debited $40.00.
- Affected customer / surface: Acme Team, AI Workflow Console / dashboard cost panel used by support before the QBR.
- Frontend surfaces involved: Existing legacy console at `/` and `/api/console`; planned smallest slice will render job status, reviewed result, usage labels, and retry information.
- Backend endpoints involved: `POST /api/analysis`, `GET /api/analysis/:jobId`, and customer-facing `GET /api/analysis/:jobId/console`.
- Worker / queue path involved: `AnalysisService.createAnalysis()` saves an `AnalysisJob`, writes an `AnalysisRequested` event into `local-queue/*.json`, and worker-service processes it back into MongoDB.
- Current release state: Phase 1 is already in public canary observation with 1% public traffic, while stable receives 99% traffic. The urgent patch should be based on stable, not the public canary.
- Known constraints: Do not mutate ledger semantics, do not create a second billing source of truth, do not expose raw AI/provider metadata, do not update a public canary in place, and keep the FullStack slice small.

## 2. Source-of-Truth Map

```text
CSV upload / analysis request
  -> POST /api/analysis
  -> AnalysisService.createAnalysis()
  -> MongoDB analysis_jobs as AnalysisJob
  -> local-queue/*.json AnalysisRequested event
  -> worker-service processes the event
  -> MongoDB updates job status/result
  -> GET /api/analysis/:jobId/console
  -> AnalysisJobApiResponse
  -> console renders UsageCostDisplay and ReviewedAiResult only
```

| Concept | Source of truth | Read path | Write path | Must not be confused with |
|---|---|---|---|---|
| customer wallet balance | Billing ledger / customer wallet records | Billing/accounting read model, not raw UI text | Ledger debit path | provider balance / load-balancing weight |
| official usage cost | AnalysisJob.officialUsageCostCents / usage reporting record | GET /api/analysis/:jobId/console -> usage.officialUsageCostCents | Analysis job creation / usage reporting pipeline | payable debit |
| payable prepaid debit | Billing ledger / AnalysisJob.payablePrepaidDebitCents display field | GET /api/analysis/:jobId/console -> usage.payablePrepaidDebitCents | Ledger debit path with prepaidMultiplier | official list price |
| reviewed AI result | ReviewedAiResult inside AnalysisJobApiResponse | GET /api/analysis/:jobId/console -> reviewedResult | Worker updates AnalysisJob demographics; contract maps it to reviewedResult | raw model output / provider metadata |
| dashboard label | Frontend copy backed by AnalysisJobApiResponse.usage labels | Console UI | UI/static HTML change only | ledger field / API DTO name |
| API contract | AnalysisJobApiResponse | GET /api/analysis/:jobId/console | analysis-contract.ts mapper | frontend copy |
| upload job status | AnalysisJob.status mapped to ConsoleAnalysisStatus | GET /api/analysis/:jobId/console -> status | legacy-app creates PENDING, worker updates PROCESSING/COMPLETED/FAILED | model result quality |
| release stable | Stable deployment image / target group | ops/current-rollout-state.json | Release process | Git branch named stable |
| canary | Public canary deployment receiving 1% traffic | ops/current-rollout-state.json | Release process | private shadow canary vs public canary |

## 3. Frontend User Flow And UI States

- Primary user: Support operator or customer-facing operations user checking Acme Team’s analysis job before the QBR.
- Primary path: Open console, create or look up an analysis job, fetch `GET /api/analysis/:jobId/console`, then review job status, safe AI result, usage labels, and retry information.
- Empty state: No job selected yet; show clear instructions to create or look up an analysis job.
- Loading state: Show that the console is fetching or creating the job; disable duplicate submit while the request is in flight.
- Queued / running state: Show status text from `AnalysisJobApiResponse.status` and explain that the worker is still processing.
- Partial-result state: Show available reviewed result, retry recommendation, and escalation note without implying the job is fully complete.
- Failed state: Show `retry.canRetry`, `retry.idempotencyKey`, and `retry.lastError` if present.
- Retrying state: Show retrying status and the idempotency key so support can verify duplicate work is not treated as a new billable event.
- Complete state: Show reviewed AI result summary, confidence, official usage cost, payable prepaid debit, prepaid multiplier, and completion timestamp.
- Stale-data state: Show last updated time and a hint that the page may need refresh if the worker is still running.
- Accessibility requirements: Inputs must have labels; buttons must be keyboard usable; result updates should use an `aria-live` region; statuses must use text, not color alone.
- Metadata leakage risks: The console must not expose raw prompts, provider credentials, provider balances, provider metadata, internal routing weights, or unreviewed raw model output. It should only display `ReviewedAiResult` and `UsageCostDisplay` fields.

## 4. Backend / API Contract

- Create or replay job request: `POST /api/analysis` with `{ "userId": string, "dataUrl": string }`.
- Job status response: `GET /api/analysis/:jobId/console` returns `AnalysisJobApiResponse.status` as `queued`, `running`, `partial`, `failed`, `retrying`, or `complete`.
- Reviewed result response: `reviewedResult.summary`, `reviewedResult.confidence`, and optional `reviewedResult.reviewedAt`; raw model output is not part of the customer contract.
- Usage/cost display response: `usage.officialUsageCostCents`, `usage.officialUsageCostLabel`, `usage.payablePrepaidDebitCents`, `usage.payablePrepaidDebitLabel`, and `usage.prepaidMultiplier`.
- Error response: Use the shared `AnalysisApiErrorResponse` shape for validation, not found, provider failure, partial processing, and retry exhaustion.
- Idempotency / replay protection: Display `retry.idempotencyKey` from the console contract and treat retries as idempotent operational actions, not new customer billing events.
- Compatibility expectations: Prefer additive or label-only changes. Existing official usage and payable prepaid debit values must remain separate so older and newer frontend/API versions do not collapse financial meanings.

## 5. Root-Cause Hypotheses Before Code

1. The incident is likely a customer-facing UI/API semantic labeling issue: the console label “Total usage cost” makes the customer interpret $100.00 as wallet debit.
2. The available evidence does not prove a ledger debit bug because the $40.00 prepaid debit matches the 0.4 prepaid multiplier applied to the $100.00 official usage cost.
3. The console may not be clearly separating official usage reporting, payable prepaid debit, reviewed AI result, and retry/idempotency information.

## 6. Non-Goals

- Do not rewrite billing ledger semantics or historical ledger entries just to make UI labels match.
- Do not build a new frontend framework, design system, full billing platform, or replacement worker orchestration.
- Do not expose raw prompts, provider credentials, provider balances, provider metadata, routing weights, or raw model output.

## 7. Blast Radius

- Affected UI components: Legacy console HTML in `apps/legacy-app/src/console/console.controller.ts`.
- Affected endpoints: `POST /api/analysis` and `GET /api/analysis/:jobId/console` are used by the proposed console path.
- Affected customer-facing display: Job status, reviewed AI result, retry information, official usage cost, payable prepaid debit, and prepaid multiplier labels.
- Affected billing / ledger behavior: No intended ledger mutation; the change should preserve official usage cost and payable prepaid debit as separate concepts.
- Affected AI result behavior: Only reviewed customer-safe result fields should be displayed.
- Affected provider / routing behavior: None; provider balances, credentials, metadata, and routing weights must not be read or rendered.
- Affected release state: Phase 1 public canary should be frozen or unwound; urgent Phase 2 should be based on stable image.
- Metadata leakage risk: The scoped UI/API change must be limited to customer-safe `AnalysisJobApiResponse` fields.

## 8. Validation Plan

- Characterization tests: Record current build and baseline `verify:submission` output before code changes.
- API contract tests: Use `curl` to create an analysis job and fetch `GET /api/analysis/:jobId/console`; verify `usage`, `reviewedResult`, `status`, and `retry` fields.
- UI/component tests: Manually verify the console renders empty, loading, success, error, failed, retry, and stale-data states.
- End-to-end or smoke checks: Run MongoDB, legacy app, and worker; create one job; confirm the worker updates MongoDB and the console contract can be read.
- Accessibility checks: Confirm labels exist for inputs, keyboard submit works, status updates are text-based, and result region uses `aria-live`.
- Release checks: Confirm public canary is not updated in place; urgent patch is based on stable image; rollback targets are documented.
- Evidence to paste into final report: `node -v`, `pnpm -v`, `docker compose up -d mongodb`, `pnpm run build`, `pnpm run verify:submission`, curl output, and console observations.

## 9. AI Recommendation Review

| AI suggestion | Accepted / rejected / modified | Human reasoning |
|---|---|---|
| Treat the $100/$40 mismatch as a UI/API semantic labeling issue unless evidence proves a ledger bug. | Accepted | $40.00 matches the 0.4 prepaid multiplier applied to the $100.00 official usage cost, so rewriting ledger entries would be unsafe. |
| Display only `AnalysisJobApiResponse`, `UsageCostDisplay`, and `ReviewedAiResult` fields in the console. | Accepted | These are the customer-facing contracts and avoid raw AI/provider metadata leakage. |
| Change ledger semantics so the UI number and debit number match. | Rejected | The incident is not proven to be a wrong debit; ledger semantics must remain stable. |
| Update the existing public canary directly for the urgent fix. | Rejected | Canary already has public traffic, so Phase 1 should be frozen or unwound and the urgent patch should be based on stable. |
| Rewrite the frontend or worker orchestration broadly. | Rejected | The challenge asks for a small scoped FullStack slice, not a platform rewrite. |
