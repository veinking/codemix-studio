export interface NormalizedRSource {
  code: string;
  normalizedCount: number;
}

type RSourceMode = 'code' | 'single' | 'double' | 'backtick' | 'comment';

// R only treats ordinary source whitespace as safe parser boundaries. Rich-text
// clipboards and mobile keyboards can also supply Unicode separators, format
// marks, default-ignorable code points, object placeholders, or controls that
// Monaco renders invisibly but R rejects as source.
const R_SPACE_EQUIVALENTS = new Set([
  '\u00a0', '\u1680', '\u180e', '\u2000', '\u2001', '\u2002', '\u2003',
  '\u2004', '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200a',
  '\u202f', '\u205f', '\u3000',
]);
const R_LINE_EQUIVALENTS = new Set(['\u0085', '\u2028', '\u2029']);
const R_ZERO_WIDTH_CLIPBOARD_CHARS = new Set(['\u200b', '\u200c', '\u200d', '\u2060', '\ufeff']);
// U+FFFC is intentionally not Default_Ignorable_Code_Point. Rich-text editors
// use it as an invisible object placeholder, so it needs an explicit source rule.
const R_RICH_TEXT_PLACEHOLDER_CHARS = new Set(['\ufffc']);
const R_UNICODE_SPACE_PATTERN = /^\p{Zs}$/u;
const R_UNICODE_LINE_PATTERN = /^[\p{Zl}\p{Zp}]$/u;
const R_UNICODE_FORMAT_OR_CONTROL_PATTERN = /^[\p{Cf}\p{Cc}]$/u;
const R_DEFAULT_IGNORABLE_PATTERN = /^\p{Default_Ignorable_Code_Point}$/u;

/**
 * Normalize parser-hostile clipboard characters only while lexically outside
 * strings, backtick names, and comments so literal user data is never changed.
 */
export function normalizeRSourceForExecution(source: string): NormalizedRSource {
  let mode: RSourceMode = 'code';
  let escaped = false;
  let normalizedCount = 0;
  let code = '';

  for (const char of source) {
    if (mode === 'comment') {
      code += char;
      if (char === '\n' || char === '\r') mode = 'code';
      continue;
    }

    if (mode !== 'code') {
      code += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (
        (mode === 'single' && char === "'") ||
        (mode === 'double' && char === '"') ||
        (mode === 'backtick' && char === '`')
      ) {
        mode = 'code';
      }
      continue;
    }

    if (char === '#') {
      mode = 'comment';
      code += char;
      continue;
    }
    if (char === "'") {
      mode = 'single';
      code += char;
      continue;
    }
    if (char === '"') {
      mode = 'double';
      code += char;
      continue;
    }
    if (char === '`') {
      mode = 'backtick';
      code += char;
      continue;
    }

    // Preserve R's ordinary source whitespace without reporting it as repaired.
    // U+0020 is itself a Zs character, so this must run before the Unicode
    // separator fallback below.
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      code += char;
      continue;
    }

    if (R_SPACE_EQUIVALENTS.has(char)) {
      code += ' ';
      normalizedCount += 1;
      continue;
    }
    if (R_LINE_EQUIVALENTS.has(char)) {
      code += '\n';
      normalizedCount += 1;
      continue;
    }
    if (R_ZERO_WIDTH_CLIPBOARD_CHARS.has(char) || R_RICH_TEXT_PLACEHOLDER_CHARS.has(char)) {
      normalizedCount += 1;
      continue;
    }
    if (R_UNICODE_SPACE_PATTERN.test(char)) {
      code += ' ';
      normalizedCount += 1;
      continue;
    }
    if (R_UNICODE_LINE_PATTERN.test(char)) {
      code += '\n';
      normalizedCount += 1;
      continue;
    }
    if (
      R_DEFAULT_IGNORABLE_PATTERN.test(char) ||
      (R_UNICODE_FORMAT_OR_CONTROL_PATTERN.test(char) &&
        char !== '\t' && char !== '\n' && char !== '\r')
    ) {
      normalizedCount += 1;
      continue;
    }

    code += char;
  }

  return { code, normalizedCount };
}
