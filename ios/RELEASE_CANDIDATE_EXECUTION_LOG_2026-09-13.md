# bIDE iOS release-candidate execution log — 2026-09-13

## Protected baseline

- Source branch: `fix/bide-ios-runtime-finalize-20260913` at `0c09522`.
- Build 13 SQL/data-integrity lineage preserved from `agent/bide-ios-testflight-rc2` at `e4049c5`.
- Protected scope: CSV/XLSX import, multisheet handling, SQLite generation, joins, editable join queries, exports, row/column integrity, value fingerprints, and corruption fixtures.

## Iteration 1 — native jobs blocked before runtime execution

- Issue found: GitHub Actions run `34775969031` failed in both isolated native runtime jobs before either XCTest executed.
- Root cause: importing StoreKit introduced an ambiguous unqualified `Transaction` type lookup in `SubscriptionStore.swift`.
- Change made: qualified all StoreKit transaction references as `StoreKit.Transaction`; retargeted the temporary runtime gate to the release-candidate branch.
- Commit/branch: `6fe882c` + `52ab140` on `fix/bide-ios-release-candidate-20260913`.
- Test performed: source validators locally, followed by isolated Python/R CI on the macOS runner.
- Result: local Phase 1, Phase 2, Phase 2 integrity, XLSX/multisheet, hardware-regression, and runtime source guards passed; native CI pending.
- Remaining blocker: none; next CI must reach the actual native runtime tests.
