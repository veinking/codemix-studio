import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const canonicalSupport = 'support@pocketbi.app';
const forbiddenSupportAddresses = [
  'support@bideide.com',
  'support@kcaltap.com',
  'support@proairesume.com',
];

const canonicalSupportFiles = [
  'src/pages/Support.tsx',
  'src/pages/Privacy.tsx',
  'src/pages/Terms.tsx',
];

for (const requiredFile of canonicalSupportFiles) {
  const text = fs.readFileSync(path.join(root, requiredFile), 'utf8');
  for (const forbidden of forbiddenSupportAddresses) {
    if (text.includes(forbidden)) {
      throw new Error(`${requiredFile} contains stale support mailbox ${forbidden}.`);
    }
  }
  if (!text.includes(canonicalSupport) || !text.includes(`mailto:${canonicalSupport}`)) {
    throw new Error(`${requiredFile} must use canonical support mailbox ${canonicalSupport}.`);
  }
}

const publicIdentityFiles = [
  'src/pages/Landing.tsx',
  'src/pages/Features.tsx',
  'index.html',
];
for (const requiredFile of publicIdentityFiles) {
  const text = fs.readFileSync(path.join(root, requiredFile), 'utf8');
  if (!text.includes('PocketBI')) {
    throw new Error(`${requiredFile} must identify bIDE as part of PocketBI.`);
  }
  if (text.includes('bIDE by CodeMix') || text.includes('"name": "bIDE by CodeMix"')) {
    throw new Error(`${requiredFile} exposes stale CodeMix customer-facing publisher identity.`);
  }
}

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!indexHtml.includes('<meta name="author" content="PocketBI"')) {
  throw new Error('index.html must publish PocketBI as the bIDE author identity.');
}
if (!indexHtml.includes('"name": "PocketBI"')) {
  throw new Error('index.html structured data must publish PocketBI as the organization.');
}

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const deploymentEnabled = vercel?.git?.deploymentEnabled;
if (
  deploymentEnabled?.main !== true ||
  deploymentEnabled?.['preview/**'] !== true ||
  deploymentEnabled?.['**'] !== false
) {
  throw new Error('Vercel Git deployment policy must allow only main and deliberate preview/** branches.');
}

console.log(`Product QC identity passed: ${canonicalSupport}; PocketBI public identity and Vercel branch deployment guard are intact.`);