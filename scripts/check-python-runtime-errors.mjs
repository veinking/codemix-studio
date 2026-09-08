import fs from 'node:fs';

const pythonRuntime = fs.readFileSync('src/runtimes/PythonRuntime.ts', 'utf8');
const runtimeRegistry = fs.readFileSync('src/runtimes/RuntimeRegistry.ts', 'utf8');

const checks = [
  [pythonRuntime.includes('export function summarizePythonRuntimeError'), 'Python runtime must expose concise error normalization.'],
  [pythonRuntime.includes('const bufferedStderr: string[] = [];'), 'Python runtime must buffer stderr until run outcome is known.'],
  [pythonRuntime.includes("} else if (msg.type === 'stderr')"), 'stderr must have its own branch instead of streaming with stdout.'],
  [!pythonRuntime.includes("msg.type === 'stdout' || msg.type === 'stderr'"), 'stdout/stderr must not share the old eager streaming branch.'],
  [pythonRuntime.includes('flushStderr(rawError);'), 'terminal Python errors must filter duplicate traceback stderr.'],
  [pythonRuntime.includes('result.error = summarizePythonRuntimeError(rawError);'), 'terminal Python errors must expose the concise summary.'],
  [runtimeRegistry.includes('if (result.error)'), 'runtime registry must normalize runtime error results.'],
  [runtimeRegistry.includes('throw new Error(result.error);'), 'runtime registry must reject failed executions exactly once.'],
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length) {
  console.error('Python runtime error regression failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log('Python runtime error regression passed.');
