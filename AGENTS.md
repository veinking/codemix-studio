# AGENTS.md

Instructions for future coding agents working in bIDE.

## GitHub Actions budget policy

GitHub Actions are a **checkpoint/release gate, not an iterative development loop**.

- Do not dispatch Actions during normal coding, exploratory debugging, or after every commit.
- Batch related fixes first and inspect source/diffs/static contracts before spending runner minutes.
- All repository workflows must remain explicit `workflow_dispatch` only unless the repository owner explicitly approves an automatic trigger.
- Never add `push`, `pull_request`, `workflow_run`, `schedule`, marker-file dispatchers, workflow-to-workflow dispatch, or workflow `git push` loops.
- Cheap Linux validation comes before macOS/Xcode. The paid native lane runs only when an exact candidate head is worth simulator/device validation.
- One candidate head should normally get one intentional checkpoint run. Batch any fixes before another run.
- If a run fails before step 1 or provides no usable logs, investigate infrastructure/billing/runner state instead of blindly rerunning.
- CI validation and TestFlight/App Store distribution are separate explicit decisions.

Before changing workflow triggers, run or inspect `scripts/validate-bide-actions-budget.mjs` and preserve its invariant.

## Product boundaries

- bIDE is a serious mobile-first data IDE for Python, SQL, and R.
- Preserve the native editor/project shell and current local project/file architecture.
- Do not expand scope into PocketBI cloud/auth/billing, remote databases, or later runtime phases unless the active phase explicitly calls for it.
- Keep iPhone usability first while preserving iPad/landscape behavior.

## Verification order

1. Inspect exact source and changed files.
2. Batch fixes and deterministic source contracts.
3. Review the exact candidate head.
4. Run the cheapest necessary manual gate.
5. Run macOS/Xcode/device packaging only when that evidence is required.
6. Physical-device acceptance remains mandatory for phase completion where documented.
