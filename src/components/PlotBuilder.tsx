import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, LineChart, ScatterChart, BarChart, Activity, Grid3x3 } from "lucide-react";
import { BarChart as RechartsBar, Bar, LineChart as RechartsLine, Line, ScatterChart as RechartsScatter, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { generatePythonPlot, generateRPlot, PlotConfig } from "@/utils/plotCodeGenerator";
import { toast } from "sonner";
import { useDeviceType } from "@/hooks/useDeviceType";

interface Dataset {
  headers: string[];
  data: string[][];
}

interface PlotBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasets: Map<string, Dataset>;
  onInsertCode: (code: string) => void;
  language: 'python' | 'r';
}

type ChartType = 'bar' | 'line' | 'scatter' | 'histogram' | 'box' | 'heatmap';

export const PlotBuilder = ({ open, onOpenChange, datasets, onInsertCode, language }: PlotBuilderProps) => {
  const { isMobile } = useDeviceType();
  const [step, setStep] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [colorColumn, setColorColumn] = useState("");
  const [title, setTitle] = useState("");
  const [xLabel, setXLabel] = useState("");
  const [yLabel, setYLabel] = useState("");

  const datasetNames = Array.from(datasets.keys());
  const currentDataset = selectedDataset ? datasets.get(selectedDataset) : null;
  const columns = currentDataset?.headers || [];

  // Detect column types for smart suggestions
  const columnTypes = useMemo(() => {
    if (!currentDataset) return new Map<string, 'numeric' | 'categorical'>();
    
    const types = new Map<string, 'numeric' | 'categorical'>();
    currentDataset.headers.forEach((header, index) => {
      const sampleValues = currentDataset.data.slice(0, 20).map(row => row[index]);
      const numericCount = sampleValues.filter(v => !isNaN(Number(v))).length;
      types.set(header, numericCount > sampleValues.length * 0.7 ? 'numeric' : 'categorical');
    });
    return types;
  }, [currentDataset]);

  // Auto-suggest columns based on chart type
  const suggestColumns = () => {
    if (!currentDataset || columns.length === 0) return;

    const numericCols = columns.filter(c => columnTypes.get(c) === 'numeric');
    const categoricalCols = columns.filter(c => columnTypes.get(c) === 'categorical');

    if (chartType === 'histogram' || chartType === 'box') {
      setXColumn(numericCols[0] || columns[0]);
      setYColumn("");
    } else if (chartType === 'bar') {
      setXColumn(categoricalCols[0] || columns[0]);
      setYColumn(numericCols[0] || columns[1] || "");
    } else {
      setXColumn(numericCols[0] || columns[0]);
      setYColumn(numericCols[1] || columns[1] || "");
    }
  };

  // Preview data for Recharts
  const previewData = useMemo(() => {
    if (!currentDataset || !xColumn) return [];
    
    const xIndex = currentDataset.headers.indexOf(xColumn);
    const yIndex = yColumn ? currentDataset.headers.indexOf(yColumn) : -1;
    
    return currentDataset.data.slice(0, 20).map((row, i) => ({
      x: row[xIndex] || `Row ${i}`,
      y: yIndex >= 0 ? Number(row[yIndex]) || 0 : 1,
    }));
  }, [currentDataset, xColumn, yColumn]);

  const chartTypeOptions = [
    { value: 'bar', label: 'Bar Chart', icon: BarChart3, tooltip: 'Compare values across categories' },
    { value: 'line', label: 'Line Chart', icon: LineChart, tooltip: 'Show trends over time or continuous data' },
    { value: 'scatter', label: 'Scatter Plot', icon: ScatterChart, tooltip: 'Show relationship between two variables' },
    { value: 'histogram', label: 'Histogram', icon: BarChart, tooltip: 'Show distribution of a single variable' },
    { value: 'box', label: 'Box Plot', icon: Activity, tooltip: 'Show statistical distribution with quartiles' },
    { value: 'heatmap', label: 'Heatmap', icon: Grid3x3, tooltip: 'Show patterns in matrix data' },
  ];

  const handleNext = () => {
    if (step === 1 && !selectedDataset) {
      toast.error("Please select a dataset");
      return;
    }
    if (step === 2) {
      suggestColumns();
    }
    if (step === 3 && !xColumn) {
      toast.error("Please select at least an X-axis column");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleInsertCode = () => {
    if (!selectedDataset || !xColumn) {
      toast.error("Missing required fields");
      return;
    }

    const config: PlotConfig = {
      dataset: selectedDataset,
      chartType,
      xColumn,
      yColumn: yColumn || undefined,
      colorColumn: colorColumn || undefined,
      title: title || `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      xLabel: xLabel || xColumn,
      yLabel: yLabel || (yColumn || "Value"),
      theme: 'default',
    };

    const code = language === 'python' ? generatePythonPlot(config, isMobile) : generateRPlot(config);
    onInsertCode(code);
    
    // Check if dataset is available and show appropriate message
    if (datasets.has(selectedDataset)) {
      toast.success(`${language.toUpperCase()} plot code inserted. Dataset "${selectedDataset}" will be loaded automatically.`);
    } else {
      toast.warning(`Plot code inserted, but dataset "${selectedDataset}" may not be available.`);
    }
    
    onOpenChange(false);
    
    // Reset state
    setStep(1);
    setSelectedDataset("");
    setChartType("bar");
    setXColumn("");
    setYColumn("");
    setColorColumn("");
    setTitle("");
    setXLabel("");
    setYLabel("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Data Visualization Builder</DialogTitle>
          <DialogDescription>
            Create beautiful charts from your data - Step {step} of 4
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-1">
            {/* Step 1: Select Dataset */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>Select Dataset</Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentDataset && (
                  <div className="p-4 border rounded space-y-2">
                    <div className="text-sm font-medium">Dataset Info</div>
                    <div className="text-sm text-muted-foreground">
                      {currentDataset.data.length} rows × {currentDataset.headers.length} columns
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentDataset.headers.map((header) => (
                        <Badge key={header} variant="secondary">
                          {header}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Choose Chart Type */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Chart Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {chartTypeOptions.map((option) => (
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
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Map Columns */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label>X-Axis Column *</Label>
                    <Select value={xColumn} onValueChange={setXColumn}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col} <span className="text-xs text-muted-foreground">({columnTypes.get(col)})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {chartType !== 'histogram' && chartType !== 'box' && (
                    <div>
                      <Label>Y-Axis Column {chartType === 'bar' ? '*' : ''}</Label>
                      <Select value={yColumn} onValueChange={setYColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col} <span className="text-xs text-muted-foreground">({columnTypes.get(col)})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {chartType === 'scatter' && (
                    <div>
                      <Label>Color/Group Column (optional)</Label>
                      <Select value={colorColumn} onValueChange={setColorColumn}>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {columns.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-muted rounded-lg text-sm">
                  <div className="font-medium mb-2">💡 Smart Suggestions:</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Bar charts: use categorical X, numeric Y</li>
                    <li>• Line charts: ideal for time series or trends</li>
                    <li>• Scatter: shows relationships between two numeric variables</li>
                    <li>• Histogram/Box: displays distribution of a single variable</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 4: Customize & Preview */}
            {step === 4 && (
              <div className="space-y-4">
                <Tabs defaultValue="customize" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="customize" className="flex-1">Customize</TabsTrigger>
                    <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="customize">
                    <div className="space-y-3">
                      <div>
                        <Label>Chart Title</Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`}
                        />
                      </div>
                      <div>
                        <Label>X-Axis Label</Label>
                        <Input
                          value={xLabel}
                          onChange={(e) => setXLabel(e.target.value)}
                          placeholder={xColumn}
                        />
                      </div>
                      <div>
                        <Label>Y-Axis Label</Label>
                        <Input
                          value={yLabel}
                          onChange={(e) => setYLabel(e.target.value)}
                          placeholder={yColumn || "Value"}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview">
                    <div>
                      <div className="border rounded-lg p-4 bg-background">
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
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <div className="flex gap-2">
            {step < 4 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleInsertCode}>
                Insert {language.toUpperCase()} Code
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
