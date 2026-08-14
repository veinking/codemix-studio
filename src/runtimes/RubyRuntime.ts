import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';

declare global {
  interface Window {
    'ruby-wasm-wasi'?: {
      DefaultRubyVM(module: WebAssembly.Module): Promise<{ vm: RubyVM }>;
    };
    __bideRubyWrite?: (value: unknown) => void;
  }
}

type RubyVM = {
  eval(code: string): unknown;
  evalAsync?(code: string): Promise<unknown>;
};

const RUBY_WASI_VERSION = '2.9.4';
const RUBY_SCRIPT_ID = 'bide-ruby-wasm-runtime';
const RUBY_BRIDGE_URL = `https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@${RUBY_WASI_VERSION}/dist/browser.umd.js`;
const RUBY_WASM_URL = `https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@${RUBY_WASI_VERSION}/dist/ruby+stdlib.wasm`;

function loadScriptOnce(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === 'true') return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = existing || document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load the Ruby browser bridge')), { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

async function compileWasm(url: string): Promise<WebAssembly.Module> {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Ruby WebAssembly download failed (${response.status})`);

  if (typeof WebAssembly.compileStreaming === 'function') {
    try {
      return await WebAssembly.compileStreaming(Promise.resolve(response.clone()));
    } catch {
      // Some CDNs/proxies return a non-wasm MIME type. ArrayBuffer compilation is
      // slower but avoids failing a perfectly valid module for that reason.
    }
  }

  return WebAssembly.compile(await response.arrayBuffer());
}

export class RubyRuntime implements RuntimeExecutor {
  config: RuntimeConfig = {
    name: 'ruby',
    displayName: 'Ruby',
    fileExtensions: ['.rb'],
    color: 'hsl(var(--destructive))',
    supportsPackages: false,
    availableOn: 'all',
    executionMode: 'browser',
  };

  isInitialized = false;
  private vm: RubyVM | null = null;

  async initialize(_isMobile: boolean): Promise<void> {
    if (this.isInitialized && this.vm) return;

    await loadScriptOnce(RUBY_SCRIPT_ID, RUBY_BRIDGE_URL);
    const bridge = window['ruby-wasm-wasi'];
    if (!bridge?.DefaultRubyVM) throw new Error('Ruby browser bridge did not initialize');

    const module = await compileWasm(RUBY_WASM_URL);
    const { vm } = await bridge.DefaultRubyVM(module);
    this.vm = vm;
    this.isInitialized = true;
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.vm) throw new Error('Ruby runtime not initialized');

    let output = '';
    const emit = (value: unknown) => {
      const text = String(value ?? '');
      output += text;
      const cleaned = text.replace(/\n$/, '');
      if (cleaned) onOutput(cleaned);
    };
    window.__bideRubyWrite = emit;

    const wrappedCode = `
require "js"

class BIDEOutput
  def write(value)
    text = value.to_s
    JS.global.__bideRubyWrite(text.to_js)
    text.length
  end

  def flush
  end
end

previous_stdout = $stdout
previous_stderr = $stderr
$stdout = BIDEOutput.new
$stderr = $stdout

begin
${code}
rescue Exception => error
  raise error
ensure
  $stdout = previous_stdout
  $stderr = previous_stderr
end
    `.trim();

    try {
      if (this.vm.evalAsync) await this.vm.evalAsync(wrappedCode);
      else this.vm.eval(wrappedCode);
      return { output };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { output, error: `Ruby Error: ${message}` };
    } finally {
      delete window.__bideRubyWrite;
    }
  }
}
