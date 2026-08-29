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

const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const deploymentEnabled = vercel?.git?.deploymentEnabled;
if (
  deploymentEnabled?.main !== true ||
  deploymentEnabled?.['preview/**'] !== true ||
  deploymentEnabled?.['**'] !== false
) {
  throw new Error('Vercel Git deployment policy must allow only main and deliberate preview/** branches.');
}

console.log(`Product QC identity passed: ${canonicalSupport}; Vercel branch deployment guard is intact.`);
