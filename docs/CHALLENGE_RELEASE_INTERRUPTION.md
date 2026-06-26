# Part 2: Interrupted Rollout — Urgent UI/API Fix Without Customer Impact

## Context

This part tests release-command judgment under pressure. Your answer must preserve customer-visible availability while Phase 1 is already in public canary.

The urgent change is not just backend code. It may affect API DTOs, frontend assets, dashboard labels, cached data, and customer expectations.

## Starting State

Read `ops/current-rollout-state.json` before making any release decision.

Important facts:

- Phase 1 is already in public canary.
- Canary has non-zero public traffic.
- Phase 1 has not been promoted.
- Phase 2 urgent patch has a 60-minute deadline.

## Urgent Ticket

Read `ops/urgent-phase2-ticket.md`.

The urgent change is customer-facing and semantically ambiguous. Preserve intended billing semantics while addressing the customer-facing display issue.

## Required Work Order

1. Record the current rollout state in `solutions/release-command-log.md`.
2. Decide whether Phase 1 rollout should continue, pause, or be unwound.
3. Decide whether Phase 2 is based on stable image A or Phase 1 canary image B.
4. Decide whether frontend assets and backend API changes can be deployed independently or must be coordinated.
5. Evaluate each release action against the observed public traffic state.
6. Provide a high-availability release sequence with rollback targets for UI assets, API image, stable image, and canary image.
7. Run or describe smoke checks that prove customer-visible behavior, API contract compatibility, AI result visibility, and ledger semantics.
8. Record final state in `solutions/release-command-log.md`.

## Submission Evidence

- Observed state before action.
- Decision table for candidate release actions.
- Dependency analysis between Phase 1 and Phase 2.
- Frontend/backend compatibility matrix.
- Rollback target for every step.
- Smoke and verification evidence.
