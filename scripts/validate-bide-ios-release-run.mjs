import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const releaseBranch = "agent/bide-ios-testflight-rc2";
const activeWorkflowName = "bIDE TestFlight Checkpoint";
const activeWorkflowPath = ".github/workflows/bide-ios-testflight-dispatch.yml";
const privacyPath = "ios/BideApp/PrivacyInfo.xcprivacy";

const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

assert.ok(fs.existsSync(privacyPath), `Missing App Store privacy manifest: ${privacyPath}`);

// Parse the manifest as a real plist. String-presence checks can pass malformed XML
// or the wrong value shape; App Store validation cares about the structured payload.
const privacyCheck = String.raw`
import plistlib
import sys

path = sys.argv[1]
with open(path, "rb") as handle:
    manifest = plistlib.load(handle)

if manifest.get("NSPrivacyTracking") is not False:
    raise SystemExit("NSPrivacyTracking must be false.")
if manifest.get("NSPrivacyTrackingDomains") != []:
    raise SystemExit("NSPrivacyTrackingDomains must be an empty array for this release.")
if manifest.get("NSPrivacyCollectedDataTypes") != []:
    raise SystemExit("NSPrivacyCollectedDataTypes must be an empty array for this release.")

accessed = manifest.get("NSPrivacyAccessedAPITypes")
if not isinstance(accessed, list) or len(accessed) != 1:
    raise SystemExit("Expected exactly one required-reason API declaration.")
entry = accessed[0]
if entry.get("NSPrivacyAccessedAPIType") != "NSPrivacyAccessedAPICategoryUserDefaults":
    raise SystemExit("Unexpected required-reason API category in privacy manifest.")
if entry.get("NSPrivacyAccessedAPITypeReasons") != ["CA92.1"]:
    raise SystemExit("UserDefaults required-reason declaration must be exactly CA92.1.")

print("Structured App Store privacy manifest validation passed.")
`;
execFileSync("python3", ["-c", privacyCheck, privacyPath], { stdio: "inherit" });

// Local runs validate repository state above without requiring network access. In
// GitHub Actions, additionally prove that this is the one production dispatcher and
// that the checkout is still the current RC head. This prevents an old failed run's
// preserved exact SHA from consuming another paid macOS job after the RC advances.
if (process.env.GITHUB_ACTIONS === "true") {
  assert.equal(
    process.env.GITHUB_EVENT_NAME,
    "workflow_dispatch",
    "bIDE TestFlight validation may only run from a manual workflow_dispatch event."
  );
  assert.equal(
    process.env.GITHUB_WORKFLOW,
    activeWorkflowName,
    `Obsolete TestFlight workflow detected (${process.env.GITHUB_WORKFLOW ?? "unknown"}). Use only ${activeWorkflowName}.`
  );

  const eventPath = process.env.GITHUB_EVENT_PATH ?? "";
  assert.ok(eventPath && fs.existsSync(eventPath), "GitHub workflow event payload is unavailable.");
  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const sourceRef = String(event.inputs?.source_ref ?? "");
  const confirm = String(event.inputs?.confirm ?? "");

  const checkoutSHA = git(["rev-parse", "HEAD"]);
  assert.match(checkoutSHA, /^[0-9a-f]{40}$/i, "Could not resolve the checked-out release SHA.");

  // Paid runs must be immutable first attempts. A branch name can move between the
  // Ubuntu and macOS checkouts, and GitHub's rerun controls preserve old inputs.
  // A fresh dispatch at an exact SHA avoids both classes of release ambiguity.
  if (confirm === "UPLOAD") {
    assert.match(
      sourceRef,
      /^[0-9a-f]{40}$/i,
      "Paid TestFlight runs require source_ref to be the exact 40-character RC commit SHA, not a branch or tag."
    );
    assert.equal(
      sourceRef.toLowerCase(),
      checkoutSHA.toLowerCase(),
      `Paid TestFlight source_ref ${sourceRef} does not match checked-out SHA ${checkoutSHA}.`
    );
    assert.equal(
      process.env.GITHUB_RUN_ATTEMPT ?? "1",
      "1",
      "Paid TestFlight reruns are blocked. Start a fresh workflow dispatch at the current exact RC SHA instead."
    );
  }

  const remoteLine = git(["ls-remote", "--heads", "origin", `refs/heads/${releaseBranch}`]);
  const currentReleaseSHA = remoteLine.split(/\s+/)[0] ?? "";
  assert.match(currentReleaseSHA, /^[0-9a-f]{40}$/i, `Could not resolve current ${releaseBranch} head from origin.`);
  assert.equal(
    checkoutSHA,
    currentReleaseSHA,
    [
      `Stale TestFlight candidate blocked before macOS: checked out ${checkoutSHA},`,
      `but ${releaseBranch} is now ${currentReleaseSHA}.`,
      "Do not use Re-run failed jobs after the RC advances; dispatch the current exact SHA instead.",
    ].join(" ")
  );

  // The workflow definition lives on main while the native RC intentionally stays
  // isolated from web/main churn. Fetch only main's workflow object and validate the
  // live dispatcher that will actually control signing/archive/upload.
  execFileSync("git", ["fetch", "--quiet", "--no-tags", "--depth=1", "origin", "main"], { stdio: "inherit" });
  const dispatcher = execFileSync(
    "git",
    ["show", `FETCH_HEAD:${activeWorkflowPath}`],
    { encoding: "utf8" }
  );

  assert.match(dispatcher, /^name: bIDE TestFlight Checkpoint\s*$/m, "Live dispatcher has the wrong workflow name.");
  assert.ok(dispatcher.includes("workflow_dispatch:"), "Live TestFlight dispatcher must remain manual-only.");
  for (const forbidden of ["pull_request:", "push:", "schedule:"]) {
    assert.ok(!dispatcher.includes(forbidden), `Live TestFlight dispatcher must not contain automatic trigger ${forbidden}`);
  }

  const sourcePreflightIndex = dispatcher.indexOf("  source-preflight:");
  const testflightIndex = dispatcher.indexOf("  testflight:");
  assert.ok(sourcePreflightIndex >= 0 && testflightIndex > sourcePreflightIndex, "Paid TestFlight job must remain behind source-preflight.");

  const requiredDispatcherTokens = [
    "ref: ${{ inputs.source_ref }}",
    "node scripts/validate-bide-ios-testflight.mjs",
    "needs: source-preflight",
    "if: ${{ inputs.confirm == 'UPLOAD' }}",
    "runs-on: macos-26",
    "Xcode 26 or later is required",
    "com.bideide.ios",
    "IOS_DISTRIBUTION_CERTIFICATE_BASE64",
    "BIDE_IOS_PROVISIONING_PROFILE_BASE64",
    "security cms -D -i",
    "PROFILE_APP_ID",
    "xcodegen generate",
    "CODE_SIGNING_ALLOWED=NO test",
    "method</key><string>app-store-connect</string>",
    "Archive signed bIDE candidate",
    "Verify archived app",
    "PrivacyInfo.xcprivacy",
    "Assets.car",
    "embedded.mobileprovision",
    "xcodebuild -exportArchive",
    "-authenticationKeyPath",
    "Upload diagnostic logs",
    "Enforce checkpoint result",
    "steps.archive.outcome",
    "steps.upload.outcome",
  ];
  for (const token of requiredDispatcherTokens) {
    assert.ok(dispatcher.includes(token), `Live TestFlight dispatcher lost required release gate/capability: ${token}`);
  }

  const sourceRefCheckoutCount = dispatcher.split("ref: ${{ inputs.source_ref }}").length - 1;
  assert.ok(sourceRefCheckoutCount >= 2, "Both Ubuntu preflight and macOS release jobs must check out the requested source_ref.");

  console.log(`Live TestFlight dispatcher + current RC identity passed for ${checkoutSHA}.`);
}

console.log("bIDE release-run hardening validation passed.");
