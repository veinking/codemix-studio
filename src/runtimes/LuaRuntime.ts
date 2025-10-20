import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';

declare global {
  interface Window {
    fengari?: {
      load(code: string): any;
      interop: any;
      lua: any;
      lauxlib: any;
      lualib: any;
    };
  }
}

export class LuaRuntime implements RuntimeExecutor {
  config: RuntimeConfig = {
    name: 'lua',
    displayName: 'Lua',
    fileExtensions: ['.lua'],
    color: 'hsl(220, 91%, 60%)',
    supportsPackages: false,
    availableOn: 'all'
  };

  isInitialized = false;
  private L: any = null;

  async initialize(isMobile: boolean): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load fengari (Lua VM in JS)
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js';
      script.async = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Lua runtime'));
        document.head.appendChild(script);
      });

      // Wait for fengari to be available
      let attempts = 0;
      while (!window.fengari && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.fengari) {
        throw new Error('Lua runtime not available');
      }

      // Create Lua state
      const { lua, lauxlib, lualib } = window.fengari;
      this.L = lauxlib.luaL_newstate();
      lualib.luaL_openlibs(this.L);

      this.isInitialized = true;
      console.log('Lua runtime initialized');
    } catch (error) {
      console.error('Failed to initialize Lua:', error);
      throw error;
    }
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.L || !window.fengari) {
      throw new Error('Lua runtime not initialized');
    }

    try {
      const { lua, lauxlib, interop } = window.fengari;
      
      // Capture print output
      let output = '';
      const wrappedCode = `
local original_print = print
local output_buffer = {}
print = function(...)
  local args = {...}
  local str = ""
  for i, v in ipairs(args) do
    if i > 1 then str = str .. "\\t" end
    str = str .. tostring(v)
  end
  table.insert(output_buffer, str)
end

local status, result = pcall(function()
  ${code}
end)

print = original_print

if not status then
  return "Error: " .. tostring(result)
else
  return table.concat(output_buffer, "\\n"), result
end
      `;

      if (lauxlib.luaL_dostring(this.L, interop.tostring(wrappedCode)) !== lua.LUA_OK) {
        const error = lua.lua_tostring(this.L, -1);
        return {
          output: '',
          error: `Lua Error: ${interop.tostring(error)}`
        };
      }

      // Get output
      if (lua.lua_gettop(this.L) > 0) {
        output = interop.tostring(lua.lua_tostring(this.L, -1)) || '';
        lua.lua_pop(this.L, 1);
      }

      const isError = output.startsWith('Error:');
      onOutput(isError ? '' : output);

      return {
        output: isError ? '' : output,
        error: isError ? output : undefined
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        output: '',
        error: `Lua Error: ${errorMsg}`
      };
    }
  }
}
