import fs from 'node:fs';

const ide = fs.readFileSync(new URL('../src/pages/IDE.tsx', import.meta.url), 'utf8');

const checks = [
  ['CSV preview has an explicit IDE escape', ide.includes('aria-label="Back to IDE"') && ide.includes('handleReturnToScratchEditor')],
  ['CSV escape clears both file and dataset views', ide.includes("setActiveFile(null);\n    setShowDataset(null);")],
  ['Python refreshes all workspace CSVs before execution', ide.includes("files.filter((item) => item.language === 'csv')") && ide.includes('Python workspace CSVs refreshed')],
  ['Python file sync preserves exact persisted CSV bytes', ide.includes('await runtime.writeCSVToFS(file.name, file.content);')],
  ['Python notebook execution receives workspace CSVs too', ide.includes("scratchLanguage === 'python' && runtime instanceof PythonRuntime")],
  ['Python file access no longer depends on a read_csv regex', !ide.includes('const csvPattern = /pd\\.read_csv')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [label, ok] of checks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
}
if (failed.length > 0) {
  process.exitCode = 1;
  throw new Error(`CSV workspace regression guard failed: ${failed.map(([label]) => label).join(', ')}`);
}
