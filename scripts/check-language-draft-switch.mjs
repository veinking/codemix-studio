import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const assert = (condition, message) => {
  if (!condition) throw new Error(`[Language draft switch] ${message}`);
};

const sourcePath = 'src/utils/languageDrafts.ts';
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: sourcePath,
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module }, { filename: sourcePath });
const { createLanguageDraftTransition } = module.exports;

assert(typeof createLanguageDraftTransition === 'function', 'production transition helper must be executable');

const initial = { python: '', r: '', javascript: '', sql: '' };
const toR = createLanguageDraftTransition(
  initial,
  'python',
  'print("python draft")',
  'r',
);
assert(toR.code === '', 'first switch to R must load the existing R buffer');
assert(toR.drafts.python === 'print("python draft")', 'Python model value must be saved synchronously');
assert(initial.python === '', 'draft transitions must not mutate the previous state object');

const toPython = createLanguageDraftTransition(
  toR.drafts,
  'r',
  'x <- "r draft"',
  'python',
);
assert(toPython.code === 'print("python draft")', 'returning to Python must restore its exact draft');
assert(toPython.drafts.r === 'x <- "r draft"', 'R model value must be saved synchronously');

const backToR = createLanguageDraftTransition(
  toPython.drafts,
  'python',
  toPython.code,
  'r',
);
assert(backToR.code === 'x <- "r draft"', 'returning to R must restore its exact draft');
assert(backToR.drafts.python === 'print("python draft")', 'restoring R must not overwrite the Python buffer');

console.log('✓ Language draft switch executable guard passed');
