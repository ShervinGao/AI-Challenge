# Release Command Log

> Required for the interrupted rollout challenge. Record observed state, decision points, commands, evidence, and rollback target. Do not invent command output.

## Current Rollout Snapshot

Observed from `ops/current-rollout-state.json` and `ops/urgent-phase2-ticket.md` during this documentation pass. No production release command was executed.

| Field | Value | Evidence |
|---|---|---|
| stable image | `registry.example.com/gateway:phase0-a17f3d2` | `stableImage` in `ops/current-rollout-state.json`; urgent ticket repeats the same value |
| canary image | `registry.example.com/gateway:phase1-b93c1a8` | `canaryImage` in `ops/current-rollout-state.json`; urgent ticket repeats the same value |
| stable traffic weight | `99` | `stableTrafficWeight` in `ops/current-rollout-state.json` |
| canary traffic weight | `1` | `canaryTrafficWeight` in `ops/current-rollout-state.json` |
| canary has public traffic? | `true` | `canaryHasPublicTraffic` in `ops/current-rollout-state.json` |
| stable desired count | `2` | `stableDesiredCount` in `ops/current-rollout-state.json` |
| canary desired count | `1` | `canaryDesiredCount` in `ops/current-rollout-state.json` |
| Phase 1 status | Public canary observation, not promoted | `phase1Status` in `ops/current-rollout-state.json` |
| Phase 1 change summary | Team prepaid usage reporting labels and dashboard aggregation | `phase1ChangeSummary` in `ops/current-rollout-state.json` |
| urgent deadline | `60` minutes | `urgentPatchDeadlineMinutes` in `ops/current-rollout-state.json` |
| rollback target | Stable image `registry.example.com/gateway:phase0-a17f3d2` with stable traffic restored to 100 and canary public traffic set to 0 | Derived from observed stable image and public-canary risk |

## Release Safety Decision Table

| Exact action considered | Safe in observed state? | Decision | Rollback target | Why |
|---|---:|---|---|---|
| Continue Phase 1 canary observation unchanged while preparing Phase 2 | No | Freeze Phase 1 promotion immediately | Keep stable image `registry.example.com/gateway:phase0-a17f3d2`; do not increase canary beyond 1 | Phase 1 has public traffic and overlaps billing/dashboard semantics, so continuing increases customer exposure during an urgent label incident. |
| Update the existing public canary image in place with Phase 2 | No | Reject | Stable image `registry.example.com/gateway:phase0-a17f3d2`; canary image remains `registry.example.com/gateway:phase1-b93c1a8` until unwound | Public canary already serves customers; changing it in place would mix Phase 1 and urgent Phase 2 behavior without a clean rollback. |
| Unwind public canary before Phase 2 by moving public traffic to stable | Yes, after health check on stable capacity | Recommended | Previous observed state was stable 99 / canary 1, but the safer rollback during incident is stable 100 / canary 0 | Stable already serves 99% and has desired count 2. Removing canary public traffic isolates Phase 1 and keeps customers on the known stable image. |
| Base urgent Phase 2 on stable image A | Yes | Accept | API/stable rollback to `registry.example.com/gateway:phase0-a17f3d2` | Avoids inheriting unpromoted Phase 1 dashboard aggregation changes. |
| Base urgent Phase 2 on Phase 1 canary image B | No | Reject | Do not promote `registry.example.com/gateway:phase1-b93c1a8` for Phase 2 | Phase 1 is unpromoted and publicly observing; it may contain unrelated label/aggregation changes. |
| Deploy patched frontend assets against old stable API independently | Conditional | Allow only if stable API already exposes the separated usage/debit contract or UI has safe fallback | UI rollback to phase0 asset bundle associated with `registry.example.com/gateway:phase0-a17f3d2` | A label-only asset change is lower risk, but if DTO fields changed, frontend/backend must be coordinated. |
| Deploy patched API with old frontend assets still cached | Conditional | Allow only if API is additive and preserves old fields | API image rollback to `registry.example.com/gateway:phase0-a17f3d2` | Old UI must not break or reinterpret official usage cost and payable debit. |
| Promote stable-based Phase 2 after private smoke checks | Yes | Recommended if checks pass | Stable image rollback to `registry.example.com/gateway:phase0-a17f3d2`; UI asset rollback to phase0 assets; canary remains 0 public traffic | Keeps the urgent fix independent from Phase 1 and preserves a single known-good rollback. |

## Rollback Targets

| Surface | Primary rollback target | Notes |
|---|---|---|
| UI assets | Last-known-good UI asset bundle served by `registry.example.com/gateway:phase0-a17f3d2` | If assets are CDN-hosted, pin or restore the asset manifest/version paired with phase0. |
| API image | `registry.example.com/gateway:phase0-a17f3d2` | This is the observed stable image and the base for the urgent patch. |
| stable image | `registry.example.com/gateway:phase0-a17f3d2` | Before Phase 2 promotion, stable is already at this image. After Phase 2, rollback stable to this image. |
| canary image | `registry.example.com/gateway:phase1-b93c1a8` with public traffic weight 0, or remove the canary target from public routing | Do not resume public Phase 1 traffic until the urgent patch is shipped and Phase 1 is re-evaluated. |
| routing / ALB weights | Stable 100 / canary 0 during the incident | Previous 99 / 1 is an observed state, not the preferred incident rollback. |

## Timeline And Release Actions

This is a decision log and proposed safe sequence. It does not claim that the production release commands were executed.

| Time | Action | Command / execution status | Evidence | Customer impact risk |
|---|---|---|---|---|
| 2026-07-02 12:25 CST | Observed rollout state | No release command executed | `ops/current-rollout-state.json` read locally | Existing risk: 1% public traffic on Phase 1 canary |
| 2026-07-02 12:25 CST | Freeze Phase 1 promotion | Decision only; no command executed in this pass | Phase 1 is public canary observation, not promoted | Lowers risk by preventing Phase 1 expansion |
| 2026-07-02 12:25 CST | Reject updating public canary in place | Decision only; no command executed in this pass | `canaryHasPublicTraffic: true` and `canaryTrafficWeight: 1` | Avoids customer-visible mixed Phase 1/Phase 2 behavior |
| 2026-07-02 12:25 CST | Choose Phase 2 base | Decision only; no build command executed in this pass | Stable image is `registry.example.com/gateway:phase0-a17f3d2`; canary image is unpromoted Phase 1 | Keeps urgent patch independent from Phase 1 |
| Before deploy | Unwind public canary route | Planned action; exact platform command must be recorded when run | Target state stable 100 / canary 0 | Low if stable health/capacity check passes first |
| Before deploy | Build urgent Phase 2 image/assets from stable base | Planned action; exact build output/tag not invented here | Base must be `registry.example.com/gateway:phase0-a17f3d2` | Low if private smoke checks pass |
| Before deploy | Run private smoke checks | Planned action; no smoke output invented here | Checks listed below | Blocks release if UI/API/billing semantics fail |
| Deploy | Promote stable-based Phase 2 to public stable or safe 0%-to-100% route | Planned action; exact command must be recorded when run | Rollback remains `registry.example.com/gateway:phase0-a17f3d2` | Low if compatibility checks pass |
| After deploy | Keep Phase 1 frozen/off public traffic | Planned action | Can customer impact be isolated? yes, canary public traffic target is 0 | Prevents hidden Phase 1 behavior from resurfacing |

## Smoke Checks To Run Before Promotion

Do not paste fake output here. Record actual command output in this log or `solutions/test-evidence.md` only after running the checks.

| Check | Expected proof |
|---|---|
| API availability | Health endpoint and customer console endpoint return successfully with no downtime during route change. |
| UI label | Dashboard shows `Official usage cost` and `Payable prepaid debit`; it does not show ambiguous `Total usage cost` for the affected display. |
| API contract | `GET /api/analysis/:jobId/console` returns separate `usage.officialUsageCostCents`, `usage.payablePrepaidDebitCents`, `usage.officialUsageCostLabel`, `usage.payablePrepaidDebitLabel`, and `usage.prepaidMultiplier`. |
| frontend/backend compatibility | Stable UI with patched API and patched UI with stable API either render safely or are blocked from mixed release by coordinated deploy. |
| AI result visibility | Customer can still see `reviewedResult.summary` and `reviewedResult.confidence` for completed jobs. |
| ledger semantics | `$100.00` official usage cost and `$40.00` payable prepaid debit remain separate; no historical ledger rewrite occurs. |
| retry billing behavior | Replaying or retrying a failed/partial job does not create a second customer debit for the same billable usage event. |
| metadata leakage | Customer API and frontend do not expose raw prompts, provider balances, provider metadata, credentials, routing weights, load weights, route IDs, or fallback internals. |
| rollback drill | Confirm stable can return to `registry.example.com/gateway:phase0-a17f3d2`, UI assets can return to phase0 assets, and canary public traffic can remain 0. |

## Final State

No production release action was executed in this documentation pass, so there is no observed post-release state.

Recommended target state after executing the plan:

- Stable image: a new Phase 2 image built from `registry.example.com/gateway:phase0-a17f3d2`; exact tag/digest must be recorded when built.
- Canary image: `registry.example.com/gateway:phase1-b93c1a8` retained only off public traffic, or canary target removed from public routing.
- Frontend assets: Phase 2 label-safe assets, with rollback to the phase0 asset bundle.
- API contract: Backward-compatible `AnalysisJobApiResponse` with separated usage/debit fields.
- ALB weights: stable 100 / canary 0 until Phase 1 is re-planned.
- Canary desired count: 0 or 1 private-only, depending on platform support; public traffic remains 0.
- Tests / smoke checks: must include UI label, API contract, frontend/backend compatibility, AI result visibility, ledger semantics, retry idempotency, and metadata leakage checks.
- Rollback target: `registry.example.com/gateway:phase0-a17f3d2` plus phase0 UI assets and canary public traffic weight 0.
- Remaining risks: The actual Phase 2 image tag, asset version, release commands, and smoke-check outputs still need to be recorded when the release is executed.
