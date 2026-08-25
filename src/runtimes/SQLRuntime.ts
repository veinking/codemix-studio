import { RuntimeExecutor, RuntimeConfig, ExecutionResult, Dataset as RuntimeDataset } from './RuntimeInterface';
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
