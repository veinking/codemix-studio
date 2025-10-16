import { RuntimeExecutor, RuntimeConfig, ExecutionResult } from './RuntimeInterface';
import initSqlJs, { Database } from 'sql.js';

export class SQLRuntime implements RuntimeExecutor {
  private SQL: any = null;
  private db: Database | null = null;
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
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });
    
    this.db = new this.SQL.Database();
    this.isInitialized = true;
  }

  async execute(code: string, onOutput: (text: string) => void): Promise<ExecutionResult> {
    if (!this.isInitialized || !this.db) {
      throw new Error('SQL runtime not initialized');
    }

    const result: ExecutionResult = { output: '' };

    try {
      const statements = code.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        const queryResult = this.db.exec(statement);
        
        if (queryResult.length > 0) {
          for (const table of queryResult) {
            const { columns, values } = table;
            
            const output = this.formatAsTable(columns, values);
            result.output += output + '\n\n';
            onOutput(output);
          }
        } else {
          const successMsg = 'Query executed successfully';
          result.output += successMsg + '\n';
          onOutput(successMsg);
        }
      }
    } catch (error: any) {
      result.error = error.message || String(error);
      result.output += `Error: ${result.error}\n`;
      onOutput(`Error: ${result.error}`);
    }

    return result;
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
    }
  }
}
