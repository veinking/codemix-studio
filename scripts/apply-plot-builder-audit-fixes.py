from pathlib import Path

PATH = Path('src/components/PlotBuilder.tsx')
text = PATH.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    text = text.replace(old, new, 1)
    print(f'patched: {label}')

replace_once(
    'import { BarChart as RechartsBar, Bar, LineChart as RechartsLine, Line, ScatterChart as RechartsScatter, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";',
    'import { BarChart as RechartsBar, Bar, LineChart as RechartsLine, Line, ScatterChart as RechartsScatter, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";',
    'remove unused legend import',
)

replace_once(
    """  // Detect column types for smart suggestions
  const columnTypes = useMemo(() => {
    if (!currentDataset) return new Map<string, 'numeric' | 'categorical'>();
    
    const types = new Map<string, 'numeric' | 'categorical'>();
    currentDataset.headers.forEach((header, index) => {
      const sampleValues = currentDataset.data.slice(0, 20).map(row => row[index]);
      const numericCount = sampleValues.filter(v => !isNaN(Number(v))).length;
      types.set(header, numericCount > sampleValues.length * 0.7 ? 'numeric' : 'categorical');
    });
    return types;
  }, [currentDataset]);""",
    """  // Detect column types for suggestions without coercing source values.
  // Leading-zero IDs such as 00123 should remain categorical identifiers.
  const columnTypes = useMemo(() => {
    if (!currentDataset) return new Map<string, 'numeric' | 'categorical'>();

    const looksNumeric = (value: string) => {
      const candidate = String(value ?? '').trim();
      if (!candidate) return false;
      return /^[-+]?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][-+]?\\d+)?$/.test(candidate);
    };

    const types = new Map<string, 'numeric' | 'categorical'>();
    currentDataset.headers.forEach((header, index) => {
      const sampleValues = currentDataset.data
        .slice(0, 20)
        .map(row => row[index])
        .filter(value => String(value ?? '').trim() !== '');
      const numericCount = sampleValues.filter(looksNumeric).length;
      const numeric = sampleValues.length > 0 && numericCount > sampleValues.length * 0.7;
      types.set(header, numeric ? 'numeric' : 'categorical');
    });
    return types;
  }, [currentDataset]);""",
    'source-preserving plot column inference',
)

replace_once(
    """  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3, tooltip: 'Compare values across categories' },
    { value: 'line', label: 'Line Chart', icon: LineChart, tooltip: 'Show trends over time or continuous data' },
    { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart, tooltip: 'Show relationship between two variables' },
    { value: 'histogram', label: 'Histogram', icon: BarChart, tooltip: 'Show distribution of a single variable' },
    { value: 'box', label: 'Box Plot', icon: Activity, tooltip: 'Show statistical distribution with quartiles' },
    { value: 'heatmap', label: 'Heatmap', icon: Grid3x3, tooltip: 'Show patterns in matrix data' },
  ];

  const handleNext = () => {""",
    """  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3, tooltip: 'Compare values across categories' },
    { value: 'line', label: 'Line Chart', icon: LineChart, tooltip: 'Show trends over time or continuous data' },
    { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart, tooltip: 'Show relationship between two variables' },
    { value: 'histogram', label: 'Histogram', icon: BarChart, tooltip: 'Show distribution of a single variable' },
    { value: 'box', label: 'Box Plot', icon: Activity, tooltip: 'Show statistical distribution with quartiles' },
    { value: 'heatmap', label: 'Heatmap', icon: Grid3x3, tooltip: 'Show patterns in matrix data' },
  ];

  const requiresYColumn = (type: ChartType) => ['bar', 'line', 'scatter'].includes(type);

  const handleNext = () => {""",
    'chart y requirement helper',
)

replace_once(
    """    if (step === 3 && !xColumn) {
      toast.error("Please select at least an X-axis column");
      return;
    }
    setStep(step + 1);""",
    """    if (step === 3 && !xColumn) {
      toast.error("Please select at least an X-axis column");
      return;
    }
    if (step === 3 && requiresYColumn(chartType) && !yColumn) {
      toast.error("Please select a Y-axis column for this chart");
      return;
    }
    setStep(step + 1);""",
    'validate y column before customize',
)

replace_once(
    """    if (!selectedDataset || !xColumn) {
      toast.error("Missing required fields");
      return;
    }

    const config: PlotConfig = {""",
    """    if (!selectedDataset || !xColumn || (requiresYColumn(chartType) && !yColumn)) {
      toast.error("Missing required fields");
      return;
    }

    const config: PlotConfig = {""",
    'validate y column before generation',
)

replace_once(
    """      yLabel: yLabel || (yColumn || "Value"),""",
    """      yLabel: yLabel || (chartType === 'box' ? xColumn : (yColumn || "Value")),""",
    'box y label defaults to selected value',
)

replace_once(
    """                    {chartTypeOptions.map((option) => {
                      const isComplexForMobile = isMobile && ['heatmap', 'box'].includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => setChartType(option.value as ChartType)}
                          className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                            chartType === option.value
                              ? "border-primary bg-primary/10"
                              : "hover:border-primary/50"
                          } ${isComplexForMobile ? 'opacity-60' : ''}`}
                        >
                          <option.icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground text-center">
                            {option.tooltip}
                          </span>
                          {isComplexForMobile && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 text-center mt-1">
                              ⚠️ May not render on mobile
                            </span>
                          )}
                        </button>
                      );
                    })}""",
    """                    {chartTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setChartType(option.value as ChartType)}
                        className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
                          chartType === option.value
                            ? "border-primary bg-primary/10"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <option.icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground text-center">
                          {option.tooltip}
                        </span>
                      </button>
                    ))}""",
    'remove stale mobile chart warnings',
)

replace_once(
    """                {isMobile && (chartType === 'heatmap' || chartType === 'box') && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                    📱 <strong>Mobile Warning:</strong> This chart type may not render properly on mobile devices. Consider using bar or line charts for better mobile compatibility.
                  </div>
                )}
""",
    "",
    'remove obsolete mobile warning panel',
)

replace_once(
    """                      <Select value={colorColumn} onValueChange={setColorColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>""",
    """                      <Select
                        value={colorColumn || '__none__'}
                        onValueChange={(value) => setColorColumn(value === '__none__' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>""",
    'use non-empty scatter color sentinel',
)

replace_once(
    """                      <div className="border rounded-lg p-4 bg-background">
                        <ResponsiveContainer width="100%" height={300}>
                          <>
                            {chartType === 'bar' && (
                              <RechartsBar data={previewData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="x" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="y" fill="hsl(var(--primary))" />
                              </RechartsBar>
                            )}
                            {chartType === 'line' && (
                              <RechartsLine data={previewData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="x" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" />
                              </RechartsLine>
                            )}
                            {(chartType === 'scatter' || chartType === 'histogram' || chartType === 'box' || chartType === 'heatmap') && (
                              <RechartsScatter data={previewData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="x" />
                                <YAxis dataKey="y" />
                                <Tooltip />
                                <Scatter fill="hsl(var(--primary))" />
                              </RechartsScatter>
                            )}
                          </>
                        </ResponsiveContainer>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Preview (first 20 rows)
                        </p>
                      </div>""",
    """                      <div className="border rounded-lg p-4 bg-background min-h-[330px]">
                        {chartType === 'bar' && (
                          <ResponsiveContainer width="100%" height={300}>
                            <RechartsBar data={previewData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="x" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="y" fill="hsl(var(--primary))" />
                            </RechartsBar>
                          </ResponsiveContainer>
                        )}
                        {chartType === 'line' && (
                          <ResponsiveContainer width="100%" height={300}>
                            <RechartsLine data={previewData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="x" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" />
                            </RechartsLine>
                          </ResponsiveContainer>
                        )}
                        {chartType === 'scatter' && (
                          <ResponsiveContainer width="100%" height={300}>
                            <RechartsScatter data={previewData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="x" />
                              <YAxis dataKey="y" />
                              <Tooltip />
                              <Scatter fill="hsl(var(--primary))" />
                            </RechartsScatter>
                          </ResponsiveContainer>
                        )}
                        {(chartType === 'histogram' || chartType === 'box' || chartType === 'heatmap') && (
                          <div className="h-[300px] flex items-center justify-center text-center px-6">
                            <div className="space-y-2">
                              <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground" />
                              <p className="font-medium">Exact preview appears when you run the generated code</p>
                              <p className="text-sm text-muted-foreground">
                                bIDE will render this {chartType} with the browser runtime using the full dataset.
                              </p>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {chartType === 'bar' || chartType === 'line' || chartType === 'scatter'
                            ? 'Preview (first 20 rows)'
                            : 'Runtime-rendered chart'}
                        </p>
                      </div>""",
    'make plot previews truthful and responsive-container safe',
)

PATH.write_text(text)
print('Plot Builder UI audit patch complete')
