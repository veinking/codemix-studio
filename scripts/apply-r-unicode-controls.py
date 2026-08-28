from pathlib import Path

runtime_path = Path('src/runtimes/RRuntime.ts')
guard_path = Path('scripts/check-r-runtime-workflow.mjs')

runtime = runtime_path.read_text()
needle = "const R_ZERO_WIDTH_CLIPBOARD_CHARS = new Set(['\\u200b', '\\u200c', '\\u200d', '\\u2060', '\\ufeff']);\n"
replacement = needle + "const R_UNICODE_SPACE_PATTERN = /^\\p{Zs}$/u;\nconst R_UNICODE_LINE_PATTERN = /^[\\p{Zl}\\p{Zp}]$/u;\nconst R_UNICODE_FORMAT_OR_CONTROL_PATTERN = /^[\\p{Cf}\\p{Cc}]$/u;\n"
if needle not in runtime:
    raise SystemExit('runtime constant anchor not found')
runtime = runtime.replace(needle, replacement, 1)

needle2 = "    if (R_ZERO_WIDTH_CLIPBOARD_CHARS.has(char)) {\n      normalizedCount += 1;\n      continue;\n    }\n\n    code += char;\n"
replacement2 = "    if (R_ZERO_WIDTH_CLIPBOARD_CHARS.has(char)) {\n      normalizedCount += 1;\n      continue;\n    }\n    // Catch the rest of Unicode separator/format/control characters that mobile\n    // keyboards and rich-text clipboards can insert invisibly. Preserve the\n    // ordinary ASCII source controls R expects; never touch literals/comments.\n    if (R_UNICODE_SPACE_PATTERN.test(char)) {\n      code += ' ';\n      normalizedCount += 1;\n      continue;\n    }\n    if (R_UNICODE_LINE_PATTERN.test(char)) {\n      code += '\\n';\n      normalizedCount += 1;\n      continue;\n    }\n    if (\n      R_UNICODE_FORMAT_OR_CONTROL_PATTERN.test(char) &&\n      char !== '\\t' && char !== '\\n' && char !== '\\r'\n    ) {\n      normalizedCount += 1;\n      continue;\n    }\n\n    code += char;\n"
if needle2 not in runtime:
    raise SystemExit('runtime normalization anchor not found')
runtime = runtime.replace(needle2, replacement2, 1)
runtime_path.write_text(runtime)

guard = guard_path.read_text()
anchor = "assert(runtime.includes(\"R_ZERO_WIDTH_CLIPBOARD_CHARS\"), 'R runtime must handle zero-width clipboard characters');\n"
extra = anchor + "assert(runtime.includes('R_UNICODE_SPACE_PATTERN'), 'R runtime must cover all Unicode space separators outside literals/comments');\nassert(runtime.includes('R_UNICODE_LINE_PATTERN'), 'R runtime must cover all Unicode line/paragraph separators outside literals/comments');\nassert(runtime.includes('R_UNICODE_FORMAT_OR_CONTROL_PATTERN'), 'R runtime must remove otherwise-invalid Unicode format/control characters outside literals/comments');\nassert(runtime.includes(\"char !== '\\\\t'\") && runtime.includes(\"char !== '\\\\n'\") && runtime.includes(\"char !== '\\\\r'\"), 'R sanitizer must preserve ordinary tab/newline/carriage-return source controls');\n"
if anchor not in guard:
    raise SystemExit('guard anchor not found')
guard = guard.replace(anchor, extra, 1)
guard_path.write_text(guard)
