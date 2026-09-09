import { execFileSync } from "node:child_process";

const git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const log = (message) => console.log(`[vercel-ignore] ${message}`);
const skip = (message) => {
  log(`SKIP: ${message}`);
  process.exit(0);
};
const build = (message) => {
  log(`BUILD: ${message}`);
  process.exit(1);
};

try {
  const commitMessage = git(["log", "-1", "--pretty=%B"]);
  if (commitMessage.includes("[skip vercel]")) {
    skip("commit explicitly marked [skip vercel]");
  }

  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? process.env.VERCEL_COMMIT_REF ?? "";
  if (branch.startsWith("preview/")) {
    build(`deliberate preview branch ${branch}`);
  }
  if (branch && branch !== "main") {
    skip(`non-web branch ${branch}`);
  }

  let base = process.env.VERCEL_GIT_PREVIOUS_SHA ?? "";
  if (!/^[0-9a-f]{40}$/i.test(base)) {
    base = "HEAD^";
  }

  let changed;
  try {
    changed = git(["diff", "--name-only", `${base}..HEAD`])
      .split("\n")
      .map((path) => path.trim())
      .filter(Boolean);
  } catch {
    build("could not determine a trustworthy changed-file set");
  }

  if (changed.length === 0) {
    skip("no changed files relative to the previous successful deployment");
  }

  const releaseOnly = (path) =>
    path.startsWith("ios/") ||
    path.startsWith(".github/") ||
    /^scripts\/validate-bide-ios(?:-|\.)/.test(path) ||
    path === "scripts/generate-bide-appicon.mjs";

  const webRelevant = changed.filter((path) => !releaseOnly(path));
  if (webRelevant.length === 0) {
    skip(`release/native-only changes: ${changed.join(", ")}`);
  }

  build(`web-relevant changes detected: ${webRelevant.join(", ")}`);
} catch (error) {
  console.error("[vercel-ignore] Guard failed closed; allowing the build.", error);
  process.exit(1);
}
