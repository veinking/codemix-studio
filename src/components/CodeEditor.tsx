import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
}

const registerCompletionProviders = (monaco: any) => {
  // Python completion items
  const pythonCompletions = [
    'print', 'input', 'len', 'range', 'type', 'str', 'int', 'float', 'list', 'dict',
    'tuple', 'set', 'True', 'False', 'None', 'if', 'else', 'elif', 'for', 'while',
    'def', 'class', 'return', 'import', 'from', 'as', 'try', 'except', 'with',
    'lambda', 'yield', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is'
  ];

  // R completion items
  const rCompletions = [
    'print', 'cat', 'length', 'c', 'seq', 'rep', 'list', 'data.frame', 'matrix',
    'vector', 'factor', 'mean', 'sum', 'sd', 'var', 'min', 'max', 'range',
    'function', 'if', 'else', 'for', 'while', 'repeat', 'return', 'library',
    'TRUE', 'FALSE', 'NULL', 'NA', 'plot', 'ggplot', 'read.csv', 'write.csv'
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
};

export const CodeEditor = ({ value, language, onChange }: CodeEditorProps) => {
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
        minimap: { enabled: true },
        fontSize: 14,
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
