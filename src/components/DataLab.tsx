import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Row = Record<string, any>;
type Analysis = {
  col: string;
  nulls: number;
  missingPct: number;
  numeric: boolean;
  uniqueCount: number;
};

interface Props {
  onLoadDataset: (rows: Row[], name: string) => void;
  onInsertCode?: (code: string) => void;
  language: 'python' | 'r';
  preloadedData?: { rows: Row[]; filename: string }; // Accept already-loaded CSV
}

export default function DataLab({ onLoadDataset, onInsertCode = () => {}, language, preloadedData }: Props) {
  const [filename, setFilename] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [analysis, setAnalysis] = useState<Analysis[]>([]);
  const [target, setTarget] = useState<string>('');
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [aiCode, setAiCode] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

  // Load preloaded data if provided or when it changes
  useMemo(() => {
    if (preloadedData && preloadedData.rows.length > 0) {
      setFilename(preloadedData.filename);
      setRows(preloadedData.rows);
      setAnalysis(analyzeDataset(preloadedData.rows));
    }
  }, [preloadedData]);

  const handleFile = (file: File) => {
    setFilename(file.name);
    Papa.parse<Row>(file, {
      header: true,
      dynamicTyping: true,
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
    return cols.map(col => {
      const vals = data.map(r => r[col]);
      const nulls = vals.filter(v => v === '' || v == null || Number.isNaN(v)).length;
      const missingPct = data.length ? nulls / data.length : 0;
      const numeric = vals.every(v => typeof v === 'number' || v == null || v === '');
      const uniqueCount = new Set(vals.filter(v => v !== '' && v != null)).size;
      return { col, nulls, missingPct, numeric, uniqueCount };
    });
  };

  const suggestActions = (): string[] => {
    const s: string[] = [];
    analysis.forEach(a => {
      if (a.missingPct > 0.1) s.push(`Consider imputing or dropping "${a.col}" (missing ${(a.missingPct*100).toFixed(1)}%)`);
      if (a.numeric) s.push(`Plot histogram/boxplot for "${a.col}"`);
      if (!a.numeric && a.uniqueCount < 30) s.push(`Categorical bar chart for "${a.col}"`);
    });
    if (target) s.push(`Try correlation/feature importance vs target "${target}"`);
    return Array.from(new Set(s));
  };

  const pythonBoilerplate = (csvName: string) => `
import pandas as pd
import matplotlib.pyplot as plt
df = pd.read_csv('${csvName}')
# Basic info
print(df.shape); print(df.head()); print(df.isna().mean().sort_values(ascending=False))
# Impute numerics with mean, drop rows if too many missing
num_cols = df.select_dtypes(include='number').columns
df[num_cols] = df[num_cols].fillna(df[num_cols].mean())
# Example plot: histogram for numeric columns
df[num_cols].hist(figsize=(10,6)); plt.tight_layout(); plt.show()
`;

  const rBoilerplate = (csvName: string) => `
library(readr); library(dplyr); library(ggplot2)
df <- read_csv("${csvName}")
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
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
            />
          )}
          {columns.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm">Target (optional)</span>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Pick column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="secondary" onClick={() => onInsertCode(mkCode())}>
                Insert Cleaning & Plots ({language.toUpperCase()})
              </Button>
              <Button variant="default" onClick={askAI} disabled={isLoadingAI}>
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
