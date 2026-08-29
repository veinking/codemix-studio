import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(`[R runtime guard] ${message}`);
};

const runtime = read('src/runtimes/RRuntime.ts');
const ide = read('src/pages/IDE.tsx');
const explorer = read('src/components/FileExplorer.tsx');
const docs = read('src/pages/docs/RDocs.tsx');
const templates = read('src/components/RTemplateLibrary.tsx');

assert(runtime.includes('captureR(executableCode'), 'R execution must use normalized source with webR captureR');
assert(runtime.includes('normalizeRSourceForExecution'), 'R runtime must normalize invalid clipboard whitespace before execution');
assert(runtime.includes("R_SPACE_EQUIVALENTS"), 'R runtime must handle visible Unicode space equivalents');
assert(runtime.includes("R_LINE_EQUIVALENTS"), 'R runtime must normalize Unicode line and paragraph separators');
assert(runtime.includes("'\\u0085', '\\u2028', '\\u2029'"), 'R runtime must cover NEL, line separator, and paragraph separator clipboard breaks');
assert(runtime.includes("R_ZERO_WIDTH_CLIPBOARD_CHARS"), 'R runtime must handle zero-width clipboard characters');
assert(runtime.includes('R_UNICODE_SPACE_PATTERN'), 'R runtime must cover all Unicode space separators outside literals/comments');
assert(runtime.includes('R_UNICODE_LINE_PATTERN'), 'R runtime must cover all Unicode line/paragraph separators outside literals/comments');
assert(runtime.includes('R_UNICODE_FORMAT_OR_CONTROL_PATTERN'), 'R runtime must remove otherwise-invalid Unicode format/control characters outside literals/comments');
assert(runtime.includes("char !== '\\t'") && runtime.includes("char !== '\\n'") && runtime.includes("char !== '\\r'"), 'R sanitizer must preserve ordinary source controls until final line-ending normalization');
assert(runtime.includes("normalizedSource.code.replace(/\\r\\n?/g, '\\n')"), 'R execution must normalize CR and CRLF source line endings to LF before webR parses text');
assert(runtime.includes("mode === 'comment'"), 'R source normalization must preserve comments');
assert(runtime.includes("mode === 'single'") && runtime.includes("mode === 'double'") && runtime.includes("mode === 'backtick'"), 'R source normalization must preserve strings and backtick names');
assert(runtime.includes('withAutoprint: true'), 'R console must autoprint bare expressions');
assert(runtime.includes('throwJsException: true'), 'R errors must propagate to IDE error handling');
assert(!runtime.includes('paste(capture.output'), 'legacy capture.output wrapper must not return');
assert(!runtime.includes('base64enc'), 'plot capture must not depend on base64enc');
assert(runtime.includes('syncCSVFiles'), 'R runtime must mirror workspace CSV files');
assert(runtime.includes('FS.writeFile'), 'R CSV mirroring must use the webR VFS');
assert(runtime.includes('installPackages([packageName])'), 'R packages must use webR binary installer');
assert(!runtime.includes("install.packages('${name}')"), 'unsafe source package interpolation must not return');
assert((ide.match(/runtime\.syncCSVFiles\(/g) || []).length >= 2, 'normal and notebook R runs must refresh CSV files');
assert(ide.includes('installedPackagesByLanguage'), 'Python and R package badges must not share one list');
assert(ide.includes('if (!runtime.isInitialized)') && ide.includes('await runtime.initialize(isMobile)'), 'package installation must initialize its runtime when needed');
assert(explorer.includes('currentLanguage={currentLanguage}'), 'Explorer package manager must follow the active language');
assert(!explorer.includes('rmarkdown'), 'unsupported R Markdown creation must stay removed');
assert(!explorer.includes('.rmd'), 'unsupported R Markdown upload must stay removed');
assert(docs.includes('webR WebAssembly repository'), 'R docs must describe browser package availability honestly');
assert(docs.includes('must be installed again after a full reload'), 'R docs must explain package session lifetime');
assert(docs.includes('Uploaded CSVs are mirrored into webR'), 'R docs must explain CSV-to-R workflow');
assert(templates.includes('Templates assume a data frame named df'), 'R templates must disclose their df/package prerequisites');

console.log('✓ R runtime workflow guard passed');
