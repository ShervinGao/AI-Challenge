# Part 2 - Interrupted UI/API Rollout Plan

## 1. Current State Evidence

Observed from `ops/current-rollout-state.json` and `ops/urgent-phase2-ticket.md`. No release command was executed during this documentation pass.

| Field | Observed value | Evidence source |
|---|---|---|
| stable image | `registry.example.com/gateway:phase0-a17f3d2` | `stableImage` in `ops/current-rollout-state.json` |
| canary image | `registry.example.com/gateway:phase1-b93c1a8` | `canaryImage` in `ops/current-rollout-state.json` |
| stable traffic weight | `99` | `stableTrafficWeight` in `ops/current-rollout-state.json` |
| canary traffic weight | `1` | `canaryTrafficWeight` in `ops/current-rollout-state.json` |
| canary has public traffic? | `true` | `canaryHasPublicTraffic` in `ops/current-rollout-state.json` |
| Phase 1 promoted? | No | `phase1Status` says public canary observation, not promoted |
| Phase 1 change summary | Team prepaid usage reporting labels and dashboard aggregation | `phase1ChangeSummary` in `ops/current-rollout-state.json` |
| maintenance jobs on canary | `false` | `maintenanceJobsEnabledOnCanary` in `ops/current-rollout-state.json` |
| frontend asset version | Not separately named in the provided rollout state | Treat UI assets as coupled to the gateway image unless the release system proves a separate asset manifest. |
| API contract version | Not separately named in the provided rollout state | Treat API contract compatibility as part of the gateway image and shared DTO. |
| urgent deadline | 60 minutes | `urgentPatchDeadlineMinutes` in `ops/current-rollout-state.json` |

## 2. Phase 1 Freeze Decision

- Decision: Freeze or unwind Phase 1. Do not promote Phase 1 and do not increase its public traffic.
- Reason: Phase 1 is already receiving public traffic at 1%, is not promoted, and touches team prepaid usage reporting labels and dashboard aggregation. That overlaps the urgent customer-facing billing-label incident.
- Immediate safe target: move public routing to stable 100 / canary 0 after confirming stable health/capacity.
- What must not happen next: do not update the public canary in place, do not combine Phase 1 and Phase 2 without a new compatibility review, and do not make canary image `registry.example.com/gateway:phase1-b93c1a8` the base for the urgent patch.
- Phase 1 disposition after urgent patch: keep it frozen off public traffic, then rebase/re-test it later against the Phase 2 semantic fix if the product still wants Phase 1.

## 3. Phase 2 Base Decision

Should the urgent patch be based on stable image A or Phase 1 canary image B?

- Decision: Base urgent Phase 2 on stable image A, `registry.example.com/gateway:phase0-a17f3d2`.
- Dependency evidence: Phase 1 is unpromoted and changes team prepaid usage reporting labels and dashboard aggregation. Those are semantically adjacent to the incident and should not be inherited during a 60-minute fix.
- Frontend/backend compatibility evidence: The urgent fix depends on keeping official usage cost and payable prepaid debit separate in both the API contract and frontend labels. Stable is the only known promoted base; Phase 1 may already have unverified dashboard aggregation behavior.
- Rollback target: API/stable rollback to `registry.example.com/gateway:phase0-a17f3d2`; UI rollback to the phase0 asset bundle; canary rollback is public traffic 0 with `registry.example.com/gateway:phase1-b93c1a8` retained only for later private investigation.

## 4. Dependency Analysis Between Phase 1 And Phase 2

| Area | Phase 1 observed change | Phase 2 urgent need | Dependency decision |
|---|---|---|---|
| Billing semantics | Team prepaid usage reporting labels and dashboard aggregation | Clarify official usage cost vs payable prepaid debit without ledger mutation | Keep separate. Phase 2 must not inherit unpromoted aggregation behavior. |
| Frontend labels | Possibly changed by Phase 1 | Must remove ambiguous `Total usage cost` wording for affected display | Patch from stable UI/assets or a stable-compatible asset bundle. |
| API contract | Possibly changed by Phase 1 label/aggregation work | Must expose separated usage/debit fields and labels | Preserve or add fields compatibly; do not collapse values. |
| AI result visibility | Not the stated Phase 1 focus | Must keep reviewed AI result visible and safe | Smoke test `reviewedResult` during Phase 2. |
| Ledger semantics | Must remain untouched | Must prove no historical rewrite and no duplicate retry debit | Release only after ledger/idempotency checks pass. |
| Provider/routing internals | Must remain hidden | Must not expose raw prompts, provider metadata, provider balances, credentials, routing weights, or load weights | Static/API/UI leakage checks block release. |

## 5. Frontend/Backend Compatibility Matrix

| Frontend version | Backend/API version | Safe? | Reason |
|---|---|---:|---|
| stable UI/assets from `phase0-a17f3d2` | stable API image `phase0-a17f3d2` | Operationally safe but semantically insufficient | This is the current promoted baseline, but it may still show the ambiguous customer-facing label. |
| stable UI/assets from `phase0-a17f3d2` | Phase 1 canary API image `phase1-b93c1a8` | No for urgent release | Phase 1 is unpromoted and touches prepaid labels/aggregation; mixed behavior could confuse the incident. |
| Phase 1 canary UI/assets | stable API image `phase0-a17f3d2` | No for urgent release | Public canary UI/assets may rely on Phase 1 semantics and should not be used for Phase 2. |
| Phase 1 canary UI/assets | Phase 1 canary API image `phase1-b93c1a8` | No for urgent release | It is already public canary but unpromoted; do not update or promote it in place. |
| patched Phase 2 UI/assets | stable API image `phase0-a17f3d2` | Conditional | Safe only if stable API already exposes separate official usage cost and payable prepaid debit fields, or the UI has explicit fallback behavior. Otherwise coordinate frontend and backend. |
| stable UI/assets | patched Phase 2 API | Conditional | Safe only if the API change is additive and old UI fields continue to behave exactly as before. It will not fully fix ambiguous labels if the old UI copy remains cached. |
| patched Phase 2 UI/assets | patched Phase 2 API based on `phase0-a17f3d2` | Yes after smoke checks | Preferred target: one stable-based semantic patch, verified privately, then promoted with rollback to phase0. |

## 6. High-Availability Sequence

This is a planned sequence, not a claim that commands were executed.

```text
1. Freeze Phase 1 immediately: no promotion, no traffic increase, no in-place canary update.
2. Confirm stable health and capacity for the current stable image registry.example.com/gateway:phase0-a17f3d2.
3. Unwind public canary routing to stable 100 / canary 0 so Phase 1 has no public traffic.
4. Build the urgent Phase 2 patch from stable image/source registry.example.com/gateway:phase0-a17f3d2.
5. Keep the Phase 2 API contract backward-compatible: separate official usage cost and payable prepaid debit; do not rewrite ledger semantics.
6. Deploy Phase 2 to a private or 0%-traffic target and run smoke checks for UI label, API contract, AI result visibility, ledger semantics, retry behavior, and metadata leakage.
7. Promote the stable-based Phase 2 patch to the public stable path only after smoke checks pass.
8. Keep Phase 1 canary frozen or off public traffic until it can be rebased and revalidated against Phase 2.
9. If any smoke check fails, rollback UI assets and API image to phase0 and keep public canary traffic at 0.
```

## 7. Rollback Targets At Each Step

| Step | Rollback target |
|---|---|
| Freeze Phase 1 | Current stable image `registry.example.com/gateway:phase0-a17f3d2`; do not promote Phase 1. |
| Unwind canary public traffic | Route stable 100 / canary 0. If the routing change itself fails, return to the last observed weights stable 99 / canary 1 only long enough to stabilize routing, then remove public canary again. |
| Build Phase 2 | Discard the Phase 2 build and keep stable at `registry.example.com/gateway:phase0-a17f3d2`. |
| UI asset deploy | Restore the phase0 UI asset bundle or asset manifest paired with `registry.example.com/gateway:phase0-a17f3d2`. |
| API image deploy | Roll back API/stable image to `registry.example.com/gateway:phase0-a17f3d2`. |
| Stable image promotion | Roll back stable image to `registry.example.com/gateway:phase0-a17f3d2` and route stable 100 / canary 0. |
| Canary image disposition | Keep `registry.example.com/gateway:phase1-b93c1a8` off public traffic or remove it from routing. It is not the rollback target for Phase 2 customer traffic. |

## 8. Customer-Invisibility Proof

These checks must be run before any public promotion. No command output is claimed here.

- API availability check: health and console endpoints remain available before, during, and after route changes; no customer-visible API downtime.
- Dashboard/customer-facing check: Acme's dashboard loads normally from the public stable route after canary is unwound.
- UI label check: affected display shows `Official usage cost` for `$100.00`, `Payable prepaid debit` for `$40.00`, and prepaid multiplier `0.4`; it does not use ambiguous `Total usage cost` for the wallet-debit-facing panel.
- API contract check: `GET /api/analysis/:jobId/console` returns separate `usage.officialUsageCostCents`, `usage.payablePrepaidDebitCents`, `usage.officialUsageCostLabel`, `usage.payablePrepaidDebitLabel`, `usage.prepaidMultiplier`, `status`, `reviewedResult`, and `retry`.
- AI result visibility check: completed jobs still display reviewed AI result summary/confidence; the patch does not hide `reviewedResult`.
- Billing semantic check: official usage reporting remains `$100.00`; payable prepaid debit remains `$40.00`; prepaid multiplier applies to payable debit, not raw usage or official usage reporting.
- Ledger idempotency check: no historical ledger entries are rewritten, and retry/replay of the same failed or partial job does not create a duplicate customer debit.
- Provider/internal metadata leakage check: public API/frontend does not include raw prompts, generated result payloads before review, provider balances, provider metadata, credentials, routing weights, load-balancing weights, route IDs, or fallback internals.
- Rollback check: UI assets, API image, stable image, and canary routing all have named rollback targets before release starts.

## 9. Final State

No release command was executed in this documentation pass, so the following is the required target state after executing the plan:

- Stable image: new Phase 2 image built from `registry.example.com/gateway:phase0-a17f3d2`; exact tag/digest to be recorded at build time.
- Canary image: `registry.example.com/gateway:phase1-b93c1a8` frozen off public traffic, or canary target removed from public routing.
- Frontend asset version: Phase 2 label-safe asset bundle based on phase0 assets; rollback to phase0 asset bundle.
- API contract version: stable-compatible `AnalysisJobApiResponse` preserving separate official usage cost, payable prepaid debit, reviewed AI result, and retry fields.
- ALB weights: stable 100 / canary 0 during and immediately after the urgent incident fix.
- Remaining Phase 1 disposition: frozen/unwound; later rebase Phase 1 on top of Phase 2 only after compatibility and billing semantic tests pass.
- Remaining risks: The actual release commands, Phase 2 image digest, asset manifest version, and smoke-check outputs still need to be recorded when the release is performed.
