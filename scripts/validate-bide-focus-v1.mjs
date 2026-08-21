import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const toolbar = read("src/components/Toolbar.tsx");
const panel = read("src/components/SidePanel.tsx");
const drawer = read("src/components/FeatureDrawer.tsx");
const assistant = read("src/components/AIAssistant.tsx");
const edge = read("supabase/functions/ai-code-assistant/index.ts");
const theme = read("src/index.css");
const handoff = read("src/pages/PocketBIHandoff.tsx");

assert.ok(!toolbar.includes("AIUsageIndicator"), "The primary toolbar must not carry AI quota/usage chrome.");
assert.ok(toolbar.includes("Run") && toolbar.includes("Tools") && toolbar.includes("Docs"), "Core editor actions must remain first-class.");
assert.ok(toolbar.includes("MoreHorizontal"), "Secondary editor actions should be progressively disclosed.");

for (const tab of ["data", "packages", "assist"]) {
  assert.ok(panel.includes(`value=\"${tab}\"`), `Desktop tools must retain the ${tab} tab.`);
}
assert.ok(!panel.includes('value="ml"') && !panel.includes('value="learn"') && !panel.includes('value="feedback"'), "Desktop tools must not restore the old everything-at-once tab set.");
assert.ok(drawer.includes('value="more"') && drawer.includes('value="assist"'), "Mobile tools must use the compact Assist/Data/Packages/More structure.");
assert.ok(!drawer.includes('value="ml"') && !drawer.includes('value="learn"') && !drawer.includes('value="recipes"'), "Mobile primary navigation must stay focused.");

assert.ok(assistant.includes("Code Assist · BYOK"), "AI must be presented as optional BYOK Code Assist.");
assert.ok(assistant.includes("sessionStorage"), "The BYOK key should be scoped to the browser session.");
assert.ok(assistant.includes("Forget key"), "Users need an explicit key-clearing control.");
assert.ok(!assistant.includes("setInterval") && !assistant.includes("Auto-scan") && !assistant.includes("UpgradeDialog"), "No automatic scans, bundled quota upsells, or background AI behavior may remain in Code Assist.");
assert.ok(assistant.includes("gemini-2.5-flash-lite") && assistant.includes("gemini-2.5-flash"), "Only the approved low-cost/stronger Gemini choices should be exposed.");

assert.ok(edge.includes('z.enum(["ask", "review", "complete"])'), "The relay must expose a small fixed action set.");
assert.ok(edge.includes('z.enum(["gemini-2.5-flash-lite", "gemini-2.5-flash"])'), "The relay must pin an allowlist of provider models.");
assert.ok(edge.includes('"x-goog-api-key": input.apiKey'), "BYOK must be forwarded through the provider API-key header.");
assert.ok(!edge.includes("LOVABLE_API_KEY") && !edge.includes("check_ai_usage_limit") && !edge.includes("record_ai_usage"), "The relay must not depend on a bIDE-funded provider key or legacy quota billing.");
assert.ok(!edge.includes("console.log"), "The BYOK relay must not log request/key context.");

assert.ok(!theme.includes("Synthwave Purple Theme") && !theme.includes("glow-pink"), "The default visual system must stay out of the old synthwave/neon treatment.");
assert.ok(theme.includes("Quiet technical dark theme"), "The focused technical theme marker must remain explicit.");

assert.ok(handoff.includes("pocketbi:bide:dataset") || handoff.includes("pocketbi:bide:ready"), "PocketBI browser dataset handoff must remain present while the IDE is simplified.");

console.log("bIDE Focus V1 editor-first UI, BYOK Code Assist, and PocketBI handoff boundaries passed.");
