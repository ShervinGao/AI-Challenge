# Surgical FullStack Refactor Plan

> Complete before touching messy hot-path code.

## 1. Target

- File:
- Function / class / component:
- Why this is in scope:

## 2. Current Responsibility Leak

Describe the smallest concrete responsibility leak. Do not propose a broad rewrite.

Examples of acceptable scope:

- extracting one display-label mapper
- extracting one API DTO builder
- extracting one idempotency helper
- extracting one status-to-UI-state helper

## 3. Characterization Test

- Existing behavior to lock:
- Test file:
- Expected failure mode if behavior changes accidentally:

## 4. Extraction Boundary

- Extracted helper / function / component:
- Inputs:
- Outputs:
- Side effects:
- Frontend/backend contract impact:
- Why this is the smallest safe boundary:

## 5. Explicitly Rejected AI Rewrite Ideas

| Suggested rewrite | Why rejected |
|---|---|
| | |

## 6. Verification

- Tests run:
- UI or API evidence:
- Command output:
- Remaining risk:
