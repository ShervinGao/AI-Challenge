# AI FullStack Engineer Challenge — AI Workflow Operations Drill

> This challenge evaluates whether an AI FullStack engineer can ship a small, safe, end-to-end improvement to a customer-facing AI analysis workflow while using AI tools responsibly. AI is allowed and expected. The goal is to see whether the candidate can guide AI, reject bad suggestions, define contracts before changing behavior, and deliver a narrow frontend/backend slice with credible evidence.

## What This Challenge Is Testing

This is **not** a generic CRUD, landing page, or algorithm exercise. This repository intentionally contains ambiguous business language, a legacy-style full-stack app, a worker path, operational release pressure, and an incomplete customer-facing console that the candidate must make coherent.

We are looking for engineers who can:

- design and ship a focused frontend experience for a long-running AI workflow
- define frontend/backend API contracts before changing customer-facing behavior
- preserve billing, usage, and ledger semantics while improving labels and UX
- keep customers unaffected during urgent production changes
- use a spec-driven workflow instead of letting AI patch randomly
- identify and correct AI recommendations that would break contracts, availability, or financial semantics
- make small, surgical refactors in messy code without rewriting the system
- prove behavior with contract tests, UI/E2E evidence, command output, and release evidence

## Mandatory AI Collaboration Record

AI tools are allowed, but every meaningful AI step must be recorded in:

```text
solutions/ai-collaboration-log.md
```

The repo includes cross-IDE instructions for Codex, Claude, Cursor, Gemini, and Windsurf:

```text
AGENTS.md
CLAUDE.md
GEMINI.md
.cursor/rules/challenge.mdc
.windsurfrules
```

The collaboration log must show not just what AI suggested, but where the human accepted, rejected, or corrected the AI. A submission with no visible human correction or decision-making is a weak signal even if the code runs.

Before submitting, run:

```bash
pnpm run verify:submission
```

## Setup

```bash
nvm use
pnpm install
```

This repo intentionally keeps the service code small and messy. Do not spend your time rewriting the whole application. The most important artifacts are the spec, frontend/backend contract, release plan, semantic decisions, tests, and narrowly scoped changes.

## Scenario

You have joined the team responsible for a multi-tenant AI analysis workflow. Customers upload CSV files through the legacy app, the API records usage, a worker produces AI-assisted analysis results, and an operations console should let customers and support staff understand job status, results, failures, retries, and cost labels.

A previous engineer left behind a fragile system with overloaded terminology:

- `balance` can mean customer wallet balance, upstream provider balance, or load-balancing weight.
- `usage` can mean raw gateway usage, ledger entry, dashboard aggregate, or UI event.
- `cost` can mean official list price, customer payable debit, provider settlement, or displayed customer label.
- `stable` can mean stable API contract, stable deployment target group, stable UI assets, or a Git branch.
- `account` can mean customer account, provider account, upstream credential, or logged-in console user.
- `result` can mean raw model output, reviewed insight, dashboard aggregate, or exported report.

The challenge is not to build a new platform. The challenge is to produce the smallest safe intervention that improves the end-to-end AI workflow while preserving customer trust, financial semantics, and availability.

## Required Delivery Order

You must complete the work in this order. Do not code first.

1. **Spec first** — complete `solutions/spec.md`.
2. **AI collaboration evidence** — maintain `solutions/ai-collaboration-log.md` continuously.
3. **Semantic and contract decisions** — complete `solutions/decision-log.md` before touching ambiguous billing, usage, API, release, or customer-facing terms.
4. **Release command plan** — complete `solutions/release-command-log.md` before any release sequence.
5. **Small scoped frontend/backend code and tests** — only if your spec justifies them.
6. **Scale and operational follow-up** — complete `solutions/scale-plan.md`.
7. **Final verification** — run `pnpm run verify:submission` and paste meaningful evidence.

## Part 1 — Spec-Driven FullStack Triage

### Prompt

A support escalation arrives:

```text
Acme Team has a QBR in 60 minutes.
Their AI analysis console shows Total usage cost: $100.00.
Their team prepaid wallet was debited $40.00.
The team prepaid multiplier is 0.4.
The latest CSV analysis job is complete, but support cannot tell which result is official, which cost the customer pays, or whether a failed retry double-charged anything.
Sales says the customer will think the product is inconsistent.
Finance says we may be undercharging.
Engineering says this might be a duplicate billing path or a dashboard labeling bug.
Fix the customer-facing workflow urgently without causing downtime.
```

### Your Task

Complete `solutions/spec.md` before changing code.

The spec must include:

- current-state understanding
- source-of-truth map
- overloaded term glossary
- frontend surfaces and user flows
- backend/API contract
- UI loading, empty, success, failure, retry, and partial-result states
- suspected root cause
- explicit non-goals
- blast radius
- accessibility and metadata-leakage risks
- validation plan
- release safety plan
- what AI suggested and what you rejected or corrected

### Ambiguity Warning

The ticket intentionally uses overloaded financial, workflow, and UI terms. Do not change customer-facing behavior until your spec defines the terms and identifies the source of truth.

## Part 2 — UI/API Billing Semantics Incident

Detailed prompt: `docs/CHALLENGE_BILLING_SEMANTICS.md`

Complete:

```text
solutions/part1-billing-semantics.md
solutions/decision-log.md
```

You must answer:

- Is this a wrong debit, wrong UI label, wrong API DTO, wrong aggregate, double billing bug, or something else?
- Which object is the source of truth for customer balance?
- Which object is the source of truth for official usage reporting?
- Which object is the source of truth for reviewed AI analysis results?
- Should the prepaid multiplier affect raw usage, ledger debit, API response labels, dashboard labels, or all of them?
- Should historical ledger entries be rewritten?
- What tests prove provider balances, load-balancing weights, and internal model metadata were not touched or leaked?

### Required Evidence

- glossary for overloaded terms
- source-of-truth map
- API contract for the affected display
- UI state expectations
- tests or checks for customer balance, provider balance, load-balancing behavior, and label rendering
- explanation of any historical data treatment

## Part 3 — Interrupted Rollout: Urgent UI/API Patch During Public Canary

Detailed prompt: `docs/CHALLENGE_RELEASE_INTERRUPTION.md`

Read:

```text
ops/current-rollout-state.json
ops/urgent-phase2-ticket.md
```

Complete:

```text
solutions/part2-release-interruption.md
solutions/release-command-log.md
```

You must decide:

- whether Phase 1 should be frozen
- whether the public canary can be updated in place
- whether the urgent patch should be based on stable image A or Phase 1 canary image B
- how frontend assets and backend API compatibility are released safely
- how to keep customers unaware of the transition
- what rollback target exists at every step
- what smoke checks prove billing semantics, UI labels, and AI result visibility did not regress

### Required Evidence

- observed rollout state before the decision
- dependency analysis between Phase 1 and Phase 2
- frontend/backend compatibility matrix
- rollback target at each step
- smoke checks for availability, UI rendering, API contract, and billing semantics

## Part 4 — FullStack AI Workflow Slice

Detailed prompt: `docs/CHALLENGE_FULLSTACK_AI_WORKFLOW.md`

You must define and, if your spec justifies code changes, implement the smallest useful operations-console slice:

- show analysis jobs and statuses
- display reviewed AI results without leaking raw provider metadata
- make cost/usage labels unambiguous
- expose retry or failure handling safely
- prove at least one user path with test or recorded command evidence

The repository includes an intentionally incomplete console surface inside `apps/legacy-app` at `GET /api/console`. You must make the frontend/backend workflow coherent enough to prove at least one customer-facing path, while keeping the implementation focused and framework choices conventional.

## Part 5 — Surgical Refactor in a Messy Hot Path

Complete:

```text
solutions/refactor-plan.md
```

Rules:

- Do not rewrite the application.
- Do not introduce a parallel billing, release, AI orchestration, or frontend framework just for the challenge.
- Extract at most one focused helper/module unless your spec proves more is necessary.
- Preserve existing public behavior except the explicitly scoped fix.
- Add characterization tests before changing behavior when touching messy code.

The refactor plan must state:

- target file/function/component
- current responsibility leak
- extraction boundary
- old behavior locked by tests
- new behavior added
- why this is smaller than a rewrite

## Part 6 — Scale Plan Under Constraints

Complete:

```text
solutions/scale-plan.md
```

Scenario:

```text
An enterprise customer will upload 10GB CSV files every Monday at 9:00.
The file contains about 5 million rows.
They require AI-assisted analysis and reporting within 2 hours.
Current worker throughput is about 10 rows/second.
The operations console must show progress, partial failure buckets, and a clear degrade mode.
There is one full-stack engineer and two weeks to ship.
The CTO suggests rewriting the worker in Rust, moving everything to Kubernetes, and building a full design system.
```

You must answer:

- What is the smallest architecture change that reaches the throughput target?
- What should not be rebuilt in two weeks?
- How do you shard work, cap concurrency, and preserve idempotency?
- How does the frontend show progress, partial failures, retry status, and stale data?
- How do you keep partial failures debuggable without flooding alerts?
- What is the rollback/degrade mode if the batch falls behind?

## Submission Files

Required candidate-authored files:

```text
solutions/spec.md
solutions/ai-collaboration-log.md
solutions/decision-log.md
solutions/release-command-log.md
solutions/part1-billing-semantics.md
solutions/part2-release-interruption.md
solutions/refactor-plan.md
solutions/scale-plan.md
```

Required challenge reference:

```text
docs/CHALLENGE_FULLSTACK_AI_WORKFLOW.md
apps/legacy-app/src/console/
debug-payloads/
```

Optional but useful:

```text
solutions/test-evidence.md
```

## Scoring

| Dimension | Weight | What good looks like |
|---|---:|---|
| Spec-driven execution | 20% | Clear spec before code, explicit non-goals, source-of-truth map, validation plan |
| AI guidance and correction | 20% | Candidate catches AI semantic, release, UI, or contract mistakes and records corrections |
| FullStack product slice | 20% | Practical UI states, API contract, E2E path, accessibility, and no internal metadata leakage |
| Release and availability judgment | 15% | Correct stable/canary order, rollback targets, frontend/backend compatibility, no customer-visible unsafe step |
| Semantic correctness | 15% | Billing, usage, result, label, balance, and cost meanings are separated and preserved |
| Small refactor and scale thinking | 10% | Surgical change only, characterization tests, realistic 2-week scaling plan |

## Automatic Submission Check

Run:

```bash
pnpm run verify:submission
```

The script does not judge quality. It only checks that required evidence files exist and are not left as empty templates.

## FAQ

### Can I use AI?

Yes. You are expected to use AI. The question is whether you can guide it.

### Do I have to build a full frontend app?

You do not need to build a whole product, but this is a FullStack challenge. The repo includes an incomplete console surface inside `apps/legacy-app`, and your submission should either extend it into a verified customer-facing path or clearly justify an equivalent contract-first implementation with UI state evidence. A runnable UI with one verified path is stronger.

### Should I delete the old legacy code?

No. Treat it as inherited code. You may use it for small scoped tests or examples, but do not rewrite it just because it looks bad.

### Should I make a huge architecture cleanup?

No. A broad rewrite is a negative signal unless the spec proves it is required, which should be rare.

### What matters most?

End-to-end product judgment, semantic precision, release safety, human judgment over AI output, and small safe changes.
