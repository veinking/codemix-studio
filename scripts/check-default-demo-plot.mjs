import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ideSource = readFileSync(new URL('../src/pages/IDE.tsx', import.meta.url), 'utf8');
const workerSource = readFileSync(new URL('../public/pyWorker.js', import.meta.url), 'utf8');
const runtimeSource = readFileSync(new URL('../src/runtimes/PythonRuntime.ts', import.meta.url), 'utf8');
const plotViewerSource = readFileSync(new URL('../src/components/PlotViewer.tsx', import.meta.url), 'utf8');

const demoMatch = ideSource.match(
  /name:\s*['"]demo\.py['"][\s\S]*?content:\s*`([\s\S]*?)`\s*,\s*\n\s*}/,
);

assert.ok(demoMatch, 'Could not locate the untouched default demo.py source in IDE.tsx');
const defaultDemo = demoMatch[1];

assert.match(defaultDemo, /import\s+matplotlib\.pyplot\s+as\s+plt/, 'Default demo must exercise Matplotlib');
assert.match(defaultDemo, /plt\.plot\s*\(/, 'Default demo must create a Matplotlib figure');
assert.match(defaultDemo, /plt\.show\s*\(\s*\)/, 'Default demo must exercise the normal plt.show() path');

assert.match(
  workerSource,
  /matplotlib\.use\(["']Agg["'],\s*force=True\)/,
  'Python worker must force a DOM-free Agg Matplotlib backend',
);
assert.match(workerSource, /_bide_plt\.show\s*=\s*_bide_worker_show/, 'Worker must neutralize GUI-only plt.show()');
assert.match(workerSource, /\.savefig\([^)]*format=["']png["']/, 'Worker must serialize figures as PNG');
assert.match(workerSource, /data:image\/png;base64,/, 'Worker must produce PNG data URLs');
assert.match(workerSource, /type:\s*["']plot["']\s*,\s*dataUrl/, 'Worker must send captured plots to the main thread');
assert.doesNotMatch(
  workerSource,
  /run it in a local Python environment/,
  'Worker errors must not contradict bIDE browser-runtime support',
);

assert.match(runtimeSource, /msg\.type\s*===\s*['"]plot['"]/, 'PythonRuntime must consume plot worker messages');
assert.match(runtimeSource, /result\.plotUrl\s*=\s*msg\.dataUrl/, 'PythonRuntime must return the plot through ExecutionResult.plotUrl');
assert.doesNotMatch(
  runtimeSource,
  /msg\.type\s*===\s*['"]error['"][\s\S]{0,320}onOutput/,
  'Python runtime errors must not be streamed before RuntimeRegistry reports them',
);

assert.match(plotViewerSource, /<img[\s\S]*src=\{plotData\}/, 'Plot Viewer must render captured image data directly');
assert.match(plotViewerSource, /onLoad=\{\(\) => setIsLoading\(false\)\}/, 'Plot Viewer must clear loading when the image loads');
assert.match(plotViewerSource, /onClick=\{handleDownloadImage\}/, 'Plot Viewer must expose image download');
assert.match(plotViewerSource, />\s*Download Plot\s*</, 'Plot Viewer must label the image download distinctly from code download');
assert.doesNotMatch(
  plotViewerSource,
  /canvasRef|useRef<HTMLCanvasElement>/,
  'Plot Viewer must not reintroduce the canvas-mount loading deadlock',
);

console.log('✓ Default demo Matplotlib + Plot Viewer regression guard passed');
