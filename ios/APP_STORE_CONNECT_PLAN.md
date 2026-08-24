# bIDE iOS — App Store Connect / TestFlight Plan

This plan moves bIDE native testing away from repeated Sideloadly-only installs and toward a normal Apple beta-distribution path while keeping Phase 2 development batched and cost-conscious.

Verified against Apple documentation in August 2026.

## Recommended first distribution target

Use **TestFlight internal testing first**.

Why:

- installs and updates happen through TestFlight instead of repeated local sideloading;
- builds can be distributed to App Store Connect users on the team;
- the same archive/signing path becomes the foundation for later external TestFlight and App Store release;
- external beta testing can be added later when we want broader testers and are ready for Beta App Review;
- TestFlight builds remain available for 90 days.

Do **not** submit bIDE to public App Review merely to replace local device testing.

## Current native identity

- Display name: `bIDE`
- Bundle identifier in source: `com.bideide.ios`
- Platform: iOS / iPadOS
- Deployment target: iOS 17.0
- Current source version before the next intentional checkpoint: 0.2.5 build 7
- App category in source: Developer Tools
- Non-exempt encryption flag: `ITSAppUsesNonExemptEncryption = false`

The App Store Connect app record and Apple Developer identifier must use the same production bundle ID unless we explicitly decide to rename it before the first upload.

## Apple-side setup — one-time

1. Confirm `com.bideide.ios` is available/registered as an App ID in the Apple Developer account.
2. Create the bIDE app record in App Store Connect before the first upload.
3. Keep the app name `bIDE` if available.
4. Use the matching bundle ID `com.bideide.ios`.
5. Create an internal TestFlight group, for example `bIDE Internal`.
6. Add the Account Holder/developer account as an internal tester.
7. Enable automatic distribution for the internal group only after the first successful build is processing cleanly.

## Recommended build infrastructure

### Preferred long-term lane: Xcode Cloud

Apple Developer Program membership currently includes 25 Xcode Cloud compute hours per month. Xcode Cloud can build, test, archive, and distribute directly to TestFlight.

Target architecture:

`GitHub source -> Xcode Cloud checkpoint workflow -> native tests -> signed archive -> TestFlight internal group`

This should become the preferred Apple-native checkpoint lane once configured.

### GitHub Actions role after Xcode Cloud

Keep GitHub-hosted macOS builds manual-only as a fallback, not the default distribution mechanism.

Cheap/source checks can continue without creating a native archive.

## Xcode Cloud prerequisite we still need to solve

The native Xcode project is generated from `ios/project.yml` with XcodeGen and is not currently committed as a stable `.xcodeproj` in the repository.

Before turning on Xcode Cloud we need one of these reproducible strategies:

1. **Preferred if stable:** commit the generated Xcode project and keep `project.yml` authoritative, regenerating only when project structure changes; or
2. configure Xcode Cloud bootstrap scripts so the project is generated predictably before build, if the initial Xcode Cloud setup can reliably reference it.

Do not improvise this during a paid/checkpoint build. Resolve it once, document it, then keep it deterministic.

## App Store readiness already present

- SwiftUI native app shell
- iPhone + iPad target
- stable production bundle ID in project config
- archive action present in the shared `bIDE` scheme definition
- `ITSAppUsesNonExemptEncryption = false`
- native unit-test target
- no StoreKit/PocketBI cloud dependency required for the local Phase 2 core
- local source assets remain authoritative
- `PrivacyInfo.xcprivacy` added on the App Store-readiness branch for app-only `UserDefaults` access using approved reason `CA92.1`

## Release blockers to close before first TestFlight upload

### 1. App icon asset catalog

The native target currently has no committed `Assets.xcassets/AppIcon.appiconset`.

Use the approved bIDE brand direction rather than inventing a new icon:

- dark rounded-square background;
- lowercase gradient `b` mark;
- code `</>` inside the bowl;
- blue/cyan with restrained purple accents;
- no text inside the actual iOS icon.

The approved bIDE branding board exists in the user's file library and should be used as the visual source/reference.

### 2. Production signing

The existing Sideloadly package intentionally uses unsigned CI output. TestFlight requires normal Apple distribution signing/provisioning with an application identifier.

Do not store private signing certificates or raw App Store Connect private keys in the repository.

### 3. First archive validation

Before uploading the first beta archive verify:

- Release archive builds under a currently accepted Xcode version;
- bundle ID is exactly the App Store Connect record's bundle ID;
- version/build numbers are unique for the upload;
- app icon is present;
- privacy manifest is present and valid;
- Swift package dependencies resolve;
- arm64 device archive succeeds;
- native Phase 2 tests pass;
- no unsupported runtime/network capability was accidentally added.

### 4. App Store Connect metadata

Internal TestFlight does not require the full public store page to be final, but public release eventually needs:

- privacy policy URL;
- App Privacy responses;
- description/subtitle/keywords;
- support URL;
- screenshots for required device classes;
- age rating questionnaire;
- category;
- copyright/contact/review information.

For the current local-only Phase 2 native build, the intended privacy posture is no user data transmitted off-device by bIDE itself. Re-evaluate the App Privacy answers before adding PocketBI authentication, analytics, cloud sync, payments, crash/telemetry SDKs, or remote runtimes.

## Build cadence after TestFlight exists

TestFlight does **not** mean one upload per small code change.

Keep the same batching rule:

1. accumulate a meaningful fix/feature batch;
2. run source checks;
3. run native tests once;
4. create one signed archive;
5. distribute one new TestFlight build;
6. perform one complete phone/iPad acceptance session;
7. collect all failures before the next checkpoint.

## First TestFlight checkpoint scope

The first bIDE TestFlight build should be materially better than the current sideload checkpoint and include the complete Phase 2 integrity batch:

- stale registry / `.bide.sqlite` migration;
- Orders -> Customers LEFT JOIN = 27 rows / 12 columns;
- `C999` / `C888` unmatched-right behavior;
- no ordinary data-value suffix mutation;
- malformed concatenated/flattened CSV rejection;
- Join Results recovery;
- editable-query routing;
- Share Result as CSV verification;
- Save Result as Dataset verification + relaunch persistence;
- complete export beyond the 500-row preview;
- multi-sheet XLSX behavior;
- unsupported `.xls` / `.parquet` project files no longer presented as if native Phase 2 can use them;
- valid privacy manifest;
- production app icon.

## Public App Store release remains a later gate

Internal TestFlight acceptance is not public-release acceptance.

Before public release, separately audit:

- editor interaction quality on real iPhone/iPad hardware;
- crash/error recovery;
- accessibility and Dynamic Type where applicable;
- privacy policy and App Privacy answers;
- App Review guideline fit for user-authored code/runtime behavior;
- Python runtime architecture before enabling arbitrary execution/package behavior;
- final screenshots/metadata;
- support flow;
- account/entitlement behavior if it has been added by then.
