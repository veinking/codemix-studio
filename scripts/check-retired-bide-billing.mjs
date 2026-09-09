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
const readme = fs.readFileSync('README.md', 'utf8');
const envExample = fs.readFileSync('.env.example', 'utf8');

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

const productionContract = `${stripeDocs}\n${backendDocs}\n${handoffDocs}\n${readme}`;
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

const activeSetupDocs = `${backendDocs}\n${handoffDocs}\n${readme}`;
assert.ok(
  !activeSetupDocs.includes('STRIPE_PRO_PRICE_ID'),
  'Active bIDE setup docs must not restore a standalone Stripe Pro price contract.',
);
assert.ok(
  !envExample.includes('STRIPE_PRO_PRICE_ID') && !envExample.includes('STRIPE_SECRET_KEY') && !envExample.includes('STRIPE_WEBHOOK_SECRET'),
  'bIDE env example must not invite a standalone Stripe deployment.',
);
assert.match(
  readme,
  /does \*\*not\*\* run a separate Stripe subscription stack/i,
  'README must preserve the shared PocketBI billing boundary.',
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
