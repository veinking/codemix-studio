from pathlib import Path

IDE = Path("src/pages/IDE.tsx")
text = IDE.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    text = text.replace(old, new, 1)
    print(f"patched: {label}")


replace_once(
    "  const previousOutputLength = React.useRef(0);\n  const editorRef = React.useRef<any>(null);",
    "  const previousOutputLength = React.useRef(0);\n  const editorRef = React.useRef<any>(null);\n  const starterFilesRef = React.useRef<FileItem[] | null>(null);",
    "starter file persistence ref",
)

replace_once(
    """  // First-run experience
  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('bide_visited');
    if (isFirstVisit) {
      setShowWelcome(true);
      localStorage.setItem('bide_visited', 'true');
      
      // Show notebook hint on mobile after 3 seconds (first-time users)
      if (isMobile && !activeFile) {""",
    """  // First-run experience. Keep a pending seed marker until the starter
  // workspace is actually committed to IndexedDB so an early reload cannot
  // strand a new guest with an empty workspace.
  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('bide_visited');
    const starterSeedPending = localStorage.getItem('bide_starter_seed_pending') === 'true';
    if (isFirstVisit || starterSeedPending) {
      if (isFirstVisit) {
        setShowWelcome(true);
        localStorage.setItem('bide_visited', 'true');
      }
      localStorage.setItem('bide_starter_seed_pending', 'true');
      
      // Show notebook hint on mobile after 3 seconds (first-time users)
      if (isFirstVisit && isMobile && !activeFile) {""",
    "first-run seed marker",
)

replace_once(
    """      setFiles(demoFiles);
      setActiveFile('demo-py');
      
      // Parse the demo CSV""",
    """      starterFilesRef.current = demoFiles;
      setFiles(demoFiles);
      setActiveFile('demo-py');
      
      // Parse the demo CSV""",
    "capture starter files",
)

replace_once(
    """        if (storedFiles.length > 0) {
          // Cast stored files to FileItem with proper language types
          const typedFiles = storedFiles.map(f => ({
            ...f,
            language: f.language as FileItem['language']
          }));
          setFiles(typedFiles);
          toast.success(`Loaded ${storedFiles.length} file(s) from storage`);
        }""",
    """        if (storedFiles.length > 0) {
          // Cast stored files to FileItem with proper language types
          const typedFiles = storedFiles.map(f => ({
            ...f,
            language: f.language as FileItem['language']
          }));
          setFiles(typedFiles);
          localStorage.removeItem('bide_starter_seed_pending');
          toast.success(`Loaded ${storedFiles.length} file(s) from storage`);
        } else if (localStorage.getItem('bide_starter_seed_pending') === 'true') {
          const starterFiles = starterFilesRef.current || [];
          if (starterFiles.length > 0) {
            for (const file of starterFiles) {
              await saveFile(file);
            }
            localStorage.removeItem('bide_starter_seed_pending');
            console.log(`[IDE] Persisted ${starterFiles.length} starter files`);
          }
        }""",
    "persist starter files after IndexedDB ready",
)

replace_once(
    """      // If CSV, parse and store as dataset
      if (language === 'csv') {
        parseCSV(content, file.name);
        addToConsole(`✓ Dataset loaded: ${file.name}`);
      }""",
    """      // If CSV, parse and store as dataset
      if (language === 'csv') {
        await parseCSV(content, file.name);
        addToConsole(`✓ Dataset loaded: ${file.name}`);
      }""",
    "await uploaded CSV parse",
)

replace_once(
    """    if (newFiles.length > 0) {
      setActiveFile(newFiles[0].id);
      toast.success(`Uploaded ${newFiles.length} file(s)`);
    }""",
    """    if (newFiles.length > 0) {
      const firstFile = newFiles[0];
      setActiveFile(firstFile.id);
      if (firstFile.language === 'csv') {
        setShowDataset(firstFile.name);
        setCsvViewMode('data');
      } else {
        setShowDataset(null);
      }
      toast.success(`Uploaded ${newFiles.length} file(s)`);
    }""",
    "show uploaded CSV immediately",
)

replace_once(
    """      const res = Papa.parse<Record<string, any>>(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });""",
    """      const res = Papa.parse<Record<string, any>>(content, {
        header: true,
        // Preserve source values exactly. Converting identifiers such as 00123
        // to numbers here destroys information before the user runs any code.
        dynamicTyping: false,
        skipEmptyLines: true,
      });""",
    "preserve CSV source strings",
)

old_fallback = """    } catch (e) {
      // Fallback to naive parser
      const lines = content.split('\\n').filter(line => line.trim());
      if (lines.length === 0) return;
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim())
      );
      setDatasets(prev => new Map(prev).set(fileName, { headers, data }));
      addToConsole(`✓ Loaded ${fileName}: ${data.length} rows × ${headers.length} columns`);
      
      // Write CSV to Python runtime virtual filesystem
      const runtime = RuntimeRegistry.get('python');
      if (runtime && runtime.isInitialized) {
        try {
          // @ts-ignore - writeCSVToFS exists on PythonRuntime
          await runtime.writeCSVToFS(fileName, content);
          console.log(`[IDE] Wrote ${fileName} to Pyodide FS`);
        } catch (err) {
          console.warn(`[IDE] Could not write ${fileName} to Pyodide FS:`, err);
        }
      }
    }
  };"""
new_fallback = """    } catch (e) {
      // Never fall back to splitting on commas: quoted commas/newlines are
      // valid CSV and a naive parser can silently change the user's data.
      console.error(`[IDE] Failed to parse ${fileName}:`, e);
      addToConsole(`✗ Failed to parse ${fileName} safely`, true);
      toast.error(`Could not parse ${fileName} safely`);
    }
  };"""
replace_once(old_fallback, new_fallback, "remove destructive naive CSV fallback")

replace_once(
    """  const handleCodeChange = async (value: string | undefined) => {
    if (!value) return;""",
    """  const handleCodeChange = async (value: string | undefined) => {
    // Empty string is a valid editor state. Only ignore Monaco's undefined.
    if (value === undefined) return;""",
    "allow files to be emptied normally",
)

replace_once(
    """          if (dataset) {
            // Convert dataset to CSV string
            const csvContent = [
              dataset.headers.join(','),
              ...dataset.data.map(row => row.join(','))
            ].join('\\n');
            
            try {""",
    """          if (dataset) {
            // Prefer the exact uploaded bytes. Rebuilding CSV with row.join(',')
            // destroys quoted commas/newlines. Generated in-memory datasets use
            // Papa.unparse so CSV escaping remains standards-compliant.
            const sourceFile = [...files]
              .reverse()
              .find(file => file.language === 'csv' && file.name === csvFilename);
            const csvContent = sourceFile?.content ?? Papa.unparse([
              dataset.headers,
              ...dataset.data,
            ]);
            
            try {""",
    "preserve CSV quoting when loading Python",
)

replace_once(
    """    // Mobile plot warning
    if (deviceType === 'mobile' && language === 'python' && code.includes('plt.')) {
      toast.info("Mobile Plotting", {
        description: "Complex plots may have limited rendering on mobile devices",
        duration: 5000,
      });
    }
    
""",
    "",
    "remove stale mobile plotting warning",
)

replace_once(
    """        } else if (deviceType === 'mobile' && result.output.includes("couldn't capture image")) {
          // Mobile plot capture failed - show helpful message
          toast.error("Plot Rendering Limited on Mobile", {
            description: "The code executed successfully, but couldn't display the plot. Try: (1) Simpler chart types like bar/line, (2) View on desktop, or (3) Download the code",
            duration: 8000,
          });
        }""",
    """        } else if (deviceType === 'mobile' && result.output.includes("couldn't capture image")) {
          toast.error("Plot rendering failed", {
            description: "bIDE expects supported plots to render in-browser. Close the viewer and retry the run.",
            duration: 6000,
          });
        }""",
    "browser-first plot failure copy",
)

replace_once(
    """  const handleDownload = () => {
    if (!activeFile) {
      // Download scratch content
      const ext = scratchLanguage === 'python' ? 'py' : 'r';""",
    """  const scratchExtension = (language: 'python' | 'r' | 'javascript' | 'sql') => ({
    python: 'py',
    r: 'r',
    javascript: 'js',
    sql: 'sql',
  }[language]);

  const handleDownload = () => {
    if (!activeFile) {
      // Download scratch content
      const ext = scratchExtension(scratchLanguage);""",
    "correct scratch download extension",
)

replace_once(
    """  const handleSaveScratchAsFile = async () => {
    const ext = scratchLanguage === 'python' ? 'py' : 'r';""",
    """  const handleSaveScratchAsFile = async () => {
    const ext = scratchExtension(scratchLanguage);""",
    "correct scratch save extension",
)

replace_once(
    """    // Parse and store as dataset
    parseCSV(content, file.name);
    addToConsole(`✓ Dataset loaded: ${file.name}`);
    
    setFiles((prev) => [...prev, fileItem]);
    setActiveFile(fileItem.id);""",
    """    // Parse and store as dataset
    await parseCSV(content, file.name);
    addToConsole(`✓ Dataset loaded: ${file.name}`);
    
    setFiles((prev) => [...prev, fileItem]);
    setActiveFile(fileItem.id);
    setShowDataset(fileItem.name);
    setCsvViewMode('data');""",
    "show mobile CSV upload immediately",
)

replace_once(
    """    if (!activeFile) {
      setScratchCode(template.code);
      if (template.language !== scratchLanguage) {
        handleLanguageChange(template.language);
      }
      toast.success(`Template \"${template.title}\" loaded!`);""",
    """    if (!activeFile) {
      // Switch language and content atomically; handleLanguageChange would load
      // the old target-language scratch buffer and overwrite the template.
      setLanguageCode(prev => ({
        ...prev,
        [scratchLanguage]: scratchCode,
        [template.language]: template.code,
      }));
      setScratchLanguage(template.language);
      setScratchCode(template.code);
      toast.success(`Template \"${template.title}\" loaded!`);""",
    "preserve cross-language template content",
)

replace_once(
    """    if (activeFile) {
      // If file is active, replace its content and update language
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFile
            ? { ...f, content: code, language: language }
            : f
        )
      );""",
    """    if (activeFile) {
      // If file is active, replace its content and update language, then persist
      // the translated version just like a normal editor change.
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id !== activeFile) return f;
          const updated = { ...f, content: code, language: language };
          if (dbReady) {
            saveFile(updated).catch((error) => console.error('Failed to persist translation:', error));
          }
          return updated;
        })
      );""",
    "persist translated active file",
)

replace_once(
    """      const res = Papa.parse<Record<string, any>>(currentFile.content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });""",
    """      const res = Papa.parse<Record<string, any>>(currentFile.content, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: true,
      });""",
    "preserve CSV strings in Data Lab preload",
)

replace_once(
    """      datasetName={currentFile ? files.find(f => f.id === activeFile)?.name : undefined}""",
    """      datasetName={currentFile?.language === 'csv' ? currentFile.name : showDataset || undefined}""",
    "only send real CSV name to Data Ops",
)

replace_once(
    """      {showWelcome && (
        <WelcomeOverlay onDismiss={() => setShowWelcome(false)} />
      )}

      <TranslateDialog""",
    """      <TranslateDialog""",
    "remove duplicate welcome overlay",
)

IDE.write_text(text)
print("solo data-integrity source patch complete")
