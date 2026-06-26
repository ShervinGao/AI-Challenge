# Scale Plan Under Constraints

## 1. Throughput Target

- Rows:
- Deadline:
- Current throughput:
- Required throughput:
- Safety factor:

## 2. Smallest Architecture Change

```text
Browser upload / signed URL
  -> ...
```

## 3. Work Partitioning And Idempotency

- Shard key:
- Job identity:
- Idempotency key:
- Retry policy:
- Dead-letter policy:
- Duplicate ledger prevention:

## 4. Frontend Progress And Degrade UX

- Upload progress:
- Queue position or estimated state:
- Partial result display:
- Failure bucket display:
- Retry affordance:
- Stale-data indicator:
- Accessibility considerations:

## 5. Concurrency And Backpressure

- Worker count:
- Per-provider concurrency cap:
- Queue visibility / lease:
- Rate-limit handling:
- UI behavior when backend is throttled:

## 6. Debuggability Without Alert Floods

- Error sampling:
- Failure buckets:
- Representative payload capture:
- Alert thresholds:
- Operator dashboard:
- Customer-safe error copy:

## 7. What Not To Rebuild In Two Weeks

-
-
-

## 8. Degrade / Rollback Plan

- If behind schedule:
- If provider is degraded:
- If bad data rate spikes:
- If billing/usage confidence is low:
- If frontend/backend versions are incompatible:
