export interface PlotConfig {
  dataset: string;
  chartType: 'bar' | 'line' | 'scatter' | 'histogram' | 'box' | 'heatmap';
  xColumn: string;
  yColumn?: string;
  colorColumn?: string;
  title: string;
  xLabel: string;
  yLabel: string;
  theme: 'default' | 'dark' | 'colorblind';
}

export function generatePythonPlot(config: PlotConfig): string {
  const { dataset, chartType, xColumn, yColumn, colorColumn, title, xLabel, yLabel } = config;

  const loadPackages = `# Load required packages from Pyodide
import pyodide
await pyodide.loadPackage(['pandas', 'matplotlib', 'seaborn'])

import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)

# Helper to emit plot as data URL
import io, base64

def _capture_plot_as_data_url():
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    return 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('ascii')
`;

  const loadData = `
# Load dataset
df = pd.read_csv('${dataset}')
print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
`;

  let plotCode = "";

  switch (chartType) {
    case 'bar':
      plotCode = `
# Create bar chart
plt.figure(figsize=(10, 6))
sns.barplot(data=df, x='${xColumn}', y='${yColumn}', ${colorColumn ? `hue='${colorColumn}'` : ''})
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('${yLabel}')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
print(_capture_plot_as_data_url())
plt.close()
`;
      break;

    case 'line':
      plotCode = `
# Create line chart
plt.figure(figsize=(10, 6))
plt.plot(df['${xColumn}'], df['${yColumn}'], marker='o', linewidth=2)
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('${yLabel}')
plt.grid(True, alpha=0.3)
plt.tight_layout()
print(_capture_plot_as_data_url())
plt.close()
`;
      break;

    case 'scatter':
      plotCode = `
# Create scatter plot
plt.figure(figsize=(10, 6))
${colorColumn 
  ? `sns.scatterplot(data=df, x='${xColumn}', y='${yColumn}', hue='${colorColumn}', s=100, alpha=0.7)`
  : `plt.scatter(df['${xColumn}'], df['${yColumn}'], s=100, alpha=0.7, c='#a855f7')`
}
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('${yLabel}')
${colorColumn ? 'plt.legend()' : ''}
plt.grid(True, alpha=0.3)
plt.tight_layout()
print(_capture_plot_as_data_url())
plt.close()
`;
      break;

    case 'histogram':
      plotCode = `
# Create histogram
plt.figure(figsize=(10, 6))
plt.hist(df['${xColumn}'].dropna(), bins=30, edgecolor='black', alpha=0.7, color='#a855f7')
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('Frequency')
plt.grid(True, alpha=0.3, axis='y')
plt.tight_layout()
print(_capture_plot_as_data_url())
plt.close()
`;
      break;

    case 'box':
      plotCode = `
# Create box plot
plt.figure(figsize=(10, 6))
sns.boxplot(data=df, y='${xColumn}', ${yColumn ? `x='${yColumn}'` : ''})
plt.title('${title}')
${yColumn ? `plt.xlabel('${yLabel}')` : ''}
plt.ylabel('${xLabel}')
plt.tight_layout()
print(_capture_plot_as_data_url())
plt.close()
`;
      break;

    case 'heatmap':
      plotCode = `
# Create heatmap (correlation matrix)
plt.figure(figsize=(10, 8))
numeric_cols = df.select_dtypes(include=['number']).columns
correlation_matrix = df[numeric_cols].corr()
sns.heatmap(correlation_matrix, annot=True, fmt='.2f', cmap='coolwarm', center=0)
plt.title('${title}')
plt.tight_layout()
print(_capture_plot_as_data_url())
plt.close()
`;
      break;
  }

  return loadPackages + loadData + plotCode;
}

export function generateRPlot(config: PlotConfig): string {
  const { dataset, chartType, xColumn, yColumn, colorColumn, title, xLabel, yLabel } = config;

  const loadPackages = `# Load required libraries
library(readr)
library(dplyr)
library(ggplot2)

`;

  const loadData = `# Load dataset
df <- read_csv("${dataset}")
cat("Dataset loaded:", nrow(df), "rows,", ncol(df), "columns\\n")

`;

  let plotCode = "";

  switch (chartType) {
    case 'bar':
      plotCode = `# Create bar chart
ggplot(df, aes(x = ${xColumn}, y = ${yColumn}${colorColumn ? `, fill = ${colorColumn}` : ''})) +
  geom_bar(stat = "identity", position = "dodge") +
  labs(
    title = "${title}",
    x = "${xLabel}",
    y = "${yLabel}"
  ) +
  theme_minimal() +
  theme(
    axis.text.x = element_text(angle = 45, hjust = 1),
    plot.title = element_text(size = 14, face = "bold")
  )
`;
      break;

    case 'line':
      plotCode = `# Create line chart
ggplot(df, aes(x = ${xColumn}, y = ${yColumn})) +
  geom_line(color = "#a855f7", size = 1.2) +
  geom_point(color = "#a855f7", size = 2) +
  labs(
    title = "${title}",
    x = "${xLabel}",
    y = "${yLabel}"
  ) +
  theme_minimal() +
  theme(plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'scatter':
      plotCode = `# Create scatter plot
ggplot(df, aes(x = ${xColumn}, y = ${yColumn}${colorColumn ? `, color = ${colorColumn}` : ''})) +
  geom_point(size = 3, alpha = 0.7) +
  labs(
    title = "${title}",
    x = "${xLabel}",
    y = "${yLabel}"
  ) +
  theme_minimal() +
  theme(plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'histogram':
      plotCode = `# Create histogram
ggplot(df, aes(x = ${xColumn})) +
  geom_histogram(bins = 30, fill = "#a855f7", color = "black", alpha = 0.7) +
  labs(
    title = "${title}",
    x = "${xLabel}",
    y = "Frequency"
  ) +
  theme_minimal() +
  theme(plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'box':
      plotCode = `# Create box plot
ggplot(df, aes(${yColumn ? `x = ${yColumn}, ` : ''}y = ${xColumn})) +
  geom_boxplot(fill = "#a855f7", alpha = 0.7) +
  labs(
    title = "${title}",
    ${yColumn ? `x = "${yLabel}",` : ''}
    y = "${xLabel}"
  ) +
  theme_minimal() +
  theme(plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'heatmap':
      plotCode = `# Create heatmap (correlation matrix)
library(reshape2)
numeric_cols <- df %>% select(where(is.numeric))
cor_matrix <- cor(numeric_cols, use = "complete.obs")
cor_melted <- melt(cor_matrix)

ggplot(cor_melted, aes(Var1, Var2, fill = value)) +
  geom_tile() +
  geom_text(aes(label = round(value, 2)), size = 3) +
  scale_fill_gradient2(low = "blue", mid = "white", high = "red", midpoint = 0) +
  labs(title = "${title}") +
  theme_minimal() +
  theme(
    axis.text.x = element_text(angle = 45, hjust = 1),
    axis.title = element_blank(),
    plot.title = element_text(size = 14, face = "bold")
  )
`;
      break;
  }

  return loadPackages + loadData + plotCode;
}
