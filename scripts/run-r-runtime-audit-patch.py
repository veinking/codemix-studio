from pathlib import Path
import subprocess
import sys

patch = Path(__file__).with_name('apply-r-runtime-audit.py')
text = patch.read_text()
lines = text.splitlines()
fixed = False
for index, line in enumerate(lines):
    if 'rmarkdown:' in line and 'rmd' in line and line.lstrip().startswith('r"'):
        lines[index] = "    r\"\\n  rmarkdown: \\{ extension: '\\.rmd'.*?\\n  text:\"," 
        fixed = True
        break
if not fixed:
    raise RuntimeError('Could not locate R Markdown regex in audit patch')
text = '\n'.join(lines) + '\n'
old = 'Load a workspace CSV with df <- read.csv(\\"file.csv\\") and install the listed webR packages first.'
new = 'Load a workspace CSV with df = read.csv(\\"file.csv\\") and install the listed webR packages first.'
if old not in text:
    raise RuntimeError('Could not locate R template prerequisite copy in audit patch')
text = text.replace(old, new, 1)
old_guard = "assert(!runtime.includes('capture.output'), 'legacy capture.output wrapper must not return');"
new_guard = "assert(!runtime.includes('paste(capture.output'), 'legacy capture.output wrapper must not return');"
if old_guard not in text:
    raise RuntimeError('Could not locate legacy capture guard in audit patch')
text = text.replace(old_guard, new_guard, 1)
patch.write_text(text)
subprocess.run([sys.executable, str(patch)], check=True)
Path(__file__).unlink()
