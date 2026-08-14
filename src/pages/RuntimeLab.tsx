import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, Loader2, Play, RefreshCw, XCircle } from 'lucide-react';
import { LuaRuntime } from '@/runtimes/LuaRuntime';
import { RubyRuntime } from '@/runtimes/RubyRuntime';
import type { RuntimeExecutor } from '@/runtimes/RuntimeInterface';

type Status = 'idle' | 'initializing' | 'ready' | 'running' | 'passed' | 'failed';

type RuntimeState = {
  status: Status;
  output: string[];
  error: string;
  initMs?: number;
  runMs?: number;
};

const INITIAL_STATE: RuntimeState = { status: 'idle', output: [], error: '' };

const CASES = {
  ruby: {
    label: 'Ruby',
    code: `name = "bIDE"\nnumbers = [1, 2, 3, 4]\nputs "Hello from #{name}"\nputs numbers.map { |n| n * n }.join(", ")`,
  },
  lua: {
    label: 'Lua',
    code: `local numbers = {1, 2, 3, 4}\nlocal squares = {}\nfor i, value in ipairs(numbers) do\n  squares[i] = value * value\nend\nprint("Hello from bIDE")\nprint(table.concat(squares, ", "))`,
  },
} as const;

type Candidate = keyof typeof CASES;

export default function RuntimeLab() {
  const runtimes = useRef<Record<Candidate, RuntimeExecutor>>({
    ruby: new RubyRuntime(),
    lua: new LuaRuntime(),
  });
  const [states, setStates] = useState<Record<Candidate, RuntimeState>>({
    ruby: { ...INITIAL_STATE },
    lua: { ...INITIAL_STATE },
  });
  const [code, setCode] = useState<Record<Candidate, string>>({
    ruby: CASES.ruby.code,
    lua: CASES.lua.code,
  });

  useEffect(() => {
    const previous = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const robots = previous || document.createElement('meta');
    if (!previous) {
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    const oldContent = robots.content;
    robots.content = 'noindex, nofollow';
    document.title = 'bIDE Runtime Lab';
    return () => {
      if (previous) robots.content = oldContent;
      else robots.remove();
    };
  }, []);

  function patch(candidate: Candidate, next: Partial<RuntimeState>) {
    setStates((current) => ({
      ...current,
      [candidate]: { ...current[candidate], ...next },
    }));
  }

  async function initialize(candidate: Candidate) {
    const runtime = runtimes.current[candidate];
    if (runtime.isInitialized) {
      patch(candidate, { status: 'ready', error: '' });
      return true;
    }

    patch(candidate, { status: 'initializing', output: [], error: '', initMs: undefined, runMs: undefined });
    const started = performance.now();
    try {
      await runtime.initialize(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
      patch(candidate, { status: 'ready', initMs: Math.round(performance.now() - started) });
      return true;
    } catch (error) {
      patch(candidate, {
        status: 'failed',
        initMs: Math.round(performance.now() - started),
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async function run(candidate: Candidate) {
    const runtime = runtimes.current[candidate];
    const ready = runtime.isInitialized || await initialize(candidate);
    if (!ready) return false;

    patch(candidate, { status: 'running', output: [], error: '', runMs: undefined });
    const output: string[] = [];
    const started = performance.now();

    try {
      const result = await runtime.execute(code[candidate], (text) => {
        if (!text) return;
        output.push(text);
        patch(candidate, { output: [...output] });
      });
      const runMs = Math.round(performance.now() - started);
      if (result.error) {
        patch(candidate, { status: 'failed', output, error: result.error, runMs });
        return false;
      }
      patch(candidate, { status: 'passed', output, error: '', runMs });
      return true;
    } catch (error) {
      patch(candidate, {
        status: 'failed',
        output,
        runMs: Math.round(performance.now() - started),
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async function testBoth() {
    await run('ruby');
    await run('lua');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-5xl py-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <Button variant="ghost" asChild>
            <Link to="/ide"><ArrowLeft className="h-4 w-4 mr-2" />Back to IDE</Link>
          </Button>
          <Button onClick={testBoth}><RefreshCw className="h-4 w-4 mr-2" />Run both smoke tests</Button>
        </div>

        <div className="mb-8">
          <Badge variant="outline" className="mb-3">Internal release tool</Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Browser runtime lab</h1>
          <p className="text-muted-foreground max-w-3xl leading-7">
            Ruby and Lua stay hidden from the main language selector until initialization, output, errors, repeated runs, and mobile behavior work here. A runtime class existing in the repo is not enough to call the language ready.
          </p>
        </div>

        <Alert className="mb-6">
          <AlertTitle>What counts as a pass</AlertTitle>
          <AlertDescription>
            The runtime initializes, prints the expected output once, returns no hidden error, and can be run a second time without duplicating output or corrupting state. Test this page on the same iPhone/browser path you use for bIDE.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          {(['ruby', 'lua'] as Candidate[]).map((candidate) => (
            <RuntimeCard
              key={candidate}
              candidate={candidate}
              state={states[candidate]}
              code={code[candidate]}
              setCode={(value) => setCode((current) => ({ ...current, [candidate]: value }))}
              onInitialize={() => initialize(candidate)}
              onRun={() => run(candidate)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RuntimeCard({ candidate, state, code, setCode, onInitialize, onRun }: {
  candidate: Candidate;
  state: RuntimeState;
  code: string;
  setCode: (value: string) => void;
  onInitialize: () => void;
  onRun: () => void;
}) {
  const busy = state.status === 'initializing' || state.status === 'running';
  const passed = state.status === 'passed';
  const failed = state.status === 'failed';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {CASES[candidate].label}
              {passed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {failed && <XCircle className="h-5 w-5 text-destructive" />}
            </CardTitle>
            <CardDescription>
              Status: {state.status}{state.initMs !== undefined ? ` · init ${state.initMs} ms` : ''}{state.runMs !== undefined ? ` · run ${state.runMs} ms` : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onInitialize} disabled={busy}>
              {state.status === 'initializing' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Initialize
            </Button>
            <Button onClick={onRun} disabled={busy}>
              {state.status === 'running' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Run
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          className="w-full min-h-44 rounded-md border border-input bg-muted/30 p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="rounded-md border bg-black/35 p-3 min-h-28 font-mono text-sm whitespace-pre-wrap break-words">
          {state.output.length ? state.output.join('\n') : <span className="text-muted-foreground">No output yet.</span>}
          {state.error && <div className="text-destructive mt-2">{state.error}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
