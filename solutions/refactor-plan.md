# Surgical FullStack Refactor Plan

> Complete before touching messy hot-path code.

## 1. Target

- File: `apps/legacy-app/src/console/console.controller.ts`
- Function / class / component: `renderConsoleHtml()` plus the `RootConsoleController` and `ConsoleController` routes that serve the static console.
- Contract: the page should consume the existing customer-facing `GET /api/analysis/:jobId/console` endpoint, whose DTO is `AnalysisJobApiResponse`.
- Why this is in scope: the current console already renders the customer-facing operational surface, but it is static and says status, retry, usage/debit, and reviewed result are "not wired". The smallest FullStack improvement is to make that same page read the existing safe API contract and render the contract-backed state.
- Why this is not broader: do not introduce a frontend framework, do not rewrite worker orchestration, do not change ledger semantics, and do not expose raw provider metadata.

## 2. Current Responsibility Leak

The console controller currently mixes three responsibilities in one large HTML string:

- HTTP route ownership: `GET /` and `GET /console` return `text/html`.
- UI shell rendering: headings, layout, sections, and placeholder copy.
- Product truth presentation: placeholders for job status, retry, official usage cost, payable prepaid debit, and reviewed AI result.

The responsibility leak is small but customer-facing: the UI shell exists, yet the display values are not sourced from the established API DTO. That makes the page depend on hardcoded placeholder semantics instead of the shared `AnalysisJobApiResponse` contract.

The refactor should not move billing or analysis truth into the console controller. The console should become a thin consumer of the already defined contract.

## 3. Characterization Evidence

- Existing behavior to lock:
  - `RootConsoleController.getRootConsole()` and `ConsoleController.getConsole()` both return the same HTML document.
  - Both routes set `content-type` to `text/html; charset=utf-8`.
  - The page contains the sections `Analysis job`, `Usage and cost`, and `Reviewed AI result`.
  - The page warns that raw prompts, provider balances, credentials, and routing weights must not be exposed.
- Current contract evidence:
  - `AnalysisJobApiResponse` exposes `status`, `usage`, `reviewedResult`, and `retry`.
  - `UsageCostDisplay` keeps `officialUsageCostCents` and `payablePrepaidDebitCents` separate.
  - `ReviewedAiResult` is the customer-safe result; raw prompts and provider metadata are not part of the contract.
  - `toConsoleAnalysisJob()` maps `AnalysisJob` into the customer-facing DTO and sets explicit labels `Official usage cost` and `Payable prepaid debit`.
- Test file to add or update during implementation:
  - Add a focused console rendering test under `apps/legacy-app/test/console-rendering.spec.ts` or equivalent local test pattern.
  - Add or update a contract test for `toConsoleAnalysisJob()` if one does not already exist.
- Expected failure mode if behavior changes accidentally:
  - Route no longer returns HTML.
  - Static console stops showing the expected section landmarks.
  - UI renders ambiguous `Total usage cost` instead of separate official/debit labels.
  - UI or API leaks `providerMetadata`, `providerBalance`, `credential`, `routeWeight`, `loadWeight`, raw prompt, or generated result payloads before review.

## 4. Extraction Boundary

- Extraction boundary: one browser-side console presenter component inside the existing static page.
- Component: an inline, framework-free `AnalysisConsolePanel` script that:
  - accepts a job ID from a simple form or query parameter,
  - calls `GET /api/analysis/:jobId/console`,
  - validates that the response has the expected top-level contract fields,
  - updates existing DOM regions using `textContent`, not raw HTML injection.
- Inputs:
  - `jobId` from user input or URL query string.
  - `AnalysisJobApiResponse` from `GET /api/analysis/:jobId/console`.
- Outputs:
  - DOM text for status, timestamps, retry state, official usage cost, payable prepaid debit, prepaid multiplier, and reviewed AI result.
  - Empty/loading/success/failure states consistent with the spec.
- Side effects:
  - One read-only HTTP GET to the customer-facing console API.
  - DOM updates only.
  - No ledger writes, no job mutation, no worker calls, no route or provider reads.
- Frontend/backend contract impact:
  - The frontend uses only `AnalysisJobApiResponse.status`, `usage`, `reviewedResult`, and `retry`.
  - The backend contract does not need a new endpoint for this slice because `GET /api/analysis/:jobId/console` already exists.
  - If implementation discovers a missing API field, prefer an additive contract change instead of repurposing an existing field.
- Why this is the smallest safe boundary:
  - It keeps the current Nest controllers and static HTML delivery model.
  - It avoids a parallel frontend app and avoids adding a build pipeline.
  - It preserves the existing analysis and worker path.
  - It limits customer-facing semantic changes to display wiring and labels backed by the safe DTO.

## 5. Old Behavior Locked By Tests

- `/` and `/console` continue serving an HTML page.
- The console page remains usable without a JavaScript framework or bundled assets.
- The page continues to render accessible section headings for job state, usage/cost, and reviewed result.
- The metadata leakage warning remains true in behavior: no internal provider, prompt, credential, route, or load-balancing fields are rendered.

## 6. New Behavior Added

- A user can enter or load a job ID and have the console fetch `GET /api/analysis/:jobId/console`.
- The status panel renders `queued`, `running`, `partial`, `failed`, `retrying`, or `complete`.
- The cost panel renders separate labels and values for official usage cost and payable prepaid debit.
- The result panel renders `reviewedResult.summary`, confidence, and reviewed timestamp when present.
- The retry panel renders `retry.canRetry`, `retry.idempotencyKey`, and safe `retry.lastError` text when present.
- Loading, not-found/error, partial, failed, and stale-data states are explicit text states, not color-only cues.

## 7. Explicitly Rejected AI Rewrite Ideas

| Suggested rewrite | Why rejected |
|---|---|
| Replace the static console with React, Next.js, or a new frontend app | The challenge asks for a small scoped FullStack slice; the current static HTML can consume the existing API without a framework or build-system change. |
| Add a new backend console aggregation endpoint | `GET /api/analysis/:jobId/console` already exists and maps to `AnalysisJobApiResponse`; duplicating it would create a second contract surface. |
| Move billing calculations into `console.controller.ts` | Ledger semantics and payable debit truth must stay in the billing/usage path and API DTO; the console should only display contract values. |
| Rewrite worker orchestration or queue processing | The target is a UI/API wiring refactor, not analysis processing throughput or worker reliability. |
| Render raw third-party provider response for debugging | Raw prompts, provider metadata, provider balances, credentials, routing weights, and generated result payloads before review are explicitly outside the customer contract. |
| Rewrite historical ledger entries so the UI numbers match | The incident is semantic labeling unless evidence proves a ledger bug; official usage cost and payable prepaid debit must remain separate. |

## 8. Verification Plan

- Tests to run after implementation:
  - Unit/contract test for `toConsoleAnalysisJob()` preserving official usage cost, payable prepaid debit, reviewed result, and retry fields.
  - Console rendering test proving `/` or `/console` includes the form, loading/error containers, and safe section headings.
  - Static leak check proving forbidden strings such as `providerMetadata`, `providerBalance`, `credential`, `routeWeight`, `loadWeight`, and raw prompt fields are not rendered from the API response.
  - Manual or scripted smoke check that a known job ID loads through `GET /api/analysis/:jobId/console` and updates the page.
- UI or API evidence to collect:
  - Example API response showing separated `usage.officialUsageCostCents` and `usage.payablePrepaidDebitCents`.
  - Browser observation or screenshot showing `Official usage cost` and `Payable prepaid debit` as separate labels.
  - Evidence that reviewed AI result is visible while provider metadata is absent.
- Command output:
  - Not run during this planning step.
  - Record actual `pnpm run test`, `pnpm run lint`, `pnpm run build`, and `pnpm run verify:submission` output after implementation.
- Remaining risk:
  - The current repo does not expose a concrete billing ledger implementation in the inspected files, so retry double-debit proof will need separate characterization evidence.
  - The planned inline script must be careful to use `textContent` and explicit field allowlisting so API errors or unexpected payloads cannot leak internal data.
