import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const exists = (path) => fs.existsSync(path);

const landing = read("src/pages/Landing.tsx");
const features = read("src/pages/Features.tsx");
const account = read("src/pages/Account.tsx");
const support = read("src/pages/Support.tsx");
const terms = read("src/pages/Terms.tsx");
const privacy = read("src/pages/Privacy.tsx");
const app = read("src/App.tsx");
const main = read("src/main.tsx");
const seo = read("src/utils/focusedSeo.ts");
const html = read("index.html");
const panel = read("src/components/SidePanel.tsx");
const drawer = read("src/components/FeatureDrawer.tsx");
const toolbar = read("src/components/Toolbar.tsx");
const guestPrompt = read("src/components/GuestPrompt.tsx");

for (const stale of ["AIUsageIndicator", "ActivityStats", "RecentActivityFeed", "Free forever", "No limits. Pure power."]) {
  assert.ok(!landing.includes(stale), `Landing must not restore stale UI/copy: ${stale}`);
}
assert.ok(landing.includes("A focused coding workspace in your browser"), "Landing must keep focused-workspace positioning.");
assert.ok(landing.includes("bring-your-own-key") && landing.includes("does not require AI"), "Landing must make optional BYOK behavior explicit.");

for (const stale of [
  "AI-Powered Tools",
  "auto-complete, scan for bugs",
  "Lab Trainer",
  "DataLab",
  "ML Operations",
  "25+ Powerful Features",
  "All these features are completely free",
  "Free forever",
]) {
  assert.ok(!features.includes(stale), `Features must not restore old everything-suite claim: ${stale}`);
}
assert.ok(features.includes("Optional Code Assist"), "Features must present AI as optional Code Assist.");
assert.ok(features.includes("Ask") && features.includes("Review") && features.includes("Complete"), "Features must retain the small BYOK action set.");
assert.ok(features.includes("No AI key is required"), "Features must say core coding does not require AI.");

assert.ok(!panel.includes("{dataLab}"), "Desktop tools must not render legacy DataLab.");
assert.ok(!drawer.includes("{dataLab}"), "Mobile tools must not render legacy DataLab.");
assert.ok(!toolbar.includes("<Languages") && !toolbar.includes("Translate code"), "Visible toolbar must not restore the legacy AI translation action.");
assert.match(guestPrompt, /=>\s*null/);
assert.ok(!guestPrompt.includes("AI Power") && !guestPrompt.includes("Unlimited"), "Guest prompt must not restore AI quota upsells.");

assert.ok(!app.includes('import Upgrade from'), "The obsolete bIDE Upgrade page must stay removed.");
assert.ok(app.includes('<Route path="/upgrade" element={<Navigate to="/account" replace />} />'), "Legacy /upgrade links must safely resolve to Account.");
assert.ok(app.includes('path="/pocketbi-handoff"') && app.includes("PocketBIHandoff"), "PocketBI handoff must survive public cleanup.");

for (const removed of [
  "src/pages/Upgrade.tsx",
  "src/components/UpgradeDialog.tsx",
  "src/components/AIUsageIndicator.tsx",
  "src/hooks/useAIFunction.ts",
]) {
  assert.ok(!exists(removed), `Obsolete AI billing/quota file must remain deleted: ${removed}`);
}

for (const stale of ["Free forever", "aggregateRating", "AI-powered code assistant", "16 programming languages"]) {
  assert.ok(!html.includes(stale), `Static crawler metadata must not contain stale claim: ${stale}`);
}
assert.ok(html.includes("Focused Browser IDE") && html.includes("bring-your-own-key Code Assist"), "Static metadata must describe the focused BYOK product.");

for (const stale of ["3 AI uses every 5 days", "Unlimited AI usage", "$7.99/month", "AI usage limits use a 5-day rolling window"]) {
  assert.ok(!terms.includes(stale), `Terms must not contain obsolete AI subscription language: ${stale}`);
}
assert.ok(terms.includes("bring-your-own-key") && terms.includes("does not currently maintain a separate AI subscription"), "Terms must describe the current BYOK/no-bIDE-AI-subscription boundary.");

for (const stale of ["Track AI usage limits per tier", "browser fingerprint to track AI usage limits", "Stripe customer ID", "AI usage records: 90 days", "Process subscriptions and payments"]) {
  assert.ok(!privacy.includes(stale), `Privacy must not contain obsolete collection/billing claim: ${stale}`);
}
assert.ok(privacy.includes("Plausible Analytics"), "Privacy must disclose current public-site analytics.");
assert.ok(privacy.includes("bring-your-own-key") && privacy.includes("Forget key"), "Privacy must describe BYOK session handling.");
assert.ok(privacy.includes("does not currently operate a separate Stripe checkout or AI-token billing flow"), "Privacy must explicitly retire the old billing model.");

assert.ok(!account.includes("AI usage") && !account.includes("Used today") && !account.includes("Remaining"), "Account must not show obsolete AI quotas.");
assert.ok(account.includes("AI is optional and bring-your-own-key"), "Account must explain the new Code Assist boundary.");

assert.ok(support.includes("support@pocketbi.app"), "Visible bIDE Support must retain the canonical PocketBI support address.");
assert.ok(support.includes("Response times vary. bIDE does not currently publish a guaranteed response-time SLA."), "Visible Support and its FAQ contract must avoid promising an unguaranteed response window.");
assert.ok(!support.includes("24-48 hours"), "Visible Support and structured FAQ data must not publish the retired 24–48 hour expectation.");
assert.ok(support.includes("Python, R, JavaScript, and SQL runtime scope"), "Support must point users to the current four-runtime documentation scope.");

assert.ok(main.includes('import "./utils/focusedSeo"'), "Focused SEO overrides must load before the app.");
for (const key of [
  "SEO_CONFIGS.landing",
  "SEO_CONFIGS.ide",
  "SEO_CONFIGS.features",
  "SEO_CONFIGS.account",
  "SEO_CONFIGS.support",
  "SEO_CONFIGS.notFound",
]) {
  assert.ok(seo.includes(key), `Focused SEO override must cover ${key}.`);
}
assert.match(seo, /SEO_CONFIGS\.support[\s\S]*PocketBI ID access[\s\S]*current support resources/,
  "Reachable Support metadata must describe current PocketBI-connected support without invented SLA promises.");
assert.doesNotMatch(seo, /24-48 hours|respond within/i,
  "Focused Support metadata must not promise a response-time SLA that the product does not guarantee.");
assert.match(seo, /SEO_CONFIGS\.notFound[\s\S]*Python, R, JavaScript and SQL/,
  "404 metadata must point users back to the four current executable V1 runtimes.");
assert.doesNotMatch(seo, /SEO_CONFIGS\.notFound[\s\S]*16 programming languages/,
  "404 metadata must not restore the retired 16-runtime promise.");

console.log("bIDE Public Cleanup V1 focused positioning, reachable Support/SEO truth, BYOK behavior, legal copy, and PocketBI handoff boundaries passed.");
