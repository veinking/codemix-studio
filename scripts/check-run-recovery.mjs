import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/pages/IDE.tsx', import.meta.url), 'utf8');
const start = source.indexOf('  const handleRunCode = async () => {');
const end = source.indexOf('  // Auto-open mobile console', start);
assert.ok(start > 0 && end > start);
let fail = false;
const runtime = {
  config: { displayName: 'Python', availableOn: 'all' },
  isInitialized: true,
  async execute(_code, output) {
    output(fail ? 'before-error' : 'last-good-output');
    if (fail) throw new Error('ValueError: intentional failure');
    return { plotUrl: 'data:image/png;base64,QA' };
  },
};
const ctx = {
  isRunning: false, consoleOutput: [], lastSuccessfulOutput: [],
  previousRunSucceeded: { current: false }, previousOutputLength: { current: 0 },
  currentFile: { language: 'python', content: 'print(1)' }, activeFile: 'qa.py',
  isMobile: false, deviceType: 'desktop',
  RuntimeRegistry: { get: () => runtime },
  SQLRuntime: class {}, RRuntime: class {}, PythonRuntime: class {},
  setConsoleOutput(value) { ctx.consoleOutput = value; },
  setLastSuccessfulOutput(value) { ctx.lastSuccessfulOutput = value; },
  setPlotData(value) { ctx.plotData = value; },
  setPlotCode(value) { ctx.plotCode = value; },
  setIsRunning(value) { ctx.isRunning = value; }, setHasNewOutput() {},
  addToConsole(text) { ctx.consoleOutput = [...ctx.consoleOutput, { text }]; },
  async addErrorWithExplanation(text) { ctx.consoleOutput = [...ctx.consoleOutput, { text, isError: true }]; },
  async trackActivity() {},
};
vm.createContext(ctx);
vm.runInContext(ts.transpile(source.slice(start, end) + '\nthis.run = handleRunCode;', { target: ts.ScriptTarget.ES2022 }), ctx);
await ctx.run();
assert.ok(ctx.consoleOutput.some(message => message.text === 'last-good-output'));
const goodPlot = ctx.plotData;
fail = true;
await ctx.run();
assert.ok(ctx.lastSuccessfulOutput.some(message => message.text === 'last-good-output'));
assert.equal(ctx.plotData, goodPlot, 'failed run must preserve last-good plot');
assert.ok(ctx.consoleOutput.some(message => message.text === 'before-error'));
assert.equal(ctx.consoleOutput.filter(message => message.isError).length, 1);
assert.ok(!ctx.consoleOutput.some(message => message.text.includes('Execution completed')));
await ctx.run();
assert.ok(ctx.lastSuccessfulOutput.some(message => message.text === 'last-good-output'), 'repeated failures must not replace last-good output');
fail = false;
await ctx.run();
assert.ok(ctx.consoleOutput.some(message => message.text.includes('Execution completed')));
assert.equal(ctx.isRunning, false);
console.log('Run recovery preserves successful output/plots through repeated failures and permits retry.');

const uploadStart = source.indexOf('  const handleFileUpload = async');
const uploadEnd = source.indexOf('  const parseCSVContent =', uploadStart);
const imported = [];
const uploadContext = {
  files: [], isMobile: false, dbReady: false,
  createUniqueFileName: name => name,
  getLanguageFromFileName: () => 'python',
  setFiles(update) { imported.push(...update([])); },
  setActiveFile() {}, setShowDataset() {},
  toast: { success() {}, info() {}, error() {} },
};
vm.createContext(uploadContext);
vm.runInContext(ts.transpile(source.slice(uploadStart, uploadEnd) + '\nthis.upload = handleFileUpload;', { target: ts.ScriptTarget.ES2022 }), uploadContext);
const liveList = [1, 2, 3, 4].map(n => ({ name: `qa${n}.py`, size: 10, text: async () => `print(${n})` }));
const importing = uploadContext.upload(liveList);
liveList.length = 0; // Browser input reset while the first file is being read.
await importing;
assert.equal(imported.length, 4, 'input reset must not truncate a multi-file import');
assert.deepEqual(imported.map(file => file.content), ['print(1)', 'print(2)', 'print(3)', 'print(4)']);
console.log('Multi-file import survives the picker clearing its live FileList.');
