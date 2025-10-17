import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  isMobile?: boolean;
}

// Guard so we don't register providers more than once
let providersRegistered = false;

const registerCompletionProviders = (monaco: any) => {
  if (providersRegistered) return;
  providersRegistered = true;

  // Python keywords
  const pythonCompletions = [
    'print', 'input', 'len', 'range', 'type', 'str', 'int', 'float', 'list', 'dict',
    'tuple', 'set', 'True', 'False', 'None', 'if', 'else', 'elif', 'for', 'while',
    'def', 'class', 'return', 'import', 'from', 'as', 'try', 'except', 'with',
    'lambda', 'yield', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is',
    'open', 'read', 'write', 'close', 'enumerate', 'zip', 'map', 'filter', 'sorted',
    'max', 'min', 'abs', 'sum', 'all', 'any', 'round', 'pow', 'isinstance', 'hasattr'
  ];

  // Python snippets for common patterns
  const pythonSnippets = [
    { label: 'import pandas as pd', text: 'import pandas as pd', detail: 'Import pandas' },
    { label: 'import numpy as np', text: 'import numpy as np', detail: 'Import NumPy' },
    { label: 'import matplotlib.pyplot as plt', text: 'import matplotlib.pyplot as plt', detail: 'Import Matplotlib' },
    { label: 'pd.read_csv()', text: 'pd.read_csv("${1:file.csv}")', detail: 'Read CSV file' },
    { label: 'df.head()', text: 'df.head(${1:5})', detail: 'View first rows' },
    { label: 'for loop', text: 'for ${1:item} in ${2:items}:\n    ${3:pass}', detail: 'For loop' },
  ];

  // R keywords
  const rCompletions = [
    'print', 'cat', 'length', 'c', 'seq', 'rep', 'list', 'data.frame', 'matrix',
    'vector', 'factor', 'mean', 'sum', 'sd', 'var', 'min', 'max', 'range',
    'function', 'if', 'else', 'for', 'while', 'repeat', 'return', 'library',
    'TRUE', 'FALSE', 'NULL', 'NA', 'plot', 'ggplot', 'read.csv', 'write.csv',
    'head', 'tail', 'str', 'summary', 'nrow', 'ncol', 'dim', 'names', 'lapply',
    'sapply', 'apply', 'subset', 'merge', 'aggregate', 'lm', 'glm', 'predict'
  ];

  // R snippets for common patterns
  const rSnippets = [
    { label: 'library(ggplot2)', text: 'library(ggplot2)', detail: 'Load ggplot2' },
    { label: 'library(dplyr)', text: 'library(dplyr)', detail: 'Load dplyr' },
    { label: 'library(tidyr)', text: 'library(tidyr)', detail: 'Load tidyr' },
    { label: 'read.csv()', text: 'read.csv("${1:file.csv}")', detail: 'Read CSV' },
    { label: 'ggplot()', text: 'ggplot(${1:data}, aes(x=${2:x}, y=${3:y})) +\n  geom_${4:point}()', detail: 'Create ggplot' },
    { label: 'for loop', text: 'for (${1:i} in ${2:1:10}) {\n  ${3}\n}', detail: 'For loop' },
  ];

  // JavaScript completion items
  const jsCompletions = [
    'console', 'log', 'var', 'let', 'const', 'function', 'return', 'if', 'else',
    'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch',
    'throw', 'new', 'class', 'this', 'super', 'extends', 'import', 'export',
    'async', 'await', 'Promise', 'then', 'catch', 'finally', 'typeof', 'instanceof',
    'map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every', 'includes',
    'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'join', 'split', 'Array',
    'Object', 'String', 'Number', 'Boolean', 'Math', 'Date', 'JSON', 'parseInt'
  ];

  // SQL completion items
  const sqlCompletions = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE',
    'TABLE', 'DROP', 'ALTER', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
    'ON', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
    'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'AS', 'DISTINCT',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'PRIMARY', 'KEY', 'FOREIGN', 'UNIQUE',
    'CHECK', 'DEFAULT', 'AUTO_INCREMENT', 'CASCADE', 'CONSTRAINT', 'INTEGER',
    'VARCHAR', 'TEXT', 'DATE', 'TIMESTAMP', 'BOOLEAN', 'REAL', 'BLOB'
  ];

  const mkProvider = (keywords: string[], snippets: Array<{label: string, text: string, detail: string}> = []) => ({
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      
      const keywordSuggestions = keywords
        .filter(k => k.toLowerCase().includes(word.word.toLowerCase()))
        .map((label) => ({
          label,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: label,
          range,
        }));

      const snippetSuggestions = snippets
        .filter(s => s.label.toLowerCase().includes(word.word.toLowerCase()))
        .map((snippet) => ({
          label: snippet.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.text,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: snippet.detail,
          range,
        }));

      return {
        suggestions: [...snippetSuggestions, ...keywordSuggestions],
      };
    },
  });

  // Register all language providers with snippets
  monaco.languages.registerCompletionItemProvider('python', mkProvider(pythonCompletions, pythonSnippets));
  monaco.languages.registerCompletionItemProvider('r', mkProvider(rCompletions, rSnippets));
  monaco.languages.registerCompletionItemProvider('javascript', mkProvider(jsCompletions));
  monaco.languages.registerCompletionItemProvider('sql', mkProvider(sqlCompletions));
};

export const CodeEditor = ({ value, language, onChange, isMobile = false }: CodeEditorProps) => {
  const handleEditorMount = (editor: any, monaco: any) => {
    registerCompletionProviders(monaco);
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      language={language}
      value={value}
      onChange={onChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: !isMobile },
        fontSize: isMobile ? 13 : 14,
        fontFamily: 'JetBrains Mono, Fira Code, Consolas, Monaco, monospace',
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'on',
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        wordBasedSuggestions: 'matchingDocuments',
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        selectOnLineNumbers: true,
        selectionHighlight: true,
        occurrencesHighlight: 'multiFile',
        multiCursorModifier: 'ctrlCmd',
        wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?',
      }}
    />
  );
};
