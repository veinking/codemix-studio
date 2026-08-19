import { useEffect } from "react";
import { loader } from "@monaco-editor/react";

const CONTEXT_KEY = "bide.pocketbi.dataset.v1";
const GLOBAL_FLAG = "__bideDatasetCompletionProvidersV1";

type DatasetContext = {
  version: 1;
  id: string;
  name: string;
  columns: string[];
  source: "pocketbi";
  receivedAt: string;
};

function readContext(): DatasetContext | null {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DatasetContext>;
    if (
      parsed.version !== 1
      || parsed.source !== "pocketbi"
      || typeof parsed.id !== "string"
      || typeof parsed.name !== "string"
      || !Array.isArray(parsed.columns)
    ) return null;
    const columns = parsed.columns
      .filter((column): column is string => typeof column === "string" && Boolean(column.trim()))
      .map((column) => column.trim())
      .slice(0, 2_000);
    if (!columns.length) return null;
    return {
      version: 1,
      id: parsed.id,
      name: parsed.name,
      columns,
      source: "pocketbi",
      receivedAt: typeof parsed.receivedAt === "string" ? parsed.receivedAt : "",
    };
  } catch {
    return null;
  }
}

function quotePython(value: string): string {
  return JSON.stringify(value);
}

function quoteR(value: string): string {
  return JSON.stringify(value);
}

function completionRange(model: any, position: any) {
  const word = model.getWordUntilPosition(position);
  return {
    query: String(word.word || "").toLowerCase(),
    range: {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    },
  };
}

function matches(query: string, ...values: string[]) {
  if (!query) return true;
  return values.some((value) => value.toLowerCase().includes(query));
}

export default function DatasetCompletionBootstrap() {
  useEffect(() => {
    let cancelled = false;

    void loader.init().then((monaco) => {
      if (cancelled) return;
      const globalScope = window as typeof window & Record<string, unknown>;
      if (globalScope[GLOBAL_FLAG]) return;
      globalScope[GLOBAL_FLAG] = true;

      monaco.languages.registerCompletionItemProvider("python", {
        provideCompletionItems(model, position) {
          const dataset = readContext();
          if (!dataset) return { suggestions: [] };
          const { query, range } = completionRange(model, position);
          const suggestions: any[] = [];

          if (matches(query, dataset.name, "pocketbi", "read csv", "dataframe", "df")) {
            suggestions.push({
              label: `PocketBI: load ${dataset.name}`,
              detail: "Load the handed-off PocketBI dataset with pandas",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: `import pandas as pd\ndf = pd.read_csv(${quotePython(dataset.name)})\ndf.head()`,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              sortText: "0000",
              range,
            });
          }

          dataset.columns.forEach((column, index) => {
            if (!matches(query, column, "column", "df")) return;
            suggestions.push({
              label: `df[${quotePython(column)}]`,
              detail: `PocketBI column · ${dataset.name}`,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: `df[${quotePython(column)}]`,
              sortText: `01${String(index).padStart(4, "0")}`,
              range,
            });
          });

          if (matches(query, "columns", "schema", dataset.name)) {
            suggestions.push({
              label: "PocketBI: inspect columns",
              detail: dataset.columns.join(", ").slice(0, 300),
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "df.columns.tolist()",
              sortText: "0002",
              range,
            });
          }

          return { suggestions: suggestions.slice(0, 250) };
        },
      });

      monaco.languages.registerCompletionItemProvider("r", {
        provideCompletionItems(model, position) {
          const dataset = readContext();
          if (!dataset) return { suggestions: [] };
          const { query, range } = completionRange(model, position);
          const suggestions: any[] = [];

          if (matches(query, dataset.name, "pocketbi", "read csv", "data")) {
            suggestions.push({
              label: `PocketBI: load ${dataset.name}`,
              detail: "Load the handed-off PocketBI dataset in R",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: `data <- read.csv(${quoteR(dataset.name)}, check.names = FALSE)\nhead(data)`,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              sortText: "0000",
              range,
            });
          }

          dataset.columns.forEach((column, index) => {
            if (!matches(query, column, "column", "data")) return;
            suggestions.push({
              label: `data[[${quoteR(column)}]]`,
              detail: `PocketBI column · ${dataset.name}`,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: `data[[${quoteR(column)}]]`,
              sortText: `01${String(index).padStart(4, "0")}`,
              range,
            });
          });

          return { suggestions: suggestions.slice(0, 250) };
        },
      });

      monaco.languages.registerCompletionItemProvider("sql", {
        provideCompletionItems(model, position) {
          const dataset = readContext();
          if (!dataset) return { suggestions: [] };
          const { query, range } = completionRange(model, position);
          const suggestions = dataset.columns
            .filter((column) => matches(query, column, "column"))
            .slice(0, 250)
            .map((column, index) => ({
              label: column,
              detail: `PocketBI dataset field · ${dataset.name}`,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: `"${column.replace(/"/g, '""')}"`,
              sortText: `01${String(index).padStart(4, "0")}`,
              range,
            }));
          return { suggestions };
        },
      });
    }).catch(() => {
      // The editor itself will surface Monaco loading failures. Dataset context is optional.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
