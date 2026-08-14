import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  isMobile?: boolean;
  onEditorReady?: (editor: any) => void;
}

type CompletionSpec = {
  label: string;
  insertText?: string;
  detail?: string;
  snippet?: boolean;
};

const COMPLETIONS: Record<string, CompletionSpec[]> = {
  python: [
    { label: "print", insertText: "print(${1:value})", snippet: true },
    { label: "def", insertText: "def ${1:name}(${2:args}):\n    ${3:pass}", snippet: true },
    { label: "for", insertText: "for ${1:item} in ${2:items}:\n    ${3:pass}", snippet: true },
    { label: "import pandas as pd", detail: "Import pandas" },
    { label: "pd.read_csv", insertText: "pd.read_csv(\"${1:file.csv}\")", snippet: true },
    { label: "import numpy as np", detail: "Import NumPy" },
    { label: "import matplotlib.pyplot as plt", detail: "Import Matplotlib" },
  ],
  r: [
    { label: "print", insertText: "print(${1:value})", snippet: true },
    { label: "function", insertText: "${1:name} <- function(${2:args}) {\n  ${3}\n}", snippet: true },
    { label: "for", insertText: "for (${1:item} in ${2:items}) {\n  ${3}\n}", snippet: true },
    { label: "library(dplyr)", detail: "Load dplyr" },
    { label: "library(ggplot2)", detail: "Load ggplot2" },
    { label: "read.csv", insertText: "read.csv(\"${1:file.csv}\")", snippet: true },
  ],
  javascript: [
    { label: "console.log", insertText: "console.log(${1:value});", snippet: true },
    { label: "function", insertText: "function ${1:name}(${2:args}) {\n  ${3}\n}", snippet: true },
    { label: "async function", insertText: "async function ${1:name}(${2:args}) {\n  ${3}\n}", snippet: true },
    { label: "for...of", insertText: "for (const ${1:item} of ${2:items}) {\n  ${3}\n}", snippet: true },
    { label: "try...catch", insertText: "try {\n  ${1}\n} catch (error) {\n  ${2}\n}", snippet: true },
  ],
  typescript: [
    { label: "interface", insertText: "interface ${1:Name} {\n  ${2:key}: ${3:string};\n}", snippet: true },
    { label: "type", insertText: "type ${1:Name} = {\n  ${2:key}: ${3:string};\n};", snippet: true },
    { label: "async function", insertText: "async function ${1:name}(${2:args}): Promise<${3:void}> {\n  ${4}\n}", snippet: true },
    { label: "console.log", insertText: "console.log(${1:value});", snippet: true },
  ],
  sql: [
    { label: "SELECT", insertText: "SELECT ${1:*}\nFROM ${2:table}\nWHERE ${3:condition};", snippet: true },
    { label: "JOIN", insertText: "JOIN ${1:table} ON ${2:left_key} = ${3:right_key}", snippet: true },
    { label: "GROUP BY", insertText: "GROUP BY ${1:column}", snippet: true },
    { label: "ORDER BY", insertText: "ORDER BY ${1:column} ${2:DESC}", snippet: true },
    { label: "CREATE TABLE", insertText: "CREATE TABLE ${1:name} (\n  ${2:id} INTEGER PRIMARY KEY\n);", snippet: true },
  ],
  php: [
    { label: "echo", insertText: "echo ${1:value};", snippet: true },
    { label: "function", insertText: "function ${1:name}(${2:args}) {\n    ${3}\n}", snippet: true },
    { label: "foreach", insertText: "foreach (${1:\$items} as ${2:\$item}) {\n    ${3}\n}", snippet: true },
    { label: "class", insertText: "class ${1:Name} {\n    ${2}\n}", snippet: true },
  ],
  ruby: [
    { label: "puts", insertText: "puts ${1:value}", snippet: true },
    { label: "def", insertText: "def ${1:name}(${2:args})\n  ${3}\nend", snippet: true },
    { label: "each", insertText: "${1:items}.each do |${2:item}|\n  ${3}\nend", snippet: true },
    { label: "class", insertText: "class ${1:Name}\n  ${2}\nend", snippet: true },
  ],
  lua: [
    { label: "print", insertText: "print(${1:value})", snippet: true },
    { label: "function", insertText: "function ${1:name}(${2:args})\n  ${3}\nend", snippet: true },
    { label: "for", insertText: "for ${1:i} = ${2:1}, ${3:10} do\n  ${4}\nend", snippet: true },
    { label: "local", insertText: "local ${1:name} = ${2:value}", snippet: true },
  ],
  java: [
    { label: "main", insertText: "public static void main(String[] args) {\n    ${1}\n}", snippet: true },
    { label: "class", insertText: "public class ${1:Name} {\n    ${2}\n}", snippet: true },
    { label: "System.out.println", insertText: "System.out.println(${1:value});", snippet: true },
    { label: "for", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}", snippet: true },
  ],
  cpp: [
    { label: "main", insertText: "int main() {\n    ${1}\n    return 0;\n}", snippet: true },
    { label: "cout", insertText: "std::cout << ${1:value} << std::endl;", snippet: true },
    { label: "vector", insertText: "std::vector<${1:int}> ${2:items};", snippet: true },
    { label: "class", insertText: "class ${1:Name} {\npublic:\n    ${2}\n};", snippet: true },
  ],
  c: [
    { label: "main", insertText: "int main(void) {\n    ${1}\n    return 0;\n}", snippet: true },
    { label: "printf", insertText: "printf(\"${1:%s}\\n\", ${2:value});", snippet: true },
    { label: "struct", insertText: "struct ${1:Name} {\n    ${2}\n};", snippet: true },
    { label: "for", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}", snippet: true },
  ],
  rust: [
    { label: "fn", insertText: "fn ${1:name}(${2:args}) -> ${3:Type} {\n    ${4}\n}", snippet: true },
    { label: "println!", insertText: "println!(\"${1:{}}\", ${2:value});", snippet: true },
    { label: "struct", insertText: "struct ${1:Name} {\n    ${2:field}: ${3:Type},\n}", snippet: true },
    { label: "match", insertText: "match ${1:value} {\n    ${2:pattern} => ${3:result},\n    _ => ${4:default},\n}", snippet: true },
  ],
  go: [
    { label: "main", insertText: "func main() {\n    ${1}\n}", snippet: true },
    { label: "func", insertText: "func ${1:name}(${2:args}) ${3:Type} {\n    ${4}\n}", snippet: true },
    { label: "fmt.Println", insertText: "fmt.Println(${1:value})", snippet: true },
    { label: "struct", insertText: "type ${1:Name} struct {\n    ${2:Field} ${3:Type}\n}", snippet: true },
  ],
  swift: [
    { label: "print", insertText: "print(${1:value})", snippet: true },
    { label: "func", insertText: "func ${1:name}(${2:args}) -> ${3:Type} {\n    ${4}\n}", snippet: true },
    { label: "struct", insertText: "struct ${1:Name} {\n    ${2}\n}", snippet: true },
    { label: "guard", insertText: "guard ${1:condition} else {\n    ${2:return}\n}", snippet: true },
  ],
  kotlin: [
    { label: "fun", insertText: "fun ${1:name}(${2:args}): ${3:Type} {\n    ${4}\n}", snippet: true },
    { label: "println", insertText: "println(${1:value})", snippet: true },
    { label: "data class", insertText: "data class ${1:Name}(val ${2:value}: ${3:String})", snippet: true },
    { label: "when", insertText: "when (${1:value}) {\n    ${2:case} -> ${3:result}\n    else -> ${4:default}\n}", snippet: true },
  ],
  csharp: [
    { label: "Main", insertText: "static void Main(string[] args)\n{\n    ${1}\n}", snippet: true },
    { label: "Console.WriteLine", insertText: "Console.WriteLine(${1:value});", snippet: true },
    { label: "class", insertText: "public class ${1:Name}\n{\n    ${2}\n}", snippet: true },
    { label: "foreach", insertText: "foreach (var ${1:item} in ${2:items})\n{\n    ${3}\n}", snippet: true },
  ],
};

let providersRegistered = false;

function registerCompletionProviders(monaco: any) {
  if (providersRegistered) return;
  providersRegistered = true;

  Object.entries(COMPLETIONS).forEach(([language, items]) => {
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems(model: any, position: any) {
        const word = model.getWordUntilPosition(position);
        const query = word.word.toLowerCase();
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = items
          .filter((item) => !query || item.label.toLowerCase().includes(query))
          .map((item, index) => ({
            label: item.label,
            detail: item.detail,
            kind: item.snippet
              ? monaco.languages.CompletionItemKind.Snippet
              : monaco.languages.CompletionItemKind.Keyword,
            insertText: item.insertText || item.label,
            insertTextRules: item.snippet
              ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              : undefined,
            sortText: String(index).padStart(3, "0"),
            range,
          }));

        return { suggestions };
      },
    });
  });
}

export const CodeEditor = ({
  value,
  language,
  onChange,
  isMobile = false,
  onEditorReady,
}: CodeEditorProps) => {
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const syncingExternalValue = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const editor = editorRef.current;
    const model = editor?.getModel?.();
    if (!model || model.getValue() === value) return;

    syncingExternalValue.current = true;
    const position = editor.getPosition?.();
    model.setValue(value || "");
    if (position) {
      const lastLine = Math.max(1, model.getLineCount());
      const lineNumber = Math.min(position.lineNumber, lastLine);
      const maxColumn = model.getLineMaxColumn(lineNumber);
      editor.setPosition({
        lineNumber,
        column: Math.min(position.column, maxColumn),
      });
    }
    syncingExternalValue.current = false;
  }, [value]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    registerCompletionProviders(monaco);
    onEditorReady?.(editor);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
      const position = editor.getPosition();
      const model = editor.getModel();
      if (!position || !model) return;
      editor.setSelection(
        new monaco.Selection(
          position.lineNumber,
          1,
          position.lineNumber,
          model.getLineMaxColumn(position.lineNumber),
        ),
      );
    });

    requestAnimationFrame(() => {
      editor.layout();
      if (!isMobile) editor.focus();
    });
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      language={language}
      defaultValue={value}
      onChange={(nextValue) => {
        if (!syncingExternalValue.current) onChangeRef.current(nextValue);
      }}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={{
        automaticLayout: true,
        minimap: { enabled: !isMobile },
        fontSize: 14,
        fontFamily: "JetBrains Mono, Fira Code, Consolas, Monaco, monospace",
        fontLigatures: !isMobile,
        lineHeight: isMobile ? 24 : 22,
        lineNumbers: "on",
        glyphMargin: false,
        folding: !isMobile,
        wordWrap: isMobile ? "on" : "off",
        wrappingIndent: "same",
        scrollBeyondLastLine: false,
        smoothScrolling: !isMobile,
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: true,
        formatOnPaste: false,
        formatOnType: false,
        quickSuggestions: isMobile
          ? false
          : { other: true, comments: false, strings: true },
        quickSuggestionsDelay: 80,
        suggestOnTriggerCharacters: !isMobile,
        acceptSuggestionOnEnter: "smart",
        tabCompletion: isMobile ? "off" : "on",
        wordBasedSuggestions: isMobile ? "off" : "matchingDocuments",
        parameterHints: { enabled: !isMobile },
        hover: { enabled: !isMobile },
        links: !isMobile,
        suggest: {
          showKeywords: true,
          showSnippets: true,
          preview: !isMobile,
          localityBonus: !isMobile,
        },
        bracketPairColorization: { enabled: !isMobile },
        guides: {
          bracketPairs: !isMobile,
          indentation: !isMobile,
        },
        stickyScroll: { enabled: !isMobile },
        selectionHighlight: !isMobile,
        occurrencesHighlight: isMobile ? "off" : "singleFile",
        multiCursorModifier: "ctrlCmd",
        cursorBlinking: isMobile ? "blink" : "smooth",
        cursorSmoothCaretAnimation: isMobile ? "off" : "on",
        cursorSurroundingLines: isMobile ? 1 : 2,
        renderLineHighlight: isMobile ? "line" : "all",
        renderLineHighlightOnlyWhenFocus: true,
        renderWhitespace: "selection",
        renderValidationDecorations: "on",
        copyWithSyntaxHighlighting: !isMobile,
        emptySelectionClipboard: false,
        contextmenu: true,
        padding: { top: 8, bottom: isMobile ? 72 : 12 },
        overviewRulerLanes: isMobile ? 0 : 3,
        hideCursorInOverviewRuler: isMobile,
        scrollbar: {
          vertical: "auto",
          horizontal: "auto",
          verticalScrollbarSize: isMobile ? 7 : 10,
          horizontalScrollbarSize: isMobile ? 7 : 10,
          alwaysConsumeMouseWheel: false,
        },
      }}
    />
  );
};