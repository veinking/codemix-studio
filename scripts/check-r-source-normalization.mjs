import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const assert = (condition, message) => {
  if (!condition) throw new Error(`[R source normalization] ${message}`);
};

const sourcePath = 'src/runtimes/rSourceNormalization.ts';
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
const { normalizeRSourceForExecution } = module.exports;

assert(typeof normalizeRSourceForExecution === 'function', 'production normalizer must be executable');

const contaminated =
  '\u2066x\u2069 <-\u200b c(1,\u00a02,\u202f3,\u034f NA)\ufe0f\ufffc';
const normalized = normalizeRSourceForExecution(contaminated);
assert(normalized.code === 'x <- c(1, 2, 3, NA)', 'clipboard-contaminated vector source must become exact valid R');
assert(
  normalized.normalizedCount === 8,
  `all eight parser-hostile clipboard characters must be reported (found ${normalized.normalizedCount})`,
);

const lineBreak = normalizeRSourceForExecution('x <- 1\u2028x + 1');
assert(lineBreak.code === 'x <- 1\nx + 1', 'Unicode line separators must become R newlines');

const literalData = 'x <- "keep\ufffc\ufe0f"\n`keep\ufffc` <- 1\n# keep\ufffc\ufe0f\nx';
const preserved = normalizeRSourceForExecution(literalData);
assert(preserved.code === literalData, 'strings, backtick names, and comments must remain byte-for-byte intact');
assert(preserved.normalizedCount === 0, 'preserved literal/comment characters must not be reported as normalized');

const ordinarySource = 'café <- 1\n\tcafé + 1\r\n';
const ordinary = normalizeRSourceForExecution(ordinarySource);
assert(ordinary.code === ordinarySource, 'Unicode identifiers and ordinary R source controls must remain intact');
assert(ordinary.normalizedCount === 0, 'clean source must not report normalization');

console.log('✓ R source normalization executable guard passed');
