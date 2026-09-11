# bIDE iOS Human UX Follow-up

This document tracks native iPhone usability work found during the Build 13 / Python-R reconciliation pass.

## Release-critical behavior

- Python, SQL, and R must all have a real Run -> result/error path. No placeholder runtime alerts.
- Preserve the physically verified Build 13 SQL/join/export integrity baseline while runtime work proceeds.
- Reproduce and fix the local save failure reported after closing and reopening a project/file.
- Reproduce and fix unintended duplicate query files/results after reopen; intentional user-created name collisions may still receive unique names.
- Dataset preview must be visibly discoverable and reliably load on iPhone.

## Human-first UI pass

- The editor and surrounding workspace must use a coherent system background in light and dark appearance.
- Replace low-information status copy such as "Active file" with useful execution/readiness state.
- Simplify the coding accessory bar. Keep common cursor/edit/code keys immediately reachable and move secondary actions behind a clear More affordance or make shortcuts language-aware.
- Do not place maintenance operations such as "Rebuild SQL Database" at the same visual priority as ordinary import/query actions.
- Surface data preview earlier in the dataset journey; users should not need to infer that preview lives under Dataset -> SQL Table -> Preview.
- Remove internal roadmap/development wording from the customer-facing Account screen.
- Add a fast native Quick Start so a new user can run a useful Python, R, or SQL example in under a minute.

## Mobile "wow" target

The native app does not need to mirror every web bIDE feature. The target is a focused pocket IDE that feels unexpectedly capable:

1. Local Python, R, and SQL execution with clear run state and readable results.
2. Project files and imported datasets that can be used without desktop-style setup friction.
3. Fast starter examples/templates that demonstrate real capability immediately.
4. Mobile-native results/data presentation with a short path to preview, query, share, and later visualize.

Plotting and broader Python/R package support are separate capability layers and should be added only with explicit runtime/package tests rather than implied by the UI.
