import { useMemo, useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

type Row = Record<string, any>;
type Analysis = {
  col: string;
  nulls: number;
  missingPct: number;
  numeric: boolean;
  uniqueCount: number;
  presentCount: number;
};

interface Props {
  onLoadDataset: (rows: Row[], name: string) => void;
  onInsertCode?: (code: string) => void;
  onOpenPlotBuilder?: () => void;
  language: 'python' | 'r';
  preloadedData?: { rows: Row[]; filename: string };
}

function looksLikeHighCardinalityIdentityField(column: string) {
  const normalized = column.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return /(^|_)(id|uuid|guid|name|first_name|last_name|full_name|customer_name|account_name|email|phone|mobile|address|street|invoice_number|account_number|customer_number)($|_)/.test(normalized);
}

export default function DataLab({ onLoadDataset, onInsertCode = () => {}, onOpenPlotBuilder, language, preloadedData }: Props) {
  const [filename, setFilename] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [analysis, setAnalysis] = useState<Analysis[]>([]);
  const [target, setTarget] = useState<string>('');
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [aiCode, setAiCode] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);
  const { isGuest } = useAuth();

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  useEffect(() => {
    if (!preloadedData || preloadedData.rows.length === 0) return;
    if (preloadedData.filename !== filename) {
      setFilename(preloadedData.filename);
      setRows(preloadedData.rows);
      setAnalysis(analyzeDataset(preloadedData.rows));
    }
  }, [preloadedData, filename]);

  const handleFile = (file: File) => {
    setFilename(file.name);
    Papa.parse<Row>(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data.filter(r => Object.keys(r).length > 0);
        setRows(data);
        onLoadDataset(data, file.name);
        toast.success(`Loaded ${data.length.toLocaleString()} rows`);
        setAnalysis(analyzeDataset(data));
      },
      error: (e) => toast.error(`CSV parse error: ${e.message}`),
    });
  };

  const analyzeDataset = (data: Row[]): Analysis[] => {
    if (!data.length) return [];
    const cols = Object.keys(data[0]);
    const looksNumeric = (value: unknown) => {
      if (typeof value === 'number') return Number.isFinite(value);
      if (typeof value !== 'string') return false;
      const text = value.trim();
      if (!text) return false;
      return /^[-+]?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(text);
    };

    return cols.map(col => {
      const vals = data.map(r => r[col]);
      const nulls = vals.filter(v => v === '' || v == null || Number.isNaN(v)).length;
      const missingPct = data.length ? nulls / data.length : 0;
      const present = vals.filter(v => v !== '' && v != null);
      const numeric = present.length > 0 && present.every(looksNumeric);
      const uniqueCount = new Set(present.map(value => String(value).trim()).filter(Boolean)).size;
      return { col, nulls, missingPct, numeric, uniqueCount, presentCount: present.length };
    });
  };

  const suggestActions = (): string[] => {
    const s: string[] = [];
    analysis.forEach(a => {
      if (a.missingPct > 0.1) s.push(`Consider imputing or dropping "${a.col}" (missing ${(a.missingPct*100).toFixed(1)}%)`);
      if (a.numeric) s.push(`Plot histogram/boxplot for "${a.col}"`);

      const uniqueRatio = a.presentCount ? a.uniqueCount / a.presentCount : 1;
      const usefulCategory = !a.numeric
        && a.uniqueCount >= 2
        && a.uniqueCount <= 30
        && uniqueRatio <= 0.6
        && !looksLikeHighCardinalityIdentityField(a.col);
      if (usefulCategory) s.push(`Categorical bar chart for "${a.col}"`);
    });
    if (target) s.push(`Try correlation/feature importance vs target "${target}"`);
    return Array.from(new Set(s));
  };

  const pythonBoilerplate = (csvName: string) => {
    const quotedCsvName = JSON.stringify(csvName);
    return `# Load required packages from Pyodide (offline-friendly)
import pyodide
await pyodide.loadPackage(['pandas','matplotlib'])

import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv(${quotedCsvName})

# Basic info
print(df.shape)
print(df.head())
print(df.isna().mean().sort_values(ascending=False))

# Impute numerics with mean
num_cols = df.select_dtypes(include='number').columns
df[num_cols] = df[num_cols].fillna(df[num_cols].mean())

# Example plot: histogram for numeric columns
df[num_cols].hist(figsize=(10,6))
plt.tight_layout()
plt.show()
`;
  };

  const rBoilerplate = (csvName: string) => {
    const quotedCsvName = JSON.stringify(csvName);
    return `
library(readr); library(dplyr); library(ggplot2)
df <- read_csv(${quotedCsvName})
glimpse(df)
num_cols <- names(df)[sapply(df, is.numeric)]
for (col in num_cols) {
  df[[col]][is.na(df[[col]])] <- mean(df[[col]], na.rm = TRUE)
}
# Example plot: first numeric column
if (length(num_cols) > 0) {
  ggplot(df, aes(x = .data[[num_cols[1]]])) + geom_histogram() + theme_minimal()
}
`;
  };

  const mkCode = () => {
    if (!filename) {
      toast.error('Load a CSV first');
      return '';
    }
    if (language === 'python') return pythonBoilerplate(filename);
    return rBoilerplate(filename);
  };

  const clearData = () => {
    setRows([]);
    setAnalysis([]);
    setFilename('');
    setTarget('');
    setAiRecommendations([]);
    setAiCode('');
    setShowAiSection(false);
  };

  const askAI = async () => {
    if (rows.length === 0) return;
    setIsLoadingAI(true);
    setShowAiSection(true);

    try {
      const { data, error } = await supabase.functions.invoke('data-advisor', {
        body: {
          headers: columns,
          sampleRows: rows.slice(0, 10),
          targetColumn: target,
          language
        }
      });

      if (error) {
        console.error('AI advisor error:', error);
        toast.error('Failed to get AI recommendations');
        return;
      }

      setAiRecommendations(data.recommendations || []);
      setAiCode(data.suggestedCode || '');
      toast.success('AI recommendations ready!');
    } catch (err) {
      console.error('Error calling AI advisor:', err);
      toast.error('Failed to connect to AI advisor');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>DataLab</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {!preloadedData && (
            <input
              type="file"
              accept=".csv,text/csv"
              aria-label="Upload CSV to DataLab"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
          )}
          {columns.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm">Target (optional)</span>
                <Select value={target || "none"} onValueChange={(val) => setTarget(val === "none" ? "" : val)}>
                  <SelectTrigger className="w-48" aria-label="Choose optional target column">
                    <SelectValue placeholder="Pick column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-muted-foreground italic">
                      None (Clear Selection)
                    </SelectItem>
                    {columns.filter(c => c && c.trim()).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {onOpenPlotBuilder && (
                <Button variant="default" onClick={onOpenPlotBuilder}>
                  📊 Create Plot
                </Button>
              )}
              <Button variant="secondary" onClick={() => onInsertCode(mkCode())}>
                Insert Cleaning & Plots ({language.toUpperCase()})
              </Button>
              <Button variant="outline" onClick={askAI} disabled={isLoadingAI || isGuest}>
                {isLoadingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  'Ask AI for Next Steps'
                )}
              </Button>
              <Button variant="outline" onClick={clearData}>
                Clear & Upload New
              </Button>
            </>
          )}
        </div>

        {rows.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <b>{filename}</b> • {rows.length.toLocaleString()} rows • {columns.length} columns
          </div>
        )}

        {isGuest && rows.length > 0 && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              AI data recommendations use the same PocketBI ID as the rest of bIDE. Connect a free PocketBI ID to use the included AI requests.{" "}
              <Link to="/auth" className="font-semibold underline">
                Connect PocketBI ID
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {showAiSection && (
          <Collapsible open={true} className="space-y-2">
            <CollapsibleTrigger className="flex items-center gap-2 w-full">
              <ChevronDown className="w-4 h-4" />
              <span className="font-medium">AI Recommendations</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              {isLoadingAI ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing your data...</span>
                </div>
              ) : (
                <>
                  {aiRecommendations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Suggested Next Steps:</div>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        {aiRecommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiCode && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Generated Code:</div>
                      <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                        {aiCode}
                      </pre>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onInsertCode(aiCode);
                          toast.success('AI code inserted into editor');
                        }}
                      >
                        Insert AI Code
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium">Data Preview</div>
            <div className="max-h-80 overflow-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {columns.map(c => (
                      <th key={c} className="px-2 py-2 text-left font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className="border-t">
                      {columns.map(c => (
                        <td key={c} className="px-2 py-1 whitespace-nowrap">
                          {String(r[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <div className="text-xs text-muted-foreground text-center">
                Showing first 100 rows of {rows.length.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {analysis.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium">Recommendations</div>
            <ul className="list-disc pl-5 text-sm">
              {suggestActions().map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
