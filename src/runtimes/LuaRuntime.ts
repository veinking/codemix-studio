import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';

declare global {
  interface Window {
    fengari?: {
      lua: any;
      lauxlib: any;
      lualib: any;
      to_luastring(value: string): Uint8Array;
      to_jsstring(value: Uint8Array): string;
    };
  }
}

const FENGARI_SCRIPT_ID = 'bide-fengari-runtime';
const FENGARI_URL = 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js';

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
    script.addEventListener('error', () => reject(new Error('Failed to load Lua runtime')), { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

export class LuaRuntime implements RuntimeExecutor {
  config: RuntimeConfig = {
    name: 'lua',
    displayName: 'Lua',
    fileExtensions: ['.lua'],
    color: 'hsl(220, 91%, 60%)',
    supportsPackages: false,
    availableOn: 'all',
    executionMode: 'browser',
  };

  isInitialized = false;
  private L: any = null;

  async initialize(_isMobile: boolean): Promise<void> {
    if (this.isInitialized) return;

    await loadScriptOnce(FENGARI_SCRIPT_ID, FENGARI_URL);

    const fengari = window.fengari;
    if (!fengari) throw new Error('Lua runtime loaded without exposing Fengari');

    const { lauxlib, lualib } = fengari;
    this.L = lauxlib.luaL_newstate();
    if (!this.L) throw new Error('Lua state could not be created');
    lualib.luaL_openlibs(this.L);
    this.isInitialized = true;
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.L || !window.fengari) {
      throw new Error('Lua runtime not initialized');
    }

    const { lua, lauxlib, to_luastring, to_jsstring } = window.fengari;
    lua.lua_settop(this.L, 0);

    const wrappedCode = `
local original_print = print
local output_buffer = {}
print = function(...)
  local args = {...}
  local line = ""
  for i, value in ipairs(args) do
    if i > 1 then line = line .. "\\t" end
    line = line .. tostring(value)
  end
  table.insert(output_buffer, line)
end

local ok, err = pcall(function()
${code}
end)

print = original_print
if not ok then
  return "__BIDE_ERROR__" .. tostring(err)
end
return table.concat(output_buffer, "\\n")
    `.trim();

    try {
      const status = lauxlib.luaL_dostring(this.L, to_luastring(wrappedCode));
      if (status !== lua.LUA_OK) {
        const raw = lua.lua_tostring(this.L, -1);
        const message = raw ? to_jsstring(raw) : 'Unknown Lua parser/runtime error';
        lua.lua_settop(this.L, 0);
        return { output: '', error: `Lua Error: ${message}` };
      }

      const raw = lua.lua_tostring(this.L, -1);
      const result = raw ? to_jsstring(raw) : '';
      lua.lua_settop(this.L, 0);

      if (result.startsWith('__BIDE_ERROR__')) {
        return { output: '', error: `Lua Error: ${result.slice('__BIDE_ERROR__'.length)}` };
      }

      if (result) onOutput(result);
      return { output: result };
    } catch (error) {
      lua.lua_settop(this.L, 0);
      const message = error instanceof Error ? error.message : String(error);
      return { output: '', error: `Lua Error: ${message}` };
    }
  }
}
