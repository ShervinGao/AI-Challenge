# Part 2 — Interrupted UI/API Rollout Plan

## 1. Current State Evidence

| Field | Observed value | Evidence source |
|---|---|---|
| stable image | | |
| canary image | | |
| stable traffic weight | | |
| canary traffic weight | | |
| canary has public traffic? | | |
| Phase 1 promoted? | | |
| frontend asset version | | |
| API contract version | | |

## 2. Phase 1 Freeze Decision

- Decision:
- Reason:
- What must not happen next:

## 3. Phase 2 Base Decision

Should the urgent patch be based on stable image A or Phase 1 canary image B?

- Decision:
- Dependency evidence:
- Frontend/backend compatibility evidence:
- Rollback target:

## 4. Compatibility Matrix

| Frontend version | Backend/API version | Safe? | Reason |
|---|---|---|---|
| stable UI | stable API | | |
| stable UI | canary API | | |
| patched UI | stable API | | |
| patched UI | patched API | | |

## 5. High-Availability Sequence

```text
1.
2.
3.
```

## 6. Customer-Invisibility Proof

- API availability check:
- Dashboard/customer-facing check:
- UI label check:
- AI result visibility check:
- Billing semantic check:
- Ledger idempotency check:
- Provider/internal metadata leakage check:

## 7. Final State

- Stable image:
- Canary image:
- Frontend asset version:
- API contract version:
- ALB weights:
- Remaining Phase 1 disposition:
- Remaining risks:
