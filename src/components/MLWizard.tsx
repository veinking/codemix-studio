import { useState, useMemo } from "react";
import Papa from 'papaparse';
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Target, Settings, BarChart3, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface Dataset {
  headers: string[];
  data: string[][];
}

interface MLWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasets: Map<string, Dataset>;
  onInsertCode: (code: string) => void;
  language: 'python' | 'r';
  onLoadDataset?: (rows: any[], name: string) => void;
}

type ModelType = 'linear_regression' | 'ridge' | 'lasso' | 'random_forest_regressor' | 
                 'logistic_regression' | 'svm' | 'random_forest_classifier' | 'xgboost';
type ProblemType = 'regression' | 'classification';
type ScalingMethod = 'none' | 'standard' | 'minmax';
type MissingValueStrategy = 'drop' | 'mean' | 'median';

export const MLWizard = ({ open, onOpenChange, datasets, onInsertCode, language, onLoadDataset }: MLWizardProps) => {
  const [step, setStep] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [uploadedDataset, setUploadedDataset] = useState<Dataset | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [problemType, setProblemType] = useState<ProblemType>("regression");
  const [modelType, setModelType] = useState<ModelType>("linear_regression");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [testSize, setTestSize] = useState(20);
  const [scalingMethod, setScalingMethod] = useState<ScalingMethod>("standard");
  const [missingValueStrategy, setMissingValueStrategy] = useState<MissingValueStrategy>("mean");
  const [randomSeed, setRandomSeed] = useState(42);

  const datasetNames = Array.from(datasets.keys());
  const currentDataset = uploadedDataset || (selectedDataset ? datasets.get(selectedDataset) : null);
  const currentDatasetName = uploadedFileName || selectedDataset;
  const columns = currentDataset?.headers || [];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const result = Papa.parse<Record<string, any>>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (result.errors.length > 0) {
        toast.error('Error parsing CSV file');
        console.error(result.errors);
        return;
      }

      const headers = result.meta.fields || Object.keys(result.data[0] || {});
      const data = (result.data as any[]).map(row => headers.map(h => String(row?.[h] ?? '')));

      setUploadedDataset({ headers, data });
      setUploadedFileName(file.name);
      setSelectedDataset(''); // Clear any previously selected dataset
      
      // Optionally load to IDE datasets
      if (onLoadDataset && result.data.length > 0) {
        onLoadDataset(result.data, file.name);
      }

      toast.success(`Loaded ${file.name}: ${data.length} rows × ${headers.length} columns`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to load CSV file');
    }
  };

  // Detect column types
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

  const numericColumns = columns.filter(c => columnTypes.get(c) === 'numeric');
  const categoricalColumns = columns.filter(c => columnTypes.get(c) === 'categorical');

  const regressionModels = [
    { value: 'linear_regression', label: 'Linear Regression', desc: 'Fast, interpretable, works well for linear relationships' },
    { value: 'ridge', label: 'Ridge Regression', desc: 'Handles multicollinearity, prevents overfitting' },
    { value: 'lasso', label: 'Lasso Regression', desc: 'Feature selection, sparse models' },
    { value: 'random_forest_regressor', label: 'Random Forest', desc: 'Non-linear, robust, feature importance' },
  ];

  const classificationModels = [
    { value: 'logistic_regression', label: 'Logistic Regression', desc: 'Fast, interpretable, probability outputs' },
    { value: 'svm', label: 'Support Vector Machine', desc: 'Effective in high-dimensional spaces' },
    { value: 'random_forest_classifier', label: 'Random Forest', desc: 'Non-linear, handles imbalanced data' },
    { value: 'xgboost', label: 'XGBoost', desc: 'State-of-the-art, high performance' },
  ];

  const currentModels = problemType === 'regression' ? regressionModels : classificationModels;

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const selectAllFeatures = () => {
    const features = columns.filter(c => c !== targetColumn);
    setSelectedFeatures(features);
  };

  const handleNext = () => {
    if (step === 1 && !currentDataset) {
      toast.error("Please select or upload a dataset");
      return;
    }
    if (step === 2 && !targetColumn) {
      toast.error("Please select a target column");
      return;
    }
    if (step === 4 && selectedFeatures.length === 0) {
      toast.error("Please select at least one feature");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const generateCode = (): string => {
    if (language === 'r') {
      return generateRCode();
    }
    return generatePythonCode();
  };

  const generatePythonCode = (): string => {
    const features = selectedFeatures.join("', '");
    const scalingCode = scalingMethod === 'standard' 
      ? `\nscaler = StandardScaler()\nX_train = scaler.fit_transform(X_train)\nX_test = scaler.transform(X_test)`
      : scalingMethod === 'minmax'
      ? `\nscaler = MinMaxScaler()\nX_train = scaler.fit_transform(X_train)\nX_test = scaler.transform(X_test)`
      : '';

    const missingCode = missingValueStrategy === 'drop'
      ? `df = df.dropna()`
      : missingValueStrategy === 'mean'
      ? `df = df.fillna(df.mean())`
      : `df = df.fillna(df.median())`;

    const modelCode = {
      linear_regression: `model = LinearRegression()`,
      ridge: `model = Ridge(alpha=1.0, random_state=${randomSeed})`,
      lasso: `model = Lasso(alpha=1.0, random_state=${randomSeed})`,
      random_forest_regressor: `model = RandomForestRegressor(n_estimators=100, random_state=${randomSeed})`,
      logistic_regression: `model = LogisticRegression(random_state=${randomSeed})`,
      svm: `model = SVC(kernel='rbf', random_state=${randomSeed})`,
      random_forest_classifier: `model = RandomForestClassifier(n_estimators=100, random_state=${randomSeed})`,
      xgboost: `model = xgb.XGBClassifier(random_state=${randomSeed})`,
    }[modelType];

    const metricsCode = problemType === 'regression'
      ? `mse = mean_squared_error(y_test, y_pred)\nr2 = r2_score(y_test, y_pred)\nprint(f"MSE: {mse:.4f}")\nprint(f"R² Score: {r2:.4f}")`
      : `accuracy = accuracy_score(y_test, y_pred)\nprint(f"Accuracy: {accuracy:.4f}")\nprint("\\nClassification Report:")\nprint(classification_report(y_test, y_pred))\nprint("\\nConfusion Matrix:")\nprint(confusion_matrix(y_test, y_pred))`;

    const importsCode = problemType === 'regression'
      ? `from sklearn.linear_model import LinearRegression, Ridge, Lasso\nfrom sklearn.ensemble import RandomForestRegressor\nfrom sklearn.metrics import mean_squared_error, r2_score`
      : `from sklearn.linear_model import LogisticRegression\nfrom sklearn.svm import SVC\nfrom sklearn.ensemble import RandomForestClassifier\nimport xgboost as xgb\nfrom sklearn.metrics import accuracy_score, classification_report, confusion_matrix`;

    return `# ML Workflow: ${modelType.replace(/_/g, ' ').toUpperCase()}
# Dataset: ${currentDatasetName}
# Target: ${targetColumn}

import pandas as pd
import numpy as np
${importsCode}
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# Load dataset
df = pd.read_csv('${currentDatasetName}')

# Handle missing values
${missingCode}

# Select features and target
X = df[['${features}']]
y = df['${targetColumn}']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=${testSize / 100}, random_state=${randomSeed}
)
${scalingCode}

# Train model
${modelCode}
model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate model
${metricsCode}

print("\\nModel trained successfully!")
`;
  };

  const generateRCode = (): string => {
    return `# R ML Workflow coming soon...`;
  };

  const handleInsertCode = () => {
    const code = generateCode();
    onInsertCode(code);
    toast.success("ML workflow code inserted!");
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setStep(1);
    setSelectedDataset("");
    setUploadedDataset(null);
    setUploadedFileName("");
    setTargetColumn("");
    setProblemType("regression");
    setModelType("linear_regression");
    setSelectedFeatures([]);
    setTestSize(20);
    setScalingMethod("standard");
    setMissingValueStrategy("mean");
    setRandomSeed(42);
  };

  const stepIcons = [
    { icon: Target, label: "Dataset" },
    { icon: Target, label: "Target" },
    { icon: Brain, label: "Model" },
    { icon: CheckCircle2, label: "Features" },
    { icon: Settings, label: "Config" },
    { icon: BarChart3, label: "Review" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>ML Workflow Wizard</DialogTitle>
          <DialogDescription>
            Build machine learning workflows step-by-step - Step {step} of 6
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-4">
          {stepIcons.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                step > i + 1 ? 'bg-primary text-primary-foreground' :
                step === i + 1 ? 'bg-primary/20 text-primary border-2 border-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {/* Step 1: Select or Upload Dataset */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Existing Dataset</Label>
                  <Select 
                    value={selectedDataset} 
                    onValueChange={(value) => {
                      setSelectedDataset(value);
                      setUploadedDataset(null);
                      setUploadedFileName("");
                    }}
                    disabled={!!uploadedDataset}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetNames.length === 0 ? (
                        <SelectItem value="no-datasets" disabled>No datasets loaded</SelectItem>
                      ) : (
                        datasetNames.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload New CSV Dataset</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="flex-1"
                      disabled={!!selectedDataset}
                    />
                    {(uploadedDataset || selectedDataset) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadedDataset(null);
                          setUploadedFileName("");
                          setSelectedDataset("");
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {currentDataset && (
                  <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Dataset Info</div>
                      <Badge variant="outline">{currentDatasetName}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {currentDataset.data.length} rows × {currentDataset.headers.length} columns
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Columns:</div>
                      <div className="flex flex-wrap gap-2">
                        {currentDataset.headers.map((header) => (
                          <Badge key={header} variant={columnTypes.get(header) === 'numeric' ? 'default' : 'secondary'}>
                            {header}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Target & Problem Type */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Problem Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      onClick={() => {
                        setProblemType('regression');
                        setModelType('linear_regression');
                      }}
                      className={`p-4 border rounded-lg transition-all ${
                        problemType === 'regression' ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">Regression</div>
                      <div className="text-xs text-muted-foreground mt-1">Predict continuous values</div>
                    </button>
                    <button
                      onClick={() => {
                        setProblemType('classification');
                        setModelType('logistic_regression');
                      }}
                      className={`p-4 border rounded-lg transition-all ${
                        problemType === 'classification' ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">Classification</div>
                      <div className="text-xs text-muted-foreground mt-1">Predict categories</div>
                    </button>
                  </div>
                </div>

                <div>
                  <Label>Target Column (what you want to predict)</Label>
                  <Select value={targetColumn} onValueChange={setTargetColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {(problemType === 'regression' ? numericColumns : columns).map((col) => (
                        <SelectItem key={col} value={col}>
                          {col} <span className="text-xs text-muted-foreground">({columnTypes.get(col)})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Select Model */}
            {step === 3 && (
              <div className="space-y-4">
                <Label>Choose Model Type</Label>
                <div className="grid gap-3">
                  {currentModels.map((model) => (
                    <button
                      key={model.value}
                      onClick={() => setModelType(model.value as ModelType)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        modelType === model.value ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{model.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{model.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Feature Selection */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Select Features (inputs for prediction)</Label>
                  <Button variant="outline" size="sm" onClick={selectAllFeatures}>
                    Select All
                  </Button>
                </div>
                <div className="space-y-2">
                  {columns.filter(c => c !== targetColumn).map((col) => (
                    <div key={col} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50">
                      <Checkbox
                        checked={selectedFeatures.includes(col)}
                        onCheckedChange={() => toggleFeature(col)}
                      />
                      <label className="flex-1 cursor-pointer text-sm">
                        {col} <span className="text-xs text-muted-foreground">({columnTypes.get(col)})</span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
                </div>
              </div>
            )}

            {/* Step 5: Preprocessing & Configuration */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <Label>Train/Test Split: {testSize}% test</Label>
                  <Slider
                    value={[testSize]}
                    onValueChange={(v) => setTestSize(v[0])}
                    min={10}
                    max={40}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Feature Scaling</Label>
                  <Select value={scalingMethod} onValueChange={(v) => setScalingMethod(v as ScalingMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (raw values)</SelectItem>
                      <SelectItem value="standard">Standard (mean=0, std=1)</SelectItem>
                      <SelectItem value="minmax">Min-Max (0 to 1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Missing Values</Label>
                  <Select value={missingValueStrategy} onValueChange={(v) => setMissingValueStrategy(v as MissingValueStrategy)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drop">Drop rows</SelectItem>
                      <SelectItem value="mean">Fill with mean</SelectItem>
                      <SelectItem value="median">Fill with median</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Random Seed: {randomSeed}</Label>
                  <Slider
                    value={[randomSeed]}
                    onValueChange={(v) => setRandomSeed(v[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Review & Generate */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="p-4 border rounded space-y-3">
                  <h4 className="font-semibold">Workflow Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dataset:</span>
                      <div className="font-medium">{currentDatasetName}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Problem:</span>
                      <div className="font-medium capitalize">{problemType}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Model:</span>
                      <div className="font-medium">{currentModels.find(m => m.value === modelType)?.label}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target:</span>
                      <div className="font-medium">{targetColumn}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Features:</span>
                      <div className="font-medium">{selectedFeatures.length} selected</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Test Size:</span>
                      <div className="font-medium">{testSize}%</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded text-sm space-y-2">
                  <div className="font-medium">Selected Features:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeatures.map(f => (
                      <Badge key={f} variant="secondary">{f}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <div className="flex gap-2">
            {step < 6 ? (
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