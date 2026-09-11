import fs from 'node:fs';

const pythonRuntime = fs.readFileSync('src/runtimes/PythonRuntime.ts', 'utf8');
const runtimeRegistry = fs.readFileSync('src/runtimes/RuntimeRegistry.ts', 'utf8');
const consolePanel = fs.readFileSync('src/components/ConsolePanel.tsx', 'utf8');

const checks = [
  [pythonRuntime.includes('export function summarizePythonRuntimeError'), 'Python runtime must expose concise error normalization.'],
  [pythonRuntime.includes('const bufferedStderr: string[] = [];'), 'Python runtime must buffer stderr until run outcome is known.'],
  [pythonRuntime.includes("} else if (msg.type === 'stderr')"), 'stderr must have its own branch instead of streaming with stdout.'],
  [!pythonRuntime.includes("msg.type === 'stdout' || msg.type === 'stderr'"), 'stdout/stderr must not share the old eager streaming branch.'],
  [pythonRuntime.includes('flushStderr(rawError);'), 'terminal Python errors must filter duplicate traceback stderr.'],
  [pythonRuntime.includes('result.error = summarizePythonRuntimeError(rawError);'), 'terminal Python errors must expose the concise summary.'],
  [runtimeRegistry.includes('if (result.error)'), 'runtime registry must normalize runtime error results.'],
  [runtimeRegistry.includes('throw new Error(result.error);'), 'runtime registry must reject failed executions exactly once.'],
  [consolePanel.includes('preservedSuccessfulOutput'), 'Console must preserve the previous successful run across automatic run-start clearing.'],
  [consolePanel.includes('/execution completed\\s*✓/i.test(message.text)'), 'Console must snapshot completed successful output immediately.'],
  [consolePanel.includes('displayedOutput.some(looksLikeError)'), 'Console must reveal last-good output when the current run is failing.'],
  [consolePanel.includes('manualClearRef'), 'Manual Clear must remain distinct from automatic run-start clearing.'],
  [consolePanel.includes('effectiveLastSuccessfulOutput'), 'Console must display preserved output through the existing last-successful UI.'],
  [consolePanel.includes('setPreservedSuccessfulOutput([]);'), 'Manual Clear must clear preserved last-good output too.'],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  console.error('Python runtime error regression failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log('Python runtime error regression passed.');
