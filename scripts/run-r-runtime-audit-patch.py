from pathlib import Path
import subprocess
import sys

patch = Path(__file__).with_name('apply-r-runtime-audit.py')
lines = patch.read_text().splitlines()
fixed = False
for index, line in enumerate(lines):
    if 'rmarkdown:' in line and 'rmd' in line and line.lstrip().startswith('r"'):
        lines[index] = "    r\"\\n  rmarkdown: \\{ extension: '\\.rmd'.*?\\n  text:\"," 
        fixed = True
        break
if not fixed:
    raise RuntimeError('Could not locate R Markdown regex in audit patch')
patch.write_text('\n'.join(lines) + '\n')
subprocess.run([sys.executable, str(patch)], check=True)
Path(__file__).unlink()
