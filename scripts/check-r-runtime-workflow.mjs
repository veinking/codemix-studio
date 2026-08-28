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

assert(runtime.includes('captureR(code'), 'R execution must use webR captureR');
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
