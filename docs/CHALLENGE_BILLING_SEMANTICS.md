# Part 1: The Cost Label Incident — UI/API Semantic Debugging

## Context

The codebase and ticket intentionally use ambiguous words such as `balance`, `usage`, `cost`, `official`, `actual`, `account`, `prepaid`, `result`, and `dashboard`. Define terms before changing behavior.

This part tests whether you can separate financial truth from customer-facing labels and API contracts. A good fix may be a UI/API labeling correction, not a ledger change.

## Incident Ticket

```text
#support #finance

Acme Team purchased a team prepaid package with multiplier 0.4.

Yesterday the AI analysis console showed:
  Total usage cost: $100.00

But the team prepaid wallet was only debited:
  $40.00

The completed analysis job also shows "official result" and "actual cost" in the same panel.

Sales is worried the customer will think the product is inconsistent.
Finance is worried the usage report is wrong.
Engineering says there may be two billing paths or a dashboard DTO bug.

Please fix this urgently without changing ledger semantics unless the spec proves a ledger bug.
```

## Required Work Order

Before editing code, create or update `solutions/decision-log.md` with a glossary that distinguishes at least these concepts:

| Ambiguous term | Required distinction |
|---|---|
| `balance` | customer wallet balance vs provider account balance vs load-balancing weight |
| `usage` | raw usage event vs ledger entry vs dashboard aggregate vs UI event |
| `cost` | official list-price cost vs customer payable debit vs provider settlement vs displayed label |
| `account` | customer account vs provider account vs upstream credential vs logged-in console user |
| `prepaid` | customer package multiplier vs provider discount |
| `result` | raw model output vs reviewed insight vs exported report |
| `dashboard` | frontend label vs API DTO vs backend aggregate |

Then answer in `solutions/part1-billing-semantics.md`:

1. Is the incident a wrong debit, wrong UI label, wrong API DTO, wrong aggregate, real double-billing bug, or something else?
2. Which storage object is the source of truth for customer balance?
3. Which storage object is the source of truth for official usage reporting?
4. Which object is the source of truth for reviewed AI analysis results shown to customers?
5. Should team prepaid multiplier affect raw usage events, ledger debits, API response labels, dashboard labels, or all of them?
6. Should historical ledger entries be rewritten? Why or why not?
7. What tests prove provider balances, load-balancing weights, internal prompts, and raw provider metadata were not touched or leaked?

## Submission Evidence

- Term definitions and source-of-truth map.
- Root-cause classification.
- API response contract for the affected display.
- UI label and state expectations.
- Scope of any code change.
- Verification evidence for ledger behavior, dashboard rendering, retry behavior, and unrelated balance meanings.
