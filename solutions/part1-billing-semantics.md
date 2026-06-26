# Part 1 — UI/API Billing Semantics Incident

## 1. Business Glossary

| Term | Meaning in this incident | Source of truth | Must not be confused with |
|---|---|---|---|
| customer balance | | | provider balance / load-balancing weight |
| provider balance | | | customer wallet |
| load balance | | | money |
| official cost / total cost | | | actual payable debit |
| actual cost / payable cost | | | official list price |
| raw usage event | | | ledger entry |
| ledger entry | | | dashboard aggregate |
| team prepaid multiplier | | | provider discount |
| API cost field | | | UI label / ledger column |
| dashboard label | | | source-of-truth value |
| reviewed AI result | | | raw model output / provider metadata |

## 2. Incident Classification

Is this a wrong debit, wrong UI label, wrong API DTO, wrong aggregate, double billing bug, or something else?

Answer:

## 3. Source-Of-Truth Map

```text
Gateway response / analysis job
  -> ...
```

## 4. API And UI Contract

- API fields returned:
- UI labels rendered:
- Empty/loading/error states affected:
- Internal fields that must not be exposed:
- Compatibility expectation for older frontend/backend versions:

## 5. Fix Plan

- Layer to change:
- Layers explicitly not changed:
- Historical data treatment:
- Idempotency risk:
- Customer-facing wording risk:
- Accessibility risk:

## 6. Verification Evidence

Paste command output or test evidence showing:

- official list-price usage is preserved
- payable prepaid debit is preserved
- provider balance is not touched
- load-balancing weight is not touched
- retry does not double debit
- UI renders unambiguous labels
- raw prompts, provider metadata, and internal routing data are not leaked
