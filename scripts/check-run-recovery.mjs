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
