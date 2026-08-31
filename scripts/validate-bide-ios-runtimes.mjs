import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  assert.ok(fs.existsSync(path), `Missing ${path}`);
  return fs.readFileSync(path, 'utf8');
}

const project = read('ios/project.yml');
const workspace = read('ios/BideApp/Views/WorkspaceView.swift');
const app = read('ios/BideApp/BideApp.swift');
const runtimeStore = read('ios/BideApp/Runtime/CodeRuntimeStore.swift');
const runtimeHost = read('ios/RuntimeSupport/runtime-host.html');
const prepare = read('scripts/prepare-bide-ios-runtimes.mjs');

assert.match(project, /preGenCommand: node \.\.\/scripts\/prepare-bide-ios-runtimes\.mjs/);
assert.match(project, /path: BideApp\/RuntimeAssets[\s\S]*type: folder[\s\S]*buildPhase: resources/);
assert.match(project, /NSAllowsLocalNetworking: true/);

assert.match(app, /@StateObject private var codeRuntime = CodeRuntimeStore\(\)/);
assert.match(app, /\.environmentObject\(codeRuntime\)/);
assert.match(app, /\.onChange\(of: workspace\.activeProjectID\)[\s\S]*codeRuntime\.resetSession\(\)/);

assert.ok(!workspace.includes('Runtime comes next'), 'Python/R placeholder alert must stay removed.');
assert.ok(!workspace.includes('intentionally deferred'), 'Python/R deferred copy must stay removed.');
assert.match(workspace, /await codeRuntime\.execute\(code, language: activeLanguage\)/);
assert.match(workspace, /CodeRuntimeResultsView\(report: report\)/);

assert.match(runtimeStore, /func resetSession\(\)/);
assert.match(runtimeStore, /webView = nil/);
assert.match(runtimeStore, /window\.bideRuntime\.execute\(language, code\)/);
assert.match(runtimeStore, /requiredInterfaceType = \.loopback/);
assert.match(runtimeStore, /http:\/\/127\.0\.0\.1:/);
assert.match(runtimeStore, /Bundle\.main\.url\(forResource: "RuntimeAssets"/);

assert.match(runtimeHost, /\.\/pyodide\/pyodide\.mjs/);
assert.match(runtimeHost, /\.\/webr\/webr\.mjs/);
assert.match(runtimeHost, /ChannelType\.PostMessage/);
assert.match(runtimeHost, /runPythonAsync\(code\)/);
assert.match(runtimeHost, /evalRString/);
assert.ok(!runtimeHost.includes('cdn.jsdelivr.net'), 'Runtime host must not load Pyodide from a CDN.');
assert.ok(!runtimeHost.includes('webr.r-wasm.org'), 'Runtime host must not load webR from a CDN.');

assert.match(prepare, /pyodide-core-314\.0\.6\.tar\.bz2/);
assert.match(prepare, /1016c31e39ce3764d9a418cbb491a392c802c1b86ccc1367f009f5c59bf8f5fd/);
assert.match(prepare, /webr-0\.6\.0\.zip/);
assert.match(prepare, /d476e1d6e23cd6572450e2cf3b5faf93d8bd0c0284f4f8bb7b7f8aa4cd01aaf1/);

console.log('bIDE iOS Python/R runtime source guard passed.');
