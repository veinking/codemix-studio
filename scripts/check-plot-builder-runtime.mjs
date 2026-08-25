import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const generatorSource = readFileSync(new URL('../src/utils/plotCodeGenerator.ts', import.meta.url), 'utf8');
const builderSource = readFileSync(new URL('../src/components/PlotBuilder.tsx', import.meta.url), 'utf8');

// Generated Python must honor the worker runtime contract.
assert.doesNotMatch(
  generatorSource,
  /matplotlib_pyodide|matplotlib\.use\s*\(/,
  'Plot Builder must not override the worker-safe Matplotlib backend',
);
assert.doesNotMatch(
  generatorSource,
  /base64|BytesIO|data:image\/png;base64/,
  'Plot Builder must leave PNG capture to PythonRuntime',
);
assert.doesNotMatch(
  generatorSource,
  /local IDE|local Python|run this code locally/i,
  'Generated plotting code must not contradict bIDE browser execution',
);
assert.match(generatorSource, /plt\.show\(\)/, 'Generated Python plots must use the normal plt.show() path');
assert.match(
  generatorSource,
  /case 'box':[\s\S]*?plt\.boxplot\(df\[\$\{x\}\]\.dropna\(\)/,
  'Python box plots must use the selected single numeric X column',
);
assert.doesNotMatch(
  generatorSource,
  /case 'box':[\s\S]*?df\['\$\{yColumn\}'\]/,
  'Box plots must never generate df[undefined] from an absent Y column',
);

// Dataset names, headers and labels need safe string literals.
assert.match(generatorSource, /JSON\.stringify\(value\)/, 'Plot code strings must be safely quoted');
assert.match(generatorSource, /pd\.read_csv\(\$\{datasetLiteral\}\)/, 'Python dataset filenames must use a safe literal');
assert.match(generatorSource, /\.data\[\[\$\{x\}\]\]/, 'R plots must support non-syntactic column names');

// Builder validation must match each chart's actual requirements.
assert.match(
  builderSource,
  /requiresYColumn = \(type: ChartType\) => \['bar', 'line', 'scatter'\]\.includes\(type\)/,
  'Only bar, line and scatter should require Y',
);
assert.match(
  builderSource,
  /requiresYColumn\(chartType\) && !yColumn/,
  'Builder must reject missing Y before generation',
);
assert.match(builderSource, /\{requiresYColumn\(chartType\) && \(/, 'Y selector must only appear for charts that use Y');

// Radix Select reserves empty string for clearing; use an explicit None sentinel.
assert.doesNotMatch(builderSource, /<SelectItem value="">/, 'Plot Builder must not render an empty-value SelectItem');
assert.match(builderSource, /__none__/, 'Optional scatter grouping must use a non-empty None sentinel');

// Do not regress to the generic mobile warnings removed after Agg capture shipped.
assert.doesNotMatch(builderSource, /May not render on mobile|Mobile Warning|may not render properly on mobile/i);

// Preview must not lie about histogram/box/heatmap by rendering them as scatter charts.
assert.doesNotMatch(
  builderSource,
  /chartType === 'scatter' \|\| chartType === 'histogram' \|\| chartType === 'box' \|\| chartType === 'heatmap'/,
  'Specialized chart types must not share the scatter preview',
);
assert.match(
  builderSource,
  /Exact preview appears when you run the generated code/,
  'Specialized previews must clearly defer to the actual runtime render',
);
assert.doesNotMatch(
  builderSource,
  /<ResponsiveContainer[^>]*>\s*<>/,
  'ResponsiveContainer must receive an actual chart child rather than a fragment',
);

// Numeric suggestions must not classify leading-zero identifiers as numeric.
assert.match(builderSource, /Leading-zero IDs such as 00123 should remain categorical identifiers/);
assert.match(builderSource, /\(\?:0\|\[1-9\]\\d\*\)/, 'Numeric inference must reject integer-like leading-zero IDs');

console.log('✓ Plot Builder worker-runtime regression guard passed');
