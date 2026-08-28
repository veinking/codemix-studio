from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ide = ROOT / 'src/pages/IDE.tsx'
text = ide.read_text()
old = """    try {
      await runtime.installPackage(packageName);
      if (language === 'python' || language === 'r') {
"""
new = """    try {
      // Packages can be the user's first interaction with a runtime. Initialize
      // it here instead of requiring a throwaway code run before installation.
      if (!runtime.isInitialized) {
        setLoadingRuntimes(prev => new Set(prev).add(language));
        try {
          await runtime.initialize(isMobile);
          setInitializedRuntimes(prev => new Set(prev).add(language));
          addToConsole(`✓ ${runtime.config.displayName} environment ready!`);
        } finally {
          setLoadingRuntimes(prev => {
            const next = new Set(prev);
            next.delete(language);
            return next;
          });
        }
      }

      await runtime.installPackage(packageName);
      if (language === 'python' || language === 'r') {
"""
if old not in text:
    raise RuntimeError('Could not locate package install call in IDE')
ide.write_text(text.replace(old, new, 1))

guard = ROOT / 'scripts/check-r-runtime-workflow.mjs'
gtext = guard.read_text()
needle = "assert(ide.includes('installedPackagesByLanguage'), 'Python and R package badges must not share one list');\n"
insert = needle + "assert(ide.includes('if (!runtime.isInitialized)') && ide.includes('await runtime.initialize(isMobile)'), 'package installation must initialize its runtime when needed');\n"
if needle not in gtext:
    raise RuntimeError('Could not locate R package state guard')
guard.write_text(gtext.replace(needle, insert, 1))

(ROOT / '.github/workflows/apply-r-package-init.yml').unlink()
Path(__file__).unlink()
