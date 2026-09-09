import assert from 'node:assert/strict';
import fs from 'node:fs';

const retired = [
  'create-checkout',
  'check-subscription',
  'cancel-subscription',
  'reactivate-subscription',
  'sync-subscription',
  'stripe-webhook',
  'delete-account',
];

const config = fs.readFileSync('supabase/config.toml', 'utf8');
const stripeDocs = fs.readFileSync('STRIPE_SETUP.md', 'utf8');
const backendDocs = fs.readFileSync('BACKEND_SETUP.md', 'utf8');
const handoffDocs = fs.readFileSync('HANDOFF.md', 'utf8');

for (const slug of retired) {
  assert.ok(
    !fs.existsSync(`supabase/functions/${slug}/index.ts`),
    `Retired standalone bIDE function must not be deployable: ${slug}`,
  );
  assert.ok(
    !config.includes(`[functions.${slug}]`),
    `Supabase config must not declare retired function: ${slug}`,
  );
}

const productionContract = `${stripeDocs}\n${backendDocs}\n${handoffDocs}`;
assert.match(
  productionContract,
  /shared PocketBI/i,
  'Billing/account documentation must point to shared PocketBI authority.',
);
assert.match(
  stripeDocs,
  /does \*\*not\*\* operate a separate Stripe subscription/i,
  'Stripe documentation must explicitly retire standalone bIDE subscriptions.',
);
assert.ok(
  !stripeDocs.includes('STRIPE_PRO_PRICE_ID'),
  'bIDE docs must not restore a standalone Stripe Pro price contract.',
);

const sourceFiles = [
  'src/pages/Account.tsx',
  'src/pages/Auth.tsx',
  'src/pages/IDE.tsx',
  'src/contexts/AuthContext.tsx',
].map((path) => fs.readFileSync(path, 'utf8')).join('\n');

for (const slug of retired) {
  assert.ok(
    !sourceFiles.includes(`functions.invoke('${slug}'`) && !sourceFiles.includes(`functions.invoke(\"${slug}\"`),
    `Web app must not call retired standalone function: ${slug}`,
  );
}

console.log('Retired bIDE standalone billing/account functions remain absent; shared PocketBI billing authority is preserved.');
