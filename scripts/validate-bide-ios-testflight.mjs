import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (path) => fs.readFileSync(path, "utf8");
const exists = (path) => fs.existsSync(path);

const projectPath = "ios/project.yml";
const privacyPath = "ios/BideApp/PrivacyInfo.xcprivacy";
const iconContentsPath = "ios/BideApp/Assets.xcassets/AppIcon.appiconset/Contents.json";
const iconPath = "ios/BideApp/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png";
const iconGeneratorPath = "scripts/generate-bide-appicon.mjs";
const uploadWorkflowPath = ".github/workflows/bide-ios-testflight.yml";
const joinBuilderPath = "ios/BideApp/Views/SQLJoinBuilderView.swift";
const resultsViewPath = "ios/BideApp/Views/SQLResultsView.swift";
const datasetsViewPath = "ios/BideApp/Views/DatasetsView.swift";
const workspaceViewPath = "ios/BideApp/Views/WorkspaceView.swift";
const projectsViewPath = "ios/BideApp/Views/ProjectsView.swift";
const rootViewPath = "ios/BideApp/RootView.swift";

assert.ok(exists(iconGeneratorPath), `TestFlight release file missing: ${iconGeneratorPath}`);
execFileSync(process.execPath, [iconGeneratorPath], { stdio: "inherit" });

for (const path of [
  projectPath,
  privacyPath,
  iconContentsPath,
  iconPath,
  uploadWorkflowPath,
  joinBuilderPath,
  resultsViewPath,
  datasetsViewPath,
  workspaceViewPath,
  projectsViewPath,
  rootViewPath,
]) {
  assert.ok(exists(path), `TestFlight release file missing: ${path}`);
}

const project = read(projectPath);
for (const token of [
  "PRODUCT_BUNDLE_IDENTIFIER: com.bideide.ios",
  "MARKETING_VERSION: 0.2.6",
  "CURRENT_PROJECT_VERSION: 9",
  "ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon",
  "ITSAppUsesNonExemptEncryption: false",
  "TARGETED_DEVICE_FAMILY: \"1,2\"",
  "UISupportedInterfaceOrientations:",
  "UISupportedInterfaceOrientations~ipad:",
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
  "UIInterfaceOrientationLandscapeLeft",
  "UIInterfaceOrientationLandscapeRight",
]) {
  assert.ok(project.includes(token), `TestFlight project configuration missing: ${token}`);
}

const privacy = read(privacyPath);
for (const token of [
  "<key>NSPrivacyTracking</key>",
  "<false/>",
  "<key>NSPrivacyCollectedDataTypes</key>",
  "NSPrivacyAccessedAPICategoryUserDefaults",
  "CA92.1",
]) {
  assert.ok(privacy.includes(token), `Privacy manifest requirement missing: ${token}`);
}

const iconContents = JSON.parse(read(iconContentsPath));
const universalIcon = iconContents.images?.find((image) => image.filename === "AppIcon-1024.png");
assert.ok(universalIcon, "AppIcon Contents.json must reference AppIcon-1024.png.");
assert.equal(universalIcon.size, "1024x1024", "App Store icon declaration must be 1024x1024.");
assert.equal(universalIcon.platform, "ios", "App Store icon must target iOS.");

const png = fs.readFileSync(iconPath);
assert.ok(png.length >= 33, "AppIcon PNG is unexpectedly small.");
assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "AppIcon must be a PNG.");
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
const bitDepth = png.readUInt8(24);
const colorType = png.readUInt8(25);
assert.equal(width, 1024, `AppIcon width must be 1024, found ${width}.`);
assert.equal(height, 1024, `AppIcon height must be 1024, found ${height}.`);
assert.ok(bitDepth > 0, "AppIcon PNG has an invalid bit depth.");
assert.ok(
  colorType !== 4 && colorType !== 6,
  `App Store icon must not contain an alpha channel; PNG color type is ${colorType}.`
);

let offset = 8;
let hasTransparencyChunk = false;
while (offset + 12 <= png.length) {
  const chunkLength = png.readUInt32BE(offset);
  const typeStart = offset + 4;
  const typeEnd = typeStart + 4;
  const chunkEnd = typeEnd + chunkLength + 4;
  assert.ok(chunkEnd <= png.length, "AppIcon PNG contains a truncated chunk.");
  const chunkType = png.toString("ascii", typeStart, typeEnd);
  if (chunkType === "tRNS") hasTransparencyChunk = true;
  offset = chunkEnd;
  if (chunkType === "IEND") break;
}
assert.ok(!hasTransparencyChunk, "App Store icon must not contain PNG tRNS transparency.");

// Hardware regression guard: do not dismiss the Join Builder and then immediately
// present a sibling result sheet. That raced on iPhone and left Last Join Result inert.
const joinBuilder = read(joinBuilderPath);
for (const token of [
  "onJoinCompleted",
  "presentedJoinReport",
  ".sheet(item: $presentedJoinReport",
  "presentedJoinReport = report",
  ".interactiveDismissDisabled(dataWorkspace.isRunningSQL)",
  ".disabled(dataWorkspace.isRunningSQL)",
]) {
  assert.ok(joinBuilder.includes(token), `Join-result lifecycle guard missing: ${token}`);
}
const runJoinStart = joinBuilder.indexOf("private func runJoin");
const createQueryStart = joinBuilder.indexOf("private func createQuery");
assert.ok(runJoinStart >= 0 && createQueryStart > runJoinStart, "Could not isolate runJoin for presentation validation.");
const runJoinBody = joinBuilder.slice(runJoinStart, createQueryStart);
assert.ok(!runJoinBody.includes("dismiss()"), "runJoin must not dismiss the Join Builder before results are presented.");
assert.ok(runJoinBody.includes("onJoinCompleted(report)"), "runJoin must persist the completed report before presentation.");

// Full-result share/save may stream and verify more than the screen preview. The
// results UI must not be dismissible mid-operation and orphan that lifecycle.
const resultsView = read(resultsViewPath);
for (const token of [
  ".interactiveDismissDisabled(isWorking)",
  "Button(\"Done\") { dismiss() }",
  ".disabled(isWorking)",
  "Preparing complete query result",
]) {
  assert.ok(resultsView.includes(token), `SQL result work-lifecycle guard missing: ${token}`);
}

const datasetsView = read(datasetsViewPath);
for (const token of [
  "onJoinCompleted: { report in",
  "lastCompletedJoinReport = report",
  "openJoinReport(report)",
  "joinResultReport = nil",
  "joinResultReport = report",
]) {
  assert.ok(datasetsView.includes(token), `Last Join Result recovery guard missing: ${token}`);
}

// A project switch while a detached data/SQL task is active is recoverable in the
// store, but it is confusing and can strand stale presentation state. Block the
// normal user-facing switch paths while database work is active.
const workspaceView = read(workspaceViewPath);
for (const token of [
  "activeProjectHasDatabaseWork",
  "hasActiveDataOperation",
  "hasActiveSQLOperation",
  ".disabled(activeProjectHasDatabaseWork)",
  "activeLanguage == .sql && dataWorkspace.isImporting",
]) {
  assert.ok(workspaceView.includes(token), `Workspace project-operation guard missing: ${token}`);
}

const projectsView = read(projectsViewPath);
for (const token of [
  "activeProjectHasDatabaseWork",
  "Finish the active project's SQL or dataset operation before switching projects.",
  ".disabled(activeProjectHasDatabaseWork)",
  "projectHasDatabaseWork",
]) {
  assert.ok(projectsView.includes(token), `Projects database-work guard missing: ${token}`);
}

// Dataset navigation/detail state is project-scoped. Recreate the Datasets root on
// project change so a Project A detail cannot remain actionable inside Project B.
const rootView = read(rootViewPath);
assert.ok(rootView.includes("@EnvironmentObject private var workspace: WorkspaceStore"), "RootView must observe active project identity.");
assert.ok(rootView.includes("DatasetsView()\n                .id(workspace.activeProjectID)"), "Datasets navigation must reset when the active project changes.");

const workflow = read(uploadWorkflowPath);
assert.ok(workflow.includes("workflow_dispatch:"), "TestFlight workflow must remain manual-only.");
for (const forbidden of ["pull_request:", "push:", "schedule:"]) {
  assert.ok(!workflow.includes(forbidden), `TestFlight workflow must not contain automatic trigger ${forbidden}`);
}
for (const token of [
  "com.bideide.ios",
  "APP_STORE_CONNECT_KEY_ID",
  "APP_STORE_CONNECT_ISSUER_ID",
  "APP_STORE_CONNECT_PRIVATE_KEY",
  "APPLE_TEAM_ID",
  "IOS_DISTRIBUTION_CERTIFICATE_BASE64",
  "BIDE_IOS_PROVISIONING_PROFILE_BASE64",
  "xcodebuild",
  "-exportArchive",
  "app-store-connect",
]) {
  assert.ok(workflow.includes(token), `TestFlight workflow capability missing: ${token}`);
}

console.log("bIDE TestFlight release validation passed.");
