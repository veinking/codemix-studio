import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const releaseBranch = "agent/bide-ios-testflight-rc2";
const activeWorkflowName = "bIDE TestFlight Checkpoint";
const activeWorkflowPath = ".github/workflows/bide-ios-testflight-dispatch.yml";
const privacyPath = "ios/BideApp/PrivacyInfo.xcprivacy";
const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();

assert.ok(fs.existsSync(privacyPath), `Missing App Store privacy manifest: ${privacyPath}`);

const privacyCheck = String.raw`
import plistlib
import sys

with open(sys.argv[1], "rb") as handle:
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

if (process.env.GITHUB_ACTIONS === "true") {
  assert.equal(process.env.GITHUB_EVENT_NAME, "workflow_dispatch", "bIDE TestFlight may only run from workflow_dispatch.");
  assert.equal(process.env.GITHUB_WORKFLOW, activeWorkflowName, `Use only ${activeWorkflowName}.`);

  const eventPath = process.env.GITHUB_EVENT_PATH ?? "";
  assert.ok(eventPath && fs.existsSync(eventPath), "GitHub workflow event payload is unavailable.");
  const event = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const sourceRef = String(event.inputs?.source_ref ?? "");
  const confirm = String(event.inputs?.confirm ?? "");
  const checkoutSHA = git(["rev-parse", "HEAD"]);
  assert.match(checkoutSHA, /^[0-9a-f]{40}$/i, "Could not resolve checked-out release SHA.");

  assert.match(sourceRef, /^[0-9a-f]{40}$/i, "TestFlight source_ref must be an exact 40-character commit SHA.");
  assert.equal(sourceRef.toLowerCase(), checkoutSHA.toLowerCase(), "source_ref does not match the checked-out release SHA.");
  if (confirm === "UPLOAD") {
    assert.equal(process.env.GITHUB_RUN_ATTEMPT ?? "1", "1", "Paid TestFlight reruns are blocked; start a fresh dispatch.");
  }

  const remoteLine = git(["ls-remote", "--heads", "origin", `refs/heads/${releaseBranch}`]);
  const currentReleaseSHA = remoteLine.split(/\s+/)[0] ?? "";
  assert.match(currentReleaseSHA, /^[0-9a-f]{40}$/i, `Could not resolve current ${releaseBranch} head.`);
  assert.equal(checkoutSHA, currentReleaseSHA, `Stale TestFlight candidate blocked: ${checkoutSHA} is not current RC head ${currentReleaseSHA}.`);

  execFileSync("git", ["fetch", "--quiet", "--no-tags", "--depth=1", "origin", "main"], { stdio: "inherit" });
  const dispatcher = execFileSync("git", ["show", `FETCH_HEAD:${activeWorkflowPath}`], { encoding: "utf8" });

  assert.match(dispatcher, /^name: bIDE TestFlight Checkpoint\s*$/m, "Live dispatcher has the wrong workflow name.");
  assert.ok(dispatcher.includes("workflow_dispatch:"), "Live TestFlight dispatcher must remain manual-only.");
  for (const forbidden of ["pull_request:", "push:", "schedule:"]) {
    assert.ok(!dispatcher.includes(forbidden), `Live TestFlight dispatcher must not contain ${forbidden}`);
  }
  assert.ok(!dispatcher.includes("default: agent/bide-ios-testflight-rc2"), "Live TestFlight input must not default to a movable branch.");

  const sourcePreflightIndex = dispatcher.indexOf("  source-preflight:");
  const testflightIndex = dispatcher.indexOf("  testflight:");
  assert.ok(sourcePreflightIndex >= 0 && testflightIndex > sourcePreflightIndex, "Paid TestFlight job must remain behind source-preflight.");

  const required = [
    "Validate immutable release request",
    "^[0-9a-fA-F]{40}$",
    "GITHUB_RUN_ATTEMPT",
    "ref: ${{ inputs.source_ref }}",
    "node scripts/validate-bide-ios-testflight.mjs",
    "needs: source-preflight",
    "if: ${{ inputs.confirm == 'UPLOAD' && github.run_attempt == 1 }}",
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
  for (const token of required) {
    assert.ok(dispatcher.includes(token), `Live TestFlight dispatcher lost required gate/capability: ${token}`);
  }

  const sourceRefCheckoutCount = dispatcher.split("ref: ${{ inputs.source_ref }}").length - 1;
  assert.ok(sourceRefCheckoutCount >= 2, "Ubuntu preflight and macOS release jobs must both check out the exact source_ref.");
  console.log(`Live TestFlight dispatcher + current RC identity passed for ${checkoutSHA}.`);
}

console.log("bIDE release-run v2 hardening validation passed.");
