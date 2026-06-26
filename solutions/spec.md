# Spec — AI Workflow FullStack Urgent Change

> Complete this before modifying code.

## 1. Current-State Understanding

- Customer-facing symptom:
- Affected customer / surface:
- Frontend surfaces involved:
- Backend endpoints involved:
- Worker / queue path involved:
- Current release state:
- Known constraints:

## 2. Source-of-Truth Map

```text
CSV upload / analysis request
  -> ...
```

| Concept | Source of truth | Read path | Write path | Must not be confused with |
|---|---|---|---|---|
| customer wallet balance | | | | provider balance / load-balancing weight |
| official usage cost | | | | payable debit |
| payable prepaid debit | | | | official list price |
| reviewed AI result | | | | raw model output / provider metadata |
| dashboard label | | | | ledger field / API DTO name |
| API contract | | | | frontend copy |
| upload job status | | | | model result quality |
| release stable | | | | Git branch named stable |
| canary | | | | private shadow canary vs public canary |

## 3. Frontend User Flow And UI States

- Primary user:
- Primary path:
- Empty state:
- Loading state:
- Queued / running state:
- Partial-result state:
- Failed state:
- Retrying state:
- Complete state:
- Stale-data state:
- Accessibility requirements:
- Metadata leakage risks:

## 4. Backend / API Contract

- Create or replay job request:
- Job status response:
- Reviewed result response:
- Usage/cost display response:
- Error response:
- Idempotency / replay protection:
- Compatibility expectations:

## 5. Root-Cause Hypotheses Before Code

1.
2.
3.

## 6. Non-Goals

-
-
-

## 7. Blast Radius

- Affected UI components:
- Affected endpoints:
- Affected customer-facing display:
- Affected billing / ledger behavior:
- Affected AI result behavior:
- Affected provider / routing behavior:
- Affected release state:
- Metadata leakage risk:

## 8. Validation Plan

- Characterization tests:
- API contract tests:
- UI/component tests:
- End-to-end or smoke checks:
- Accessibility checks:
- Release checks:
- Evidence to paste into final report:

## 9. AI Recommendation Review

| AI suggestion | Accepted / rejected / modified | Human reasoning |
|---|---|---|
| | | |
