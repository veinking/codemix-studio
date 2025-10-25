import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string | undefined) => void;
  isMobile?: boolean;
  onEditorReady?: (editor: any) => void;
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

  // PHP keywords
  const phpCompletions = [
    'echo', 'print', 'var_dump', 'print_r', 'die', 'exit', 'if', 'else', 'elseif',
    'switch', 'case', 'default', 'while', 'do', 'for', 'foreach', 'break', 'continue',
    'function', 'return', 'class', 'public', 'private', 'protected', 'static', 'new',
    'extends', 'implements', 'interface', 'trait', 'namespace', 'use', 'require', 'include',
    'array', 'isset', 'empty', 'unset', 'true', 'false', 'null', 'this', 'self', 'parent',
    'strlen', 'strpos', 'substr', 'explode', 'implode', 'array_map', 'array_filter', 'count'
  ];

  const phpSnippets = [
    { label: 'class', text: 'class ${1:ClassName} {\n    public function __construct() {\n        ${2}\n    }\n}', detail: 'Create class' },
    { label: 'function', text: 'function ${1:name}(${2:params}) {\n    ${3}\n}', detail: 'Create function' },
    { label: 'foreach', text: 'foreach (${1:array} as ${2:key} => ${3:value}) {\n    ${4}\n}', detail: 'Foreach loop' },
  ];

  // Ruby keywords
  const rubyCompletions = [
    'puts', 'print', 'p', 'if', 'elsif', 'else', 'unless', 'case', 'when', 'while',
    'until', 'for', 'break', 'next', 'redo', 'retry', 'def', 'class', 'module', 'end',
    'return', 'yield', 'super', 'self', 'begin', 'rescue', 'ensure', 'raise', 'attr_accessor',
    'attr_reader', 'attr_writer', 'include', 'extend', 'require', 'true', 'false', 'nil',
    'each', 'map', 'select', 'reject', 'find', 'reduce', 'sort', 'reverse', 'join', 'split'
  ];

  const rubySnippets = [
    { label: 'class', text: 'class ${1:ClassName}\n  def initialize(${2:params})\n    ${3}\n  end\nend', detail: 'Create class' },
    { label: 'def', text: 'def ${1:method_name}(${2:params})\n  ${3}\nend', detail: 'Define method' },
    { label: 'each', text: '${1:array}.each do |${2:item}|\n  ${3}\nend', detail: 'Each loop' },
  ];

  // Lua keywords
  const luaCompletions = [
    'print', 'type', 'tonumber', 'tostring', 'if', 'then', 'else', 'elseif', 'end',
    'while', 'do', 'repeat', 'until', 'for', 'in', 'break', 'return', 'function',
    'local', 'true', 'false', 'nil', 'and', 'or', 'not', 'pairs', 'ipairs', 'next',
    'table', 'insert', 'remove', 'sort', 'concat', 'string', 'math', 'require', 'module'
  ];

  const luaSnippets = [
    { label: 'function', text: 'function ${1:name}(${2:params})\n  ${3}\nend', detail: 'Create function' },
    { label: 'for', text: 'for ${1:i} = ${2:1}, ${3:10} do\n  ${4}\nend', detail: 'For loop' },
    { label: 'table', text: 'local ${1:tbl} = {${2}}\n', detail: 'Create table' },
  ];

  // Java keywords
  const javaCompletions = [
    'public', 'private', 'protected', 'static', 'final', 'class', 'interface', 'extends',
    'implements', 'void', 'int', 'double', 'float', 'boolean', 'char', 'String', 'if',
    'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'break', 'continue',
    'return', 'new', 'this', 'super', 'try', 'catch', 'finally', 'throw', 'throws',
    'import', 'package', 'abstract', 'synchronized', 'volatile', 'transient', 'System',
    'println', 'print', 'List', 'ArrayList', 'HashMap', 'Set', 'HashSet', 'Collections'
  ];

  const javaSnippets = [
    { label: 'class', text: 'public class ${1:ClassName} {\n    public ${1}() {\n        ${2}\n    }\n}', detail: 'Create class' },
    { label: 'main', text: 'public static void main(String[] args) {\n    ${1}\n}', detail: 'Main method' },
    { label: 'for', text: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n    ${3}\n}', detail: 'For loop' },
  ];

  // TypeScript keywords
  const tsCompletions = [
    'let', 'const', 'var', 'function', 'class', 'interface', 'type', 'enum', 'namespace',
    'if', 'else', 'switch', 'case', 'for', 'while', 'do', 'break', 'continue', 'return',
    'async', 'await', 'Promise', 'import', 'export', 'default', 'from', 'as', 'extends',
    'implements', 'public', 'private', 'protected', 'readonly', 'static', 'abstract',
    'string', 'number', 'boolean', 'any', 'void', 'null', 'undefined', 'Array', 'Map',
    'Set', 'typeof', 'instanceof', 'this', 'super', 'new', 'try', 'catch', 'finally'
  ];

  const tsSnippets = [
    { label: 'interface', text: 'interface ${1:Name} {\n  ${2:property}: ${3:type};\n}', detail: 'Create interface' },
    { label: 'class', text: 'class ${1:ClassName} {\n  constructor(${2:params}) {\n    ${3}\n  }\n}', detail: 'Create class' },
    { label: 'async function', text: 'async function ${1:name}(${2:params}): Promise<${3:void}> {\n  ${4}\n}', detail: 'Async function' },
  ];

  // C++ keywords
  const cppCompletions = [
    'include', 'namespace', 'using', 'class', 'struct', 'public', 'private', 'protected',
    'virtual', 'override', 'final', 'static', 'const', 'constexpr', 'int', 'float',
    'double', 'char', 'bool', 'void', 'auto', 'if', 'else', 'switch', 'case', 'for',
    'while', 'do', 'break', 'continue', 'return', 'new', 'delete', 'this', 'nullptr',
    'try', 'catch', 'throw', 'template', 'typename', 'std', 'cout', 'cin', 'endl',
    'vector', 'string', 'map', 'set', 'pair', 'make_pair', 'shared_ptr', 'unique_ptr'
  ];

  const cppSnippets = [
    { label: 'class', text: 'class ${1:ClassName} {\npublic:\n    ${1}() {}\n    ~${1}() {}\nprivate:\n    ${2}\n};', detail: 'Create class' },
    { label: 'for', text: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}', detail: 'For loop' },
    { label: 'vector', text: 'std::vector<${1:int}> ${2:name};', detail: 'Create vector' },
  ];

  // C keywords
  const cCompletions = [
    'include', 'define', 'if', 'else', 'switch', 'case', 'default', 'for', 'while',
    'do', 'break', 'continue', 'return', 'int', 'float', 'double', 'char', 'void',
    'long', 'short', 'unsigned', 'signed', 'const', 'static', 'extern', 'typedef',
    'struct', 'union', 'enum', 'sizeof', 'malloc', 'free', 'calloc', 'realloc',
    'printf', 'scanf', 'strlen', 'strcpy', 'strcmp', 'strcat', 'fopen', 'fclose',
    'NULL', 'true', 'false', 'FILE', 'stdin', 'stdout', 'stderr'
  ];

  const cSnippets = [
    { label: 'main', text: 'int main() {\n    ${1}\n    return 0;\n}', detail: 'Main function' },
    { label: 'struct', text: 'struct ${1:Name} {\n    ${2:int member};\n};', detail: 'Create struct' },
    { label: 'for', text: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}', detail: 'For loop' },
  ];

  // Rust keywords
  const rustCompletions = [
    'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'impl', 'trait', 'type',
    'if', 'else', 'match', 'loop', 'while', 'for', 'in', 'break', 'continue', 'return',
    'pub', 'use', 'mod', 'crate', 'super', 'self', 'Self', 'true', 'false', 'Option',
    'Some', 'None', 'Result', 'Ok', 'Err', 'Vec', 'String', 'i32', 'u32', 'f64', 'bool',
    'println', 'print', 'format', 'unwrap', 'expect', 'clone', 'to_string', 'iter', 'map'
  ];

  const rustSnippets = [
    { label: 'fn', text: 'fn ${1:name}(${2:params}) -> ${3:ReturnType} {\n    ${4}\n}', detail: 'Create function' },
    { label: 'struct', text: 'struct ${1:Name} {\n    ${2:field}: ${3:Type},\n}', detail: 'Create struct' },
    { label: 'match', text: 'match ${1:value} {\n    ${2:pattern} => ${3:result},\n    _ => ${4:default},\n}', detail: 'Match expression' },
  ];

  // Go keywords
  const goCompletions = [
    'package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface', 'map',
    'chan', 'if', 'else', 'switch', 'case', 'default', 'for', 'range', 'break',
    'continue', 'return', 'go', 'defer', 'select', 'fallthrough', 'true', 'false',
    'nil', 'make', 'new', 'len', 'cap', 'append', 'copy', 'delete', 'panic', 'recover',
    'fmt', 'Println', 'Printf', 'Sprintf', 'string', 'int', 'float64', 'bool', 'byte', 'rune'
  ];

  const goSnippets = [
    { label: 'func', text: 'func ${1:name}(${2:params}) ${3:returnType} {\n    ${4}\n}', detail: 'Create function' },
    { label: 'struct', text: 'type ${1:Name} struct {\n    ${2:Field} ${3:Type}\n}', detail: 'Create struct' },
    { label: 'for', text: 'for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n    ${3}\n}', detail: 'For loop' },
  ];

  // Swift keywords
  const swiftCompletions = [
    'import', 'class', 'struct', 'enum', 'protocol', 'extension', 'func', 'var', 'let',
    'if', 'else', 'switch', 'case', 'default', 'for', 'in', 'while', 'repeat', 'break',
    'continue', 'return', 'guard', 'defer', 'throws', 'try', 'catch', 'throw', 'async',
    'await', 'public', 'private', 'internal', 'fileprivate', 'static', 'final', 'override',
    'init', 'deinit', 'self', 'super', 'nil', 'true', 'false', 'String', 'Int', 'Double',
    'Bool', 'Array', 'Dictionary', 'Set', 'Optional', 'print', 'debugPrint'
  ];

  const swiftSnippets = [
    { label: 'class', text: 'class ${1:ClassName} {\n    init() {\n        ${2}\n    }\n}', detail: 'Create class' },
    { label: 'func', text: 'func ${1:name}(${2:params}) -> ${3:ReturnType} {\n    ${4}\n}', detail: 'Create function' },
    { label: 'for', text: 'for ${1:item} in ${2:collection} {\n    ${3}\n}', detail: 'For-in loop' },
  ];

  // Kotlin keywords
  const kotlinCompletions = [
    'package', 'import', 'fun', 'val', 'var', 'class', 'interface', 'object', 'data',
    'sealed', 'enum', 'if', 'else', 'when', 'for', 'in', 'while', 'do', 'break',
    'continue', 'return', 'throw', 'try', 'catch', 'finally', 'public', 'private',
    'protected', 'internal', 'abstract', 'override', 'open', 'final', 'companion',
    'this', 'super', 'null', 'true', 'false', 'String', 'Int', 'Double', 'Boolean',
    'List', 'MutableList', 'Map', 'Set', 'println', 'print', 'readLine', 'let', 'apply'
  ];

  const kotlinSnippets = [
    { label: 'class', text: 'class ${1:ClassName} {\n    ${2}\n}', detail: 'Create class' },
    { label: 'fun', text: 'fun ${1:name}(${2:params}): ${3:ReturnType} {\n    ${4}\n}', detail: 'Create function' },
    { label: 'data class', text: 'data class ${1:Name}(${2:val property: Type})', detail: 'Data class' },
  ];

  // C# keywords
  const csharpCompletions = [
    'using', 'namespace', 'class', 'struct', 'interface', 'enum', 'delegate', 'event',
    'public', 'private', 'protected', 'internal', 'static', 'readonly', 'const', 'virtual',
    'override', 'abstract', 'sealed', 'async', 'await', 'void', 'int', 'string', 'bool',
    'double', 'float', 'decimal', 'char', 'if', 'else', 'switch', 'case', 'for', 'foreach',
    'while', 'do', 'break', 'continue', 'return', 'new', 'this', 'base', 'null', 'true',
    'false', 'try', 'catch', 'finally', 'throw', 'throws', 'var', 'List', 'Dictionary',
    'Console', 'WriteLine', 'ReadLine', 'ToString', 'Parse', 'TryParse', 'Length', 'Count'
  ];

  const csharpSnippets = [
    { label: 'class', text: 'public class ${1:ClassName}\n{\n    public ${1}()\n    {\n        ${2}\n    }\n}', detail: 'Create class' },
    { label: 'method', text: 'public ${1:void} ${2:MethodName}(${3:params})\n{\n    ${4}\n}', detail: 'Create method' },
    { label: 'for', text: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++)\n{\n    ${3}\n}', detail: 'For loop' },
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
  monaco.languages.registerCompletionItemProvider('php', mkProvider(phpCompletions, phpSnippets));
  monaco.languages.registerCompletionItemProvider('ruby', mkProvider(rubyCompletions, rubySnippets));
  monaco.languages.registerCompletionItemProvider('lua', mkProvider(luaCompletions, luaSnippets));
  monaco.languages.registerCompletionItemProvider('java', mkProvider(javaCompletions, javaSnippets));
  monaco.languages.registerCompletionItemProvider('typescript', mkProvider(tsCompletions, tsSnippets));
  monaco.languages.registerCompletionItemProvider('cpp', mkProvider(cppCompletions, cppSnippets));
  monaco.languages.registerCompletionItemProvider('c', mkProvider(cCompletions, cSnippets));
  monaco.languages.registerCompletionItemProvider('rust', mkProvider(rustCompletions, rustSnippets));
  monaco.languages.registerCompletionItemProvider('go', mkProvider(goCompletions, goSnippets));
  monaco.languages.registerCompletionItemProvider('swift', mkProvider(swiftCompletions, swiftSnippets));
  monaco.languages.registerCompletionItemProvider('kotlin', mkProvider(kotlinCompletions, kotlinSnippets));
  monaco.languages.registerCompletionItemProvider('csharp', mkProvider(csharpCompletions, csharpSnippets));
};

export const CodeEditor = ({ value, language, onChange, isMobile = false, onEditorReady }: CodeEditorProps) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange for mobile
  const handleChange = (newValue: string | undefined) => {
    setLocalValue(newValue || '');
    
    if (isMobile) {
      // Debounce on mobile (250ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, 250);
    } else {
      // Immediate on desktop
      onChange(newValue);
    }
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    registerCompletionProviders(monaco);
    
    // Expose editor instance to parent
    if (onEditorReady) {
      onEditorReady(editor);
    }
    
    // Quick line selection shortcut (Ctrl/Cmd+L)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {
      const position = editor.getPosition();
      if (position) {
        editor.setSelection(new monaco.Selection(
          position.lineNumber, 1,
          position.lineNumber, editor.getModel().getLineMaxColumn(position.lineNumber)
        ));
      }
    });
    
    const domNode = editor.getDomNode();
    if (domNode) {
      // Enhanced paste support using native paste event
      const textarea = domNode.querySelector('textarea');
      if (textarea) {
        textarea.addEventListener('paste', (e: ClipboardEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          const text = e.clipboardData?.getData('text/plain');
          if (text) {
            const selection = editor.getSelection();
            editor.executeEdits('paste', [{
              range: selection,
              text: text,
              forceMoveMarkers: true
            }]);
            editor.trigger('paste', 'type', { text: '' }); // Trigger change detection
          }
        });
      }
    }
    
    // Mobile-specific adjustments
    if (isMobile) {
      editor.updateOptions({
        lineHeight: 24,
        glyphMargin: false,
      });
      
      const domNode = editor.getDomNode();
      if (domNode) {
        // iOS Safari clipboard support
        domNode.setAttribute('contenteditable', 'true');
        
        // Long-press for context menu (with proper cancellation)
        let touchTimer: NodeJS.Timeout | null = null;
        let touchMoved = false;
        
        domNode.addEventListener('touchstart', (e: TouchEvent) => {
          if (e.touches.length === 1) {
            touchMoved = false;
            touchTimer = setTimeout(() => {
              if (!touchMoved) {
                editor.trigger('touch', 'editor.action.showContextMenu', null);
              }
            }, 800); // Increased to 800ms for less aggressive triggering
          }
        });
        
        domNode.addEventListener('touchmove', () => {
          touchMoved = true;
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }
        });
        
        domNode.addEventListener('touchend', () => {
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }
        });
        
        domNode.addEventListener('touchcancel', () => {
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }
        });
      }
    }
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      language={language}
      value={localValue}
      onChange={handleChange}
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
        quickSuggestions: !isMobile,
        suggestOnTriggerCharacters: !isMobile,
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
        scrollbar: isMobile ? {
          vertical: 'hidden' as const,
          horizontal: 'hidden' as const
        } : undefined,
        smoothScrolling: !isMobile,
        cursorBlinking: isMobile ? 'solid' as const : 'blink' as const,
        // Clipboard enhancements
        copyWithSyntaxHighlighting: true,
        emptySelectionClipboard: true,
        contextmenu: true,
        // Selection visibility
        renderLineHighlight: 'all',
        renderLineHighlightOnlyWhenFocus: false,
        columnSelection: false,
        // Mobile optimizations
        ...(isMobile ? {
          lineHeight: 24,
        } : {}),
      }}
    />
  );
};
