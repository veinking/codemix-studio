import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  isMobile?: boolean;
}

const registerCompletionProviders = (monaco: any) => {
  // Python completion items
  const pythonCompletions = [
    'print', 'input', 'len', 'range', 'type', 'str', 'int', 'float', 'list', 'dict',
    'tuple', 'set', 'True', 'False', 'None', 'if', 'else', 'elif', 'for', 'while',
    'def', 'class', 'return', 'import', 'from', 'as', 'try', 'except', 'with',
    'lambda', 'yield', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is',
    'open', 'read', 'write', 'close', 'enumerate', 'zip', 'map', 'filter', 'sorted',
    'max', 'min', 'abs', 'sum', 'all', 'any', 'round', 'pow', 'isinstance', 'hasattr'
  ];

  // R completion items
  const rCompletions = [
    'print', 'cat', 'length', 'c', 'seq', 'rep', 'list', 'data.frame', 'matrix',
    'vector', 'factor', 'mean', 'sum', 'sd', 'var', 'min', 'max', 'range',
    'function', 'if', 'else', 'for', 'while', 'repeat', 'return', 'library',
    'TRUE', 'FALSE', 'NULL', 'NA', 'plot', 'ggplot', 'read.csv', 'write.csv',
    'head', 'tail', 'str', 'summary', 'nrow', 'ncol', 'dim', 'names', 'lapply',
    'sapply', 'apply', 'subset', 'merge', 'aggregate', 'lm', 'glm', 'predict'
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

  // Register Python provider
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: pythonCompletions.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range: range,
        })),
      };
    },
  });

  // Register R provider
  monaco.languages.registerCompletionItemProvider('r', {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: rCompletions.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range: range,
        })),
      };
    },
  });

  // Register JavaScript provider
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: jsCompletions.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range: range,
        })),
      };
    },
  });

  // Register SQL provider
  monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: sqlCompletions.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range: range,
        })),
      };
    },
  });
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
        minimap: { enabled: !isMobile }, // Disable minimap on mobile for memory
        fontSize: isMobile ? 12 : 14, // Smaller font on mobile
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
        // Enhanced selection for better touch/mouse interaction
        selectOnLineNumbers: true,
        selectionHighlight: true,
        occurrencesHighlight: 'multiFile',
        multiCursorModifier: 'ctrlCmd',
        wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?',
      }}
    />
  );
};
