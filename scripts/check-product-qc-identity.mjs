import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const canonicalSupport = 'support@pocketbi.app';
const forbiddenSupportAddresses = [
  'support@bideide.com',
  'support@kcaltap.com',
  'support@proairesume.com',
];

const customerSourceRoots = ['src', 'public'];
const customerSourceFiles = ['index.html'];
const readableExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.html', '.json', '.md']);

function collectFiles(entry) {
  const fullPath = path.join(root, entry);
  if (!fs.existsSync(fullPath)) return [];
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return [fullPath];

  return fs.readdirSync(fullPath, { withFileTypes: true }).flatMap((item) => {
    const child = path.join(fullPath, item.name);
    if (item.isDirectory()) return collectFiles(path.relative(root, child));
    return readableExtensions.has(path.extname(item.name)) ? [child] : [];
  });
}

const files = [
  ...customerSourceRoots.flatMap(collectFiles),
  ...customerSourceFiles.flatMap(collectFiles),
];

const staleMatches = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const forbidden of forbiddenSupportAddresses) {
    if (text.includes(forbidden)) {
      staleMatches.push(`${path.relative(root, file)} contains ${forbidden}`);
    }
  }
}

if (staleMatches.length) {
  throw new Error(`bIDE customer-facing source contains stale support identity:\n${staleMatches.join('\n')}`);
}

for (const requiredFile of ['src/pages/Support.tsx', 'src/pages/Privacy.tsx', 'src/pages/Terms.tsx']) {
  const text = fs.readFileSync(path.join(root, requiredFile), 'utf8');
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
