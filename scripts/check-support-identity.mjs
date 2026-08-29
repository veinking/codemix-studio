import fs from 'node:fs';

const canonical = 'support@pocketbi.app';
const forbidden = ['support@bideide.com', 'support@proairesume.com', 'support@kcaltap.com'];
const customerFacingFiles = [
  'src/pages/Support.tsx',
  'src/pages/Privacy.tsx',
  'src/pages/Terms.tsx',
  'src/pages/Account.tsx',
];

const failures = [];

for (const file of customerFacingFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const stale of forbidden) {
    if (source.includes(stale)) failures.push(`${file} contains stale support identity ${stale}`);
  }
}

const combined = customerFacingFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
if (!combined.includes(canonical)) {
  failures.push(`Customer-facing bIDE surfaces are missing canonical support identity ${canonical}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`bIDE support identity check passed: ${canonical}`);
