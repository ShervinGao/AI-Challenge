# Scale Plan Under Constraints

## 1. Throughput Target

- Rows: 5,000,000 rows in one Monday enterprise batch.
- Deadline: 2 hours = 7,200 seconds.
- Required throughput: 5,000,000 rows / 7,200 seconds = about 694 rows/sec.
- Current throughput: about 10 rows/sec.
- Gap: about 70x before overhead.
- Safety factor: target 1,200-1,500 rows/sec so provider latency, retries, bad rows, and report aggregation do not consume the whole two-hour window.
- Current repo constraint: the worker uses a local file queue and processes messages sequentially. `process-chaos.ts` is not implemented, and the chaos payload shows mixed types, invalid emails, nulls, negative ages, and out-of-range scores that need validation buckets rather than whole-batch failure.

## 2. Smallest Architecture Change

```text
Browser
  -> request signed upload URL from API
  -> upload 10GB CSV directly to object storage
  -> API creates one upload job / batch manifest
  -> lightweight sharder streams CSV from object storage
  -> write shard manifests to object storage
  -> enqueue one message per shard
  -> bounded Node worker pool processes shards
  -> each worker writes idempotent shard result + failure bucket summary
  -> reducer merges shard summaries into reviewed partial result / final report
  -> operations console reads upload progress, partial result, retry state, stale-data state
```

Smallest change: replace local file polling for the enterprise path with object storage plus a managed queue or equivalent durable queue semantics, then run multiple existing Node workers with a concurrency cap. Keep the current worker language and business contract; do not rewrite in Rust, migrate to Kubernetes, or build a design system as the two-week solution.

This reaches the target by parallelizing row-level work across shards instead of trying to make one sequential worker 70x faster. For example, 100 workers at a capped 15 rows/sec each gives 1,500 rows/sec before retry overhead. If provider limits cannot support that, degrade to sampled AI enrichment plus deterministic validation while preserving the customer-facing progress/report contract.

## 3. Signed Upload And Object Storage

- Signed upload: API returns a short-lived signed URL or multipart upload credentials scoped to one customer, one upload job, and one object prefix.
- Object layout: `uploads/{customerId}/{uploadJobId}/source.csv`, `manifests/{uploadJobId}/shards/*.json`, `results/{uploadJobId}/shards/*.json`, and `failed-records/{uploadJobId}/bucket-*.json`.
- Upload progress: browser reports multipart upload bytes sent; backend records object-store completion and expected size/checksum when finalized.
- Metadata boundary: object storage and internal shard manifests must not expose raw prompts, provider credentials, provider metadata, provider balances, or routing weights in the customer console.
- Customer contract: console can show upload progress, processing progress, partial result availability, and stale-data state without showing raw provider payloads.

## 4. Work Partitioning And Idempotency

- Shard key: `(uploadJobId, shardIndex)` where each shard covers a deterministic CSV byte range or row range after header normalization.
- Shard size: start around 10,000 rows per shard. Five million rows becomes about 500 shard messages, enough for parallelism without flooding the queue with per-row messages.
- Job identity: `uploadJobId` for the whole CSV analysis job; `shardId = uploadJobId:shardIndex` for one processing unit.
- Row identity: stable hash of `{ uploadJobId, rowNumber, sourceChecksum }`, not provider response content.
- Idempotency key: `analysis:{uploadJobId}:{shardIndex}:{sourceChecksum}` for shard attempts and `analysis-row:{uploadJobId}:{rowNumber}` for row outputs when row-level writes are needed.
- Idempotent writes: upsert shard results by `shardId` and only allow state transitions such as `queued -> running -> complete/partial/failed`; retry must not create a second billable usage event.
- Retry policy: retry transient provider/rate-limit failures with capped exponential backoff and jitter; do not retry deterministic validation failures.
- Dead-letter policy: after the attempt cap, write a shard-level failure bucket and continue the batch as partial instead of failing the entire 10GB upload.
- Duplicate ledger prevention: billing and usage records must be keyed to the upload job or accepted billable usage event, not worker attempt count.

## 5. Concurrency And Backpressure

- Worker count: start with a fixed Node worker pool rather than new orchestration. Increase replica/process count only within tested provider and database limits.
- Per-worker concurrency: process a small number of shards concurrently per process; inside each shard, use a row concurrency cap.
- Global concurrency: store provider/customer concurrency tokens centrally, for example in Redis or the queue lease model, so 20 workers do not accidentally multiply provider calls beyond the cap.
- Initial capacity target: 100 concurrent row processors at 15 rows/sec each, or another measured combination that reaches 1,200-1,500 rows/sec.
- Queue visibility / lease: shard messages need visibility timeouts or leases longer than the expected shard processing window, with heartbeat extension for long-running shards.
- Rate-limit handling: on 429/provider throttle, release capacity tokens, back off the shard, and keep the upload job in a degraded but visible state.
- Backpressure: if queue depth, provider latency, DB write latency, or failure rate crosses thresholds, stop accepting immediate processing promises and show a queued/degraded ETA in the console.
- UI behavior when throttled: show processing paused/throttled text, last successful update time, partial result count, and retry state. Do not imply the job is complete.

## 6. Frontend Progress And Degrade UX

- Upload progress: show multipart byte progress, object-store finalization state, and "upload received" timestamp.
- Processing progress: show `rowsDiscovered`, `rowsQueued`, `rowsProcessed`, `rowsSucceeded`, `rowsFailed`, `shardsComplete`, and estimated completion range.
- Partial result: show reviewed aggregate insights from completed shards with a visible "partial result" label until every shard is complete or intentionally skipped.
- Failure bucket display: group failures by validation error, provider timeout, provider rate limit, malformed row, and transformation error. Show counts plus a small safe sample ID set, not raw sensitive payloads.
- Retry affordance: allow retry by shard or failure bucket with idempotency key visible to support; do not make retry look like a new billable upload.
- stale-data indicator: show last updated time and mark the console stale-data if no shard heartbeat or progress write lands within the expected window.
- Degrade mode: if the system is behind, show "degraded: deterministic validation and partial AI enrichment in progress" with final report ETA and support-facing reason.
- Accessibility considerations: progress must be text plus numbers, not color alone; updates should be announced through the existing aria-live pattern; controls must remain keyboard usable.

## 7. Debuggability Without Alert Floods

- Error sampling: capture bounded representative failed records per bucket, for example first 20 plus hashes/counts, not every bad row.
- Failure buckets: use stable bucket keys such as `invalid_email`, `invalid_age`, `score_out_of_range`, `provider_timeout`, `provider_rate_limit`, and `transform_error`.
- Representative payload capture: save sanitized row IDs, schema field names, normalized values, and validation reason. Avoid raw prompts, provider metadata, credentials, or full customer CSV rows in general alerts.
- Alert thresholds: alert on batch-level SLO risk, provider outage, queue age, retry exhaustion, and failure-rate spikes. Do not alert once per row or once per shard.
- Operator dashboard: show queue depth, oldest shard age, throughput rows/sec, provider throttle rate, DB write latency, failure bucket counts, and current degrade mode.
- Customer-safe error copy: customer console gets concise failure bucket names and counts; support/debug views can link to sanitized failed-record artifacts.

## 8. What Not To Rebuild In Two Weeks

- Do not rewrite the worker in Rust as the two-week solution. The bottleneck is architecture/parallelism/provider limits, not TypeScript syntax.
- Do not migrate everything to Kubernetes just to run this batch. Use the existing Node worker in a bounded worker pool or managed worker runtime first.
- Do not build a full design system. Extend the current operations console states for upload progress, partial result, retry, and stale-data.
- Do not replace the billing ledger, usage semantics, or customer-facing API contract.
- Do not build a new AI orchestration platform. Add sharding, idempotency, backpressure, and progress reporting around the existing workflow.
- Do not store raw provider metadata or credentials in customer-visible progress/report artifacts.

## 9. Degrade / Rollback Plan

- If behind schedule: stop promising full AI enrichment inside two hours, finish deterministic CSV validation and report partial result from completed shards, then continue enrichment asynchronously.
- If provider is degraded: reduce provider concurrency cap, switch to sampled/priority-row enrichment, and mark the job as degraded with clear stale-data and partial result messaging.
- If bad data rate spikes: keep processing valid rows, write failure buckets for invalid rows, and avoid alert floods by thresholding on bucket percentages.
- If billing/usage confidence is low: freeze billable debits for the batch, preserve official usage events separately, and require finance review before posting payable prepaid debit. Do not rewrite historical ledger entries.
- If frontend/backend versions are incompatible: keep the old console path available, expose progress through additive API fields only, and rollback UI assets to the last compatible version.
- Rollback: disable the enterprise sharded path behind a feature flag and route new uploads back to the current single-job workflow for smaller files; keep already uploaded objects and manifests for replay.
- Data rollback: because shard outputs are idempotent and keyed by source checksum, failed or duplicate shards can be reprocessed without deleting successful shard results.
- Customer degrade promise: if the batch falls behind, the customer still sees upload progress, rows processed, partial result, failure buckets, retry status, and stale-data indicators rather than a silent spinner.
