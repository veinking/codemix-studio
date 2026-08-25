from pathlib import Path
import json


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


SQL_RUNTIME = r'''import { RuntimeExecutor, RuntimeConfig, ExecutionResult, Dataset as RuntimeDataset } from './RuntimeInterface';
import initSqlJs, { Database } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export interface SQLImportedTable {
  datasetName: string;
  tableName: string;
  columns: Array<{ name: string; type: 'INTEGER' | 'REAL' | 'TEXT' }>;
}

type SQLColumnType = 'INTEGER' | 'REAL' | 'TEXT';

export class SQLRuntime implements RuntimeExecutor {
  private SQL: any = null;
  private db: Database | null = null;
  private importedTables = new Map<string, string>();
  public isInitialized = false;

  public config: RuntimeConfig = {
    name: 'sql',
    displayName: 'SQL',
    fileExtensions: ['.sql'],
    color: 'hsl(var(--chart-4))',
    supportsPackages: false,
    availableOn: 'all',
  };

  async initialize(_isMobile: boolean): Promise<void> {
    if (this.isInitialized) return;

    this.SQL = await initSqlJs({
      // Serve the engine from the bIDE build instead of a third-party runtime CDN.
      locateFile: () => sqlWasmUrl,
    });

    this.db = new this.SQL.Database();
    this.isInitialized = true;
  }

  /**
   * Refresh workspace datasets into SQLite-managed tables.
   * Persisted CSV files remain the source of truth after reload; SQL imports do
   * not mutate the original dataset values.
   */
  syncDatasets(datasets: RuntimeDataset[]): SQLImportedTable[] {
    if (!this.isInitialized || !this.db) {
      throw new Error('SQL runtime not initialized');
    }

    const db = this.db;
    const mappings: SQLImportedTable[] = [];

    db.run('SAVEPOINT bide_dataset_sync');
    try {
      for (const tableName of this.importedTables.values()) {
        db.run(`DROP TABLE IF EXISTS ${this.quoteIdentifier(tableName)}`);
      }
      this.importedTables.clear();

      const occupiedNames = this.readExistingObjectNames();
      const reservedNames = new Set<string>();

      for (const dataset of datasets) {
        if (!dataset.headers.length) continue;

        const tableName = this.makeUniqueTableName(
          dataset.name,
          occupiedNames,
          reservedNames,
        );
        reservedNames.add(tableName.toLowerCase());

        const columns = this.makeColumns(dataset.headers, dataset.data);
        const columnSql = columns
          .map((column) => `${this.quoteIdentifier(column.name)} ${column.type}`)
          .join(', ');

        db.run(`CREATE TABLE ${this.quoteIdentifier(tableName)} (${columnSql})`);

        if (dataset.data.length > 0) {
          const placeholders = columns.map(() => '?').join(', ');
          const statement = db.prepare(
            `INSERT INTO ${this.quoteIdentifier(tableName)} VALUES (${placeholders})`,
          );

          try {
            for (const row of dataset.data) {
              const values = columns.map((column, index) =>
                this.coerceImportedValue(row[index], column.type),
              );
              statement.run(values);
            }
          } finally {
            statement.free();
          }
        }

        this.importedTables.set(dataset.name, tableName);
        mappings.push({ datasetName: dataset.name, tableName, columns });
      }

      db.run('RELEASE SAVEPOINT bide_dataset_sync');
      return mappings;
    } catch (error) {
      try {
        db.run('ROLLBACK TO SAVEPOINT bide_dataset_sync');
        db.run('RELEASE SAVEPOINT bide_dataset_sync');
      } catch {
        // Preserve the original import error.
      }
      throw error;
    }
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.db) {
      throw new Error('SQL runtime not initialized');
    }

    const result: ExecutionResult = { output: '' };

    try {
      // SQLite parses complete SQL programs correctly. Raw string splitting on
      // semicolons corrupts valid literals/comments and must not be used here.
      const queryResults = this.db.exec(code);

      if (queryResults.length > 0) {
        result.datasets = queryResults.map((table, index) => ({
          name: queryResults.length === 1 ? 'SQL Result' : `SQL Result ${index + 1}`,
          headers: table.columns,
          // Empty CSV cells are the portable export representation for SQL NULL.
          data: table.values.map((row) => row.map((value) => value == null ? '' : String(value))),
        }));

        for (const table of queryResults) {
          const output = this.formatAsTable(table.columns, table.values);
          result.output += `${output}\n\n`;
          onOutput(output);
        }
      } else {
        const modified = this.db.getRowsModified();
        const successMsg = modified > 0
          ? `Query executed successfully (${modified} row${modified === 1 ? '' : 's'} changed)`
          : 'Query executed successfully';
        result.output += `${successMsg}\n`;
        onOutput(successMsg);
      }
    } catch (error: any) {
      result.error = error.message || String(error);
      result.output += `Error: ${result.error}\n`;
      onOutput(`Error: ${result.error}`);
    }

    return result;
  }

  private readExistingObjectNames(): Set<string> {
    if (!this.db) return new Set();
    const names = new Set<string>();
    const rows = this.db.exec(
      "SELECT name FROM sqlite_master WHERE type IN ('table', 'view')",
    );
    for (const table of rows) {
      for (const row of table.values) {
        if (typeof row[0] === 'string') names.add(row[0].toLowerCase());
      }
    }
    return names;
  }

  private makeUniqueTableName(
    datasetName: string,
    occupiedNames: Set<string>,
    reservedNames: Set<string>,
  ): string {
    const withoutCsv = datasetName.replace(/\.csv(?:\s*\(\d+\))?$/i, '');
    let base = withoutCsv
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .toLowerCase();

    if (!base) base = 'dataset';
    if (/^\d/.test(base)) base = `t_${base}`;

    let candidate = base;
    let suffix = 2;
    while (
      occupiedNames.has(candidate.toLowerCase()) ||
      reservedNames.has(candidate.toLowerCase())
    ) {
      candidate = `${base}_${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private makeColumns(headers: string[], data: any[][]): Array<{ name: string; type: SQLColumnType }> {
    const used = new Set<string>();

    return headers.map((header, index) => {
      let base = String(header ?? '').replace(/\0/g, '').trim();
      if (!base) base = `column_${index + 1}`;

      let name = base;
      let suffix = 2;
      while (used.has(name.toLowerCase())) {
        name = `${base}_${suffix}`;
        suffix += 1;
      }
      used.add(name.toLowerCase());

      const values = data.map((row) => row[index]);
      return { name, type: this.inferColumnType(name, values) };
    });
  }

  private inferColumnType(header: string, values: any[]): SQLColumnType {
    // Identifiers remain text even when every observed value contains digits.
    // This protects join keys such as 00123 from lossy numeric coercion.
    const identifierLike = /(^|[^a-z0-9])(id|code|zip|postal|phone|account|sku|ssn|number|no)([^a-z0-9]|$)/i;
    if (identifierLike.test(header)) return 'TEXT';

    const nonEmpty = values
      .map((value) => value == null ? '' : String(value).trim())
      .filter((value) => value !== '');
    if (nonEmpty.length === 0) return 'TEXT';

    const canonicalInteger = /^-?(?:0|[1-9]\d*)$/;
    const canonicalNumber = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
    const precisionSafe = (value: string) => {
      const digits = value.replace(/[^0-9]/g, '').replace(/^0+/, '');
      return digits.length <= 15;
    };

    if (nonEmpty.every((value) => canonicalInteger.test(value) && precisionSafe(value))) {
      return 'INTEGER';
    }

    if (
      nonEmpty.every((value) => canonicalNumber.test(value) && precisionSafe(value)) &&
      nonEmpty.some((value) => /[.eE]/.test(value))
    ) {
      return 'REAL';
    }

    return 'TEXT';
  }

  private coerceImportedValue(value: any, type: SQLColumnType): string | number | null {
    const text = value == null ? '' : String(value);
    if (text === '') return null;
    if (type === 'INTEGER' || type === 'REAL') return Number(text);
    return text;
  }

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private formatAsTable(columns: string[], values: any[][]): string {
    if (values.length === 0) return 'No results';

    const colWidths = columns.map((col, i) => {
      const maxContentWidth = Math.max(
        col.length,
        ...values.map(row => String(row[i] ?? 'NULL').length)
      );
      return Math.min(maxContentWidth, 30);
    });

    const separator = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
    const header = '|' + columns.map((col, i) =>
      ` ${col.padEnd(colWidths[i])} `
    ).join('|') + '|';

    const rows = values.map(row =>
      '|' + row.map((val, i) => {
        const str = String(val ?? 'NULL');
        return ` ${str.substring(0, colWidths[i]).padEnd(colWidths[i])} `;
      }).join('|') + '|'
    );

    return [separator, header, separator, ...rows, separator].join('\n');
  }

  public resetDatabase(): void {
    if (this.db && this.SQL) {
      this.db.close();
      this.db = new this.SQL.Database();
      this.importedTables.clear();
    }
  }
}
'''

DATASET_VIEWER = r'''import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, FilePlus2, Code2 } from "lucide-react";

interface DatasetViewerProps {
  data: string[][];
  headers: string[];
  title?: string;
  onVisualize?: () => void;
  onExportCSV?: () => void;
  onSaveAsFile?: () => void;
  onClose?: () => void;
}

export const DatasetViewer = ({
  data,
  headers,
  title,
  onVisualize,
  onExportCSV,
  onSaveAsFile,
  onClose,
}: DatasetViewerProps) => {
  const displayLimit = 200;
  const displayData = useMemo(() => data.slice(0, displayLimit), [data]);

  return (
    <div className="h-full bg-editor border rounded flex flex-col">
      <div className="px-3 py-2 border-b border-border bg-toolbar flex flex-wrap items-center gap-2">
        <div className="min-w-0 mr-auto">
          {title && <div className="text-sm font-medium truncate">{title}</div>}
          <Badge variant="secondary" className="font-mono mt-1">
            {data.length.toLocaleString()} rows × {headers.length} cols
            {data.length > displayLimit && ` (showing first ${displayLimit})`}
          </Badge>
        </div>

        {onClose && (
          <Button size="sm" variant="outline" onClick={onClose}>
            <Code2 className="w-4 h-4 mr-2" />
            Back to Code
          </Button>
        )}
        {onSaveAsFile && (
          <Button size="sm" variant="outline" onClick={onSaveAsFile}>
            <FilePlus2 className="w-4 h-4 mr-2" />
            Save to Files
          </Button>
        )}
        {onExportCSV && (
          <Button size="sm" variant="outline" onClick={onExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
        {onVisualize && (
          <Button size="sm" variant="default" onClick={onVisualize}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Visualize
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className="text-foreground font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((_, cellIndex) => (
                  <TableCell key={cellIndex} className="text-foreground whitespace-nowrap">
                    {row[cellIndex] ?? ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
'''

SQL_GUARD = r'''import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = read('src/runtimes/SQLRuntime.ts');
const ide = read('src/pages/IDE.tsx');
const viewer = read('src/components/DatasetViewer.tsx');
const docs = read('src/pages/docs/SQLDocs.tsx');

assert.match(runtime, /sql-wasm\.wasm\?url/, 'SQL wasm must be served from the bIDE build');
assert.doesNotMatch(runtime, /https:\/\/sql\.js\.org/, 'SQL runtime must not depend on the sql.js.org runtime CDN');
assert.doesNotMatch(runtime, /code\.split\(['"];/, 'SQL must not split programs on raw semicolons');
assert.match(runtime, /this\.db\.exec\(code\)/, 'SQLite must parse the complete SQL program');
assert.match(runtime, /syncDatasets\(datasets: RuntimeDataset\[\]\)/, 'SQL must refresh workspace datasets');
assert.match(runtime, /identifierLike/, 'SQL import must protect identifier-like columns as text');
assert.match(runtime, /db\.prepare\(/, 'SQL dataset import must use prepared inserts');
assert.match(runtime, /name: queryResults\.length === 1 \? 'SQL Result'/, 'SELECT results must become structured datasets');

assert.match(ide, /runtime\.syncDatasets\(collectSQLDatasets\(\)\)/, 'IDE must load workspace data before SQL execution');
assert.match(ide, /setShowDataset\(result\.datasets\[result\.datasets\.length - 1\]\.name\)/, 'Latest SQL result must open automatically');
assert.match(ide, /onExportCSV=\{\(\) => handleExportDataset\(showDataset\)\}/, 'Result datasets must export as CSV');
assert.match(ide, /onSaveAsFile=\{\(\) => handleSaveDatasetAsFile\(showDataset\)\}/, 'Result datasets must save back to Files');
assert.match(ide, /if \(validLang\)/, 'Language-only documentation deep links must be honored');

assert.match(viewer, /Back to Code/, 'Result viewer needs an obvious path back to the editor');
assert.match(viewer, /Export CSV/, 'Result viewer needs CSV export');
assert.match(viewer, /Save to Files/, 'Result viewer needs persistence into the file workspace');

assert.match(docs, /Uploaded CSVs refresh into SQLite tables before each SQL run/, 'SQL docs must explain CSV-backed tables');
assert.match(docs, /Identifier-like columns/, 'SQL docs must explain join-key preservation');
assert.match(docs, /session-only/, 'SQL docs must explain in-memory table persistence');

console.log('✓ SQL analyst CSV → SQLite → result/export regression guard passed');
'''

Path('src/runtimes/SQLRuntime.ts').write_text(SQL_RUNTIME)
Path('src/components/DatasetViewer.tsx').write_text(DATASET_VIEWER)
Path('scripts/check-sql-analyst-workflow.mjs').write_text(SQL_GUARD)

# IDE wiring
ide_path = Path('src/pages/IDE.tsx')
s = ide_path.read_text()

old = """  const codeParam = params.get('code');
  const langParam = params.get('lang');
  
  if (codeParam && langParam) {
    try {
      const decodedCode = atob(codeParam);
      const validLang = ['python', 'r', 'javascript', 'sql'].includes(langParam) 
        ? langParam as 'python' | 'r' | 'javascript' | 'sql'
        : 'python';
      
      setScratchCode(decodedCode);
      setScratchLanguage(validLang);
      setLanguageCode(prev => ({
        ...prev,
        [validLang]: decodedCode
      }));
      window.history.replaceState({}, '', '/ide');
      toast.success('Code loaded from documentation!');
    } catch (e) {
      console.error('Failed to decode code from URL:', e);
    }
  }
"""
new = """  const codeParam = params.get('code');
  const langParam = params.get('lang');
  const validLang = langParam && ['python', 'r', 'javascript', 'sql'].includes(langParam)
    ? langParam as 'python' | 'r' | 'javascript' | 'sql'
    : null;

  if (validLang) {
    setActiveFile(null);
    setShowDataset(null);
    setScratchLanguage(validLang);

    if (codeParam) {
      try {
        const decodedCode = atob(codeParam);
        setScratchCode(decodedCode);
        setLanguageCode(prev => ({
          ...prev,
          [validLang]: decodedCode,
        }));
        toast.success('Code loaded from documentation!');
      } catch (e) {
        console.error('Failed to decode code from URL:', e);
        toast.error('Could not load the documentation example');
      }
    } else {
      setScratchCode(languageCode[validLang] || '');
    }

    window.history.replaceState({}, '', '/ide');
  }
"""
s = replace_once(s, old, new, 'language-only IDE deep link')

old = """  const parseCSV = async (content: string, fileName: string) => {
    try {
      // Prefer Papa Parse for robustness
      const res = Papa.parse<Record<string, any>>(content, {
        header: true,
        // Preserve source values exactly. Converting identifiers such as 00123
        // to numbers here destroys information before the user runs any code.
        dynamicTyping: false,
        skipEmptyLines: true,
      });
      const headers = res.meta.fields || Object.keys(res.data[0] || {});
      const data = (res.data as any[]).map(row => headers.map(h => String(row?.[h] ?? '')));
      setDatasets(prev => new Map(prev).set(fileName, { headers, data }));
      addToConsole(`✓ Loaded ${fileName}: ${data.length} rows × ${headers.length} columns`);
      
      // Write CSV to Python runtime virtual filesystem
      const runtime = RuntimeRegistry.get('python');
      if (runtime && runtime.isInitialized) {
        try {
          // @ts-ignore - writeCSVToFS exists on PythonRuntime
          await runtime.writeCSVToFS(fileName, content);
          console.log(`[IDE] Wrote ${fileName} to Pyodide FS`);
        } catch (err) {
          console.warn(`[IDE] Could not write ${fileName} to Pyodide FS:`, err);
        }
      }
    } catch (e) {
      // Never fall back to splitting on commas: quoted commas/newlines are
      // valid CSV and a naive parser can silently change the user's data.
      console.error(`[IDE] Failed to parse ${fileName}:`, e);
      addToConsole(`✗ Failed to parse ${fileName} safely`, true);
      toast.error(`Could not parse ${fileName} safely`);
    }
  };
"""
new = """  const parseCSVContent = (content: string): Dataset => {
    const res = Papa.parse<Record<string, any>>(content, {
      header: true,
      // Preserve source strings here. SQL performs separate conservative type
      // inference without mutating the persisted CSV source.
      dynamicTyping: false,
      skipEmptyLines: true,
    });
    const headers = res.meta.fields || Object.keys(res.data[0] || {});
    const data = (res.data as any[]).map(row => headers.map(h => String(row?.[h] ?? '')));
    return { headers, data };
  };

  const parseCSV = async (content: string, fileName: string) => {
    try {
      const { headers, data } = parseCSVContent(content);
      setDatasets(prev => new Map(prev).set(fileName, { headers, data }));
      addToConsole(`✓ Loaded ${fileName}: ${data.length} rows × ${headers.length} columns`);
      
      // Write CSV to Python runtime virtual filesystem
      const runtime = RuntimeRegistry.get('python');
      if (runtime && runtime.isInitialized) {
        try {
          // @ts-ignore - writeCSVToFS exists on PythonRuntime
          await runtime.writeCSVToFS(fileName, content);
          console.log(`[IDE] Wrote ${fileName} to Pyodide FS`);
        } catch (err) {
          console.warn(`[IDE] Could not write ${fileName} to Pyodide FS:`, err);
        }
      }
    } catch (e) {
      // Never fall back to splitting on commas: quoted commas/newlines are
      // valid CSV and a naive parser can silently change the user's data.
      console.error(`[IDE] Failed to parse ${fileName}:`, e);
      addToConsole(`✗ Failed to parse ${fileName} safely`, true);
      toast.error(`Could not parse ${fileName} safely`);
    }
  };

  const collectSQLDatasets = () => {
    const workspaceDatasets: Array<{ name: string; headers: string[]; data: string[][] }> = [];
    const sourceDatasetNames = new Set<string>();
    const duplicateCounts = new Map<string, number>();

    // Reparse persisted CSV bytes so SQL works immediately after reload, even
    // before the user reopens every CSV preview.
    for (const file of files) {
      if (file.language !== 'csv') continue;
      const count = (duplicateCounts.get(file.name) || 0) + 1;
      duplicateCounts.set(file.name, count);
      const datasetName = count === 1 ? file.name : `${file.name} (${count})`;
      const parsed = parseCSVContent(file.content);
      workspaceDatasets.push({ name: datasetName, ...parsed });
      sourceDatasetNames.add(file.name);
    }

    // Data Lab datasets can participate too, but previous SQL result views do
    // not silently become new source tables on the next run.
    datasets.forEach((dataset, name) => {
      if (sourceDatasetNames.has(name) || name.startsWith('SQL Result')) return;
      workspaceDatasets.push({ name, headers: dataset.headers, data: dataset.data });
    });

    return workspaceDatasets;
  };
"""
s = replace_once(s, old, new, 'CSV parser + SQL dataset collector')

s = replace_once(
    s,
    'addToConsole("✗ This is a CSV preview. Switch to \'Write Code\' to run Python or R.");',
    'addToConsole("✗ This is a CSV preview. Switch to \'Write Code\' to run code against the workspace.");',
    'CSV preview run message',
)

old = """    // Execute code
    addToConsole(`>>> Running ${runtime.config.displayName} code...`);
    
    // If Python runtime, check for CSV references and write them to virtual FS
"""
new = """    // Refresh workspace datasets into SQLite before each SQL run.
    if (language === 'sql' && runtime instanceof SQLRuntime) {
      try {
        const mappings = runtime.syncDatasets(collectSQLDatasets());
        if (mappings.length > 0) {
          addToConsole(
            `✓ SQL tables refreshed: ${mappings
              .map(({ datasetName, tableName }) => `${datasetName} → ${tableName}`)
              .join(', ')}`,
          );
        }
      } catch (error: any) {
        addToConsole(`✗ Failed to prepare SQL workspace tables: ${error.message}`, true);
        setIsRunning(false);
        return;
      }
    }

    // Execute code
    addToConsole(`>>> Running ${runtime.config.displayName} code...`);
    
    // If Python runtime, check for CSV references and write them to virtual FS
"""
s = replace_once(s, old, new, 'SQL dataset sync before execution')

old = """      // Handle datasets (for SQL queries)
      if (result.datasets && result.datasets.length > 0) {
        result.datasets.forEach(ds => {
          setDatasets(prev => new Map(prev).set(ds.name, {
            headers: ds.headers,
            data: ds.data
          }));
        });
      }
"""
new = """      // Structured query results become inspectable/exportable datasets.
      if (result.datasets && result.datasets.length > 0) {
        const nextDatasets = new Map(datasets);
        result.datasets.forEach(ds => {
          nextDatasets.set(ds.name, {
            headers: ds.headers,
            data: ds.data,
          });
        });
        setDatasets(nextDatasets);
        setShowDataset(result.datasets[result.datasets.length - 1].name);
      }
"""
s = replace_once(s, old, new, 'structured SQL result handling')

old = """    let capturedOutput = '';
    const result = await runtime.execute(code, (text) => {
"""
new = """    if (scratchLanguage === 'sql' && runtime instanceof SQLRuntime) {
      runtime.syncDatasets(collectSQLDatasets());
    }

    let capturedOutput = '';
    const result = await runtime.execute(code, (text) => {
"""
s = replace_once(s, old, new, 'notebook SQL dataset sync')

old = """  const currentFile = files.find((f) => f.id === activeFile);
  const currentDataset = showDataset ? datasets.get(showDataset) : null;
"""
new = """  const handleExportDataset = (datasetName: string) => {
    const dataset = datasets.get(datasetName);
    if (!dataset) return;
    const csv = Papa.unparse([dataset.headers, ...dataset.data]);
    const baseName = datasetName
      .replace(/\\.csv$/i, '')
      .replace(/[^A-Za-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'dataset';
    saveAs(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      `${baseName}.csv`,
    );
    toast.success(`Exported ${baseName}.csv`);
  };

  const handleSaveDatasetAsFile = async (datasetName: string) => {
    const dataset = datasets.get(datasetName);
    if (!dataset) return;
    const baseName = datasetName
      .replace(/\\.csv$/i, '')
      .replace(/[^A-Za-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'dataset';
    const requestedName = prompt('Save result as:', `${baseName}.csv`);
    if (!requestedName) return;
    const fileName = requestedName.toLowerCase().endsWith('.csv')
      ? requestedName
      : `${requestedName}.csv`;
    const csv = Papa.unparse([dataset.headers, ...dataset.data]);
    await handleCreateFile(fileName, csv);
    await parseCSV(csv, fileName);
    setShowDataset(fileName);
    setCsvViewMode('data');
    toast.success(`Saved ${fileName} to Files`);
  };

  const currentFile = files.find((f) => f.id === activeFile);
  const currentDataset = showDataset ? datasets.get(showDataset) : null;
"""
s = replace_once(s, old, new, 'dataset export/save handlers')

old = """              {currentDataset && (
                <DatasetViewer
                  headers={currentDataset.headers}
                  data={currentDataset.data}
                  onVisualize={() => setPlotBuilderOpen(true)}
                />
              )}
"""
new = """              {currentDataset && (
                <DatasetViewer
                  title={currentFile.name}
                  headers={currentDataset.headers}
                  data={currentDataset.data}
                  onVisualize={() => setPlotBuilderOpen(true)}
                />
              )}
"""
s = replace_once(s, old, new, 'CSV source viewer title')

old = """    ) : currentDataset ? (
      <DatasetViewer
        headers={currentDataset.headers}
        data={currentDataset.data}
        onVisualize={() => setPlotBuilderOpen(true)}
      />
    ) : (
"""
new = """    ) : currentDataset && showDataset ? (
      <DatasetViewer
        title={showDataset}
        headers={currentDataset.headers}
        data={currentDataset.data}
        onVisualize={() => setPlotBuilderOpen(true)}
        onExportCSV={() => handleExportDataset(showDataset)}
        onSaveAsFile={() => handleSaveDatasetAsFile(showDataset)}
        onClose={() => setShowDataset(null)}
      />
    ) : (
"""
s = replace_once(s, old, new, 'file-mode result viewer actions')

old = """  ) : (
    <CodeEditor
      value={scratchCode}
      language={scratchLanguage}
      onChange={handleCodeChange}
      isMobile={isMobile}
      onEditorReady={(editor) => editorRef.current = editor}
    />
  );
"""
new = """  ) : currentDataset && showDataset ? (
    <DatasetViewer
      title={showDataset}
      headers={currentDataset.headers}
      data={currentDataset.data}
      onVisualize={() => setPlotBuilderOpen(true)}
      onExportCSV={() => handleExportDataset(showDataset)}
      onSaveAsFile={() => handleSaveDatasetAsFile(showDataset)}
      onClose={() => setShowDataset(null)}
    />
  ) : (
    <CodeEditor
      value={scratchCode}
      language={scratchLanguage}
      onChange={handleCodeChange}
      isMobile={isMobile}
      onEditorReady={(editor) => editorRef.current = editor}
    />
  );
"""
s = replace_once(s, old, new, 'scratch-mode result viewer')

ide_path.write_text(s)

# Public SQL docs: describe the actual local SQLite/CSV boundary.
docs_path = Path('src/pages/docs/SQLDocs.tsx')
d = docs_path.read_text()
for old, new, label in [
    (
        'Complete SQL reference for bIDE. SELECT, JOIN, aggregations, subqueries, and database operations. Practice SQL queries in your browser with instant execution.',
        'SQL reference for bIDE local SQLite. Practice SELECT, JOIN, aggregations, subqueries, and CSV-backed analysis directly in your browser.',
        'SQL meta description',
    ),
    (
        'Free online SQL IDE powered by sql.js. Practice database queries in your browser. Learn SELECT, JOIN, aggregations, and more with instant execution.',
        'Browser SQL IDE powered by local SQLite via sql.js. Query workspace CSV tables, practice joins and aggregations, and inspect or export results without sending source data to a database server.',
        'SQL schema description',
    ),
    (
        '<p className="text-xs text-muted-foreground">Query and manage relational databases</p>',
        '<p className="text-xs text-muted-foreground">Practice against local in-browser SQLite</p>',
        'SQL page subtitle',
    ),
    (
        '<span>Query databases for reporting</span>',
        '<span>Query local workspace tables for reporting</span>',
        'SQL reporting capability',
    ),
    (
        '<span>Data warehousing</span>',
        '<span>CSV-backed local analysis</span>',
        'SQL local analysis capability',
    ),
    (
        '<span>Learn database operations</span>',
        '<span>Uploaded CSVs refresh into SQLite tables before each SQL run</span>',
        'SQL CSV capability',
    ),
    (
        '<li>🔹 Always end statements with semicolon</li>',
        '<li>🔹 Use semicolons to separate multiple SQL statements</li>\n                <li>🔹 Uploaded orders.csv becomes a table such as orders; normalized names are shown in the console</li>\n                <li>🔹 Identifier-like columns (ID, code, ZIP, account, SKU) stay text so join keys keep leading zeros</li>\n                <li>🔹 Blank CSV cells import as SQL NULL; saved/exported result CSVs write NULL as empty cells</li>\n                <li>🔹 CSV-backed tables rebuild from Files after reload; ad-hoc CREATE TABLE state is session-only unless you save the source/result</li>',
        'SQL quick tips',
    ),
]:
    d = replace_once(d, old, new, label)

needle = """                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Uploaded CSVs refresh into SQLite tables before each SQL run</span>
                  </div>
"""
addition = needle + """                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Inspect SELECT results, export CSV, or save a result back to Files</span>
                  </div>
"""
d = replace_once(d, needle, addition, 'SQL result capability')
docs_path.write_text(d)

# Run the new SQL regression guard on every production build.
pkg_path = Path('package.json')
pkg = json.loads(pkg_path.read_text())
scripts = pkg['scripts']
scripts['test:sql-analyst'] = 'node scripts/check-sql-analyst-workflow.mjs'
needle = 'npm run test:team-boundaries && vite build'
replacement = 'npm run test:team-boundaries && npm run test:sql-analyst && vite build'
for key in ('build', 'build:dev'):
    if needle not in scripts[key]:
        raise SystemExit(f'{key}: expected team-boundary build suffix not found')
    scripts[key] = scripts[key].replace(needle, replacement, 1)
pkg_path.write_text(json.dumps(pkg, indent=2) + '\n')
