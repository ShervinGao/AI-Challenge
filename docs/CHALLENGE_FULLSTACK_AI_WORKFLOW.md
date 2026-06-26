# Part 3: FullStack AI Workflow Slice

## Context

Customers upload CSV files and expect AI-assisted analysis results. Support needs an operations console that shows whether a job is queued, running, partially complete, failed, retried, or ready for review.

The current repository has a legacy full-stack app and a worker service. The legacy app includes an intentionally incomplete console surface at `GET /api/console`. This is a FullStack challenge: you must make the frontend/backend workflow coherent enough to prove at least one customer-facing path, or provide an equivalent contract-first implementation with UI state evidence. A runnable focused UI is stronger than a purely written answer, but a broad frontend rewrite is out of scope.

Reference payloads live in `debug-payloads/`. Treat them as challenge inputs, not expected answers.

## Product Prompt

```text
Acme Team uploaded a CSV for a QBR.
Support needs to open one console page and answer:
  - Did the upload create exactly one analysis job?
  - What status is the job in?
  - Which AI result is safe to show the customer?
  - What did the customer pay versus what is official usage reporting?
  - Did any retry duplicate work or duplicate a ledger debit?
  - If the job partially failed, what can be retried and what should be escalated?
```

## Required UX Surface

Define and, if scoped in your spec, implement the smallest surface that covers:

- analysis job list or detail view
- upload or job creation entry point
- queued, running, partial, failed, retrying, and complete states
- reviewed AI result display
- unambiguous official usage cost and payable prepaid debit labels
- retry action or retry recommendation
- empty and error states
- loading and stale-data state
- accessibility basics for keyboard, screen reader labels, focus order, and color-independent status

## Required API Contract

Define the API contract before implementation. Include:

- request shape for creating or replaying an analysis job
- response shape for job status
- response shape for reviewed results
- response shape for official usage and payable debit labels
- idempotency key or replay protection
- error shape for validation, provider failure, partial processing, and retry exhaustion

## AI-Specific Safety Requirements

- Do not expose raw prompts, provider credentials, provider account balances, internal routing weights, or unreviewed raw model metadata in the customer UI.
- Distinguish raw model output from reviewed customer-visible insight.
- Explain how a human can correct AI-suggested labels, summaries, or actions before release.
- Record rejected AI suggestions in `solutions/ai-collaboration-log.md`.

## Test Evidence

Provide at least one of:

- component or UI test evidence for the primary status/result path
- API contract test evidence
- end-to-end test or command output showing upload/job/status/result behavior
- recorded local run evidence with exact commands and observed output

## Non-Goals

- Building a full design system.
- Rewriting worker orchestration.
- Adding authentication beyond a clear boundary assumption.
- Implementing a complete billing platform.
- Replacing stable/canary release process.
