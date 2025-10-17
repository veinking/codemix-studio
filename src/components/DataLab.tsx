import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
}

export default function DataLab({ onLoadDataset, onInsertCode = () => {}, language }: Props) {
  const [filename, setFilename] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [analysis, setAnalysis] = useState<Analysis[]>([]);
  const [target, setTarget] = useState<string>('');

  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>DataLab</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          />
          {columns.length > 0 && (
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
          )}
          <Button variant="secondary" onClick={() => onInsertCode(mkCode())}>
            Insert Cleaning & Plots ({language.toUpperCase()})
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <b>{filename}</b> • {rows.length.toLocaleString()} rows • {columns.length} columns
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
