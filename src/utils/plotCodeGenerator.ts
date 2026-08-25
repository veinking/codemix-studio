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
  // Reserved for future fully-inline dataset execution.
  datasetContent?: string;
}

const stringLiteral = (value: string): string => JSON.stringify(value);

/**
 * Generate Python plotting code for bIDE's Pyodide worker runtime.
 *
 * IMPORTANT: backend selection and PNG capture belong to PythonRuntime/pyWorker.
 * Generated user code must not switch Matplotlib back to a DOM-backed Pyodide
 * backend or manually close/capture the figure before the worker can collect it.
 */
export function generatePythonPlot(config: PlotConfig, isMobile: boolean = false): string {
  const { dataset, chartType, xColumn, yColumn, colorColumn, title, xLabel, yLabel } = config;

  const figSize = isMobile ? '(6, 4)' : '(12, 8)';
  const x = stringLiteral(xColumn);
  const y = stringLiteral(yColumn || xColumn);
  const color = colorColumn ? stringLiteral(colorColumn) : null;
  const plotTitle = stringLiteral(title);
  const plotXLabel = stringLiteral(xLabel);
  const plotYLabel = stringLiteral(yLabel);
  const datasetLiteral = stringLiteral(dataset);

  const imports = isMobile
    ? `# Packages are auto-loaded by the bIDE browser runtime
import pandas as pd
import matplotlib.pyplot as plt

# Use a lightweight Matplotlib style on mobile
plt.style.use('default')`
    : `# Packages are auto-loaded by the bIDE browser runtime
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_theme(style="whitegrid")`;

  const loadData = `
# Load the selected bIDE dataset
df = pd.read_csv(${datasetLiteral})`;

  let plotCode = '';

  switch (chartType) {
    case 'bar':
      plotCode = isMobile ? `
# Create bar chart
plt.figure(figsize=${figSize})
plt.bar(df[${x}], df[${y}], color='#a855f7')
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel(${plotYLabel})
plt.xticks(rotation=45)
plt.tight_layout()` : `
# Create bar chart
plt.figure(figsize=${figSize})
sns.barplot(data=df, x=${x}, y=${y})
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel(${plotYLabel})
plt.xticks(rotation=45)
plt.tight_layout()`;
      break;

    case 'line':
      plotCode = isMobile ? `
# Create line chart
plt.figure(figsize=${figSize})
plt.plot(df[${x}], df[${y}], color='#a855f7', linewidth=2)
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel(${plotYLabel})
plt.tight_layout()` : `
# Create line chart
plt.figure(figsize=${figSize})
sns.lineplot(data=df, x=${x}, y=${y})
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel(${plotYLabel})
plt.tight_layout()`;
      break;

    case 'scatter':
      if (isMobile) {
        plotCode = `
# Create scatter plot
plt.figure(figsize=${figSize})
plt.scatter(df[${x}], df[${y}], color='#a855f7', alpha=0.65)
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel(${plotYLabel})
plt.tight_layout()`;
      } else {
        plotCode = color ? `
# Create scatter plot with grouping
plt.figure(figsize=${figSize})
sns.scatterplot(data=df, x=${x}, y=${y}, hue=${color})
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel(${plotYLabel})
plt.legend(title=${color})
plt.tight_layout()` : `
# Create scatter plot
plt.figure(figsize=${figSize})
sns.scatterplot(data=df, x=${x}, y=${y})
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel(${plotYLabel})
plt.tight_layout()`;
      }
      break;

    case 'histogram':
      plotCode = isMobile ? `
# Create histogram
plt.figure(figsize=${figSize})
plt.hist(df[${x}].dropna(), bins=20, color='#a855f7', alpha=0.7)
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel('Frequency')
plt.tight_layout()` : `
# Create histogram
plt.figure(figsize=${figSize})
sns.histplot(data=df, x=${x}, bins=30)
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel('Frequency')
plt.tight_layout()`;
      break;

    case 'box':
      plotCode = isMobile ? `
# Create box plot for the selected numeric column
plt.figure(figsize=${figSize})
plt.boxplot(df[${x}].dropna(), vert=True)
plt.title(${plotTitle})
plt.ylabel(${plotYLabel})
plt.tight_layout()` : `
# Create box plot for the selected numeric column
plt.figure(figsize=${figSize})
sns.boxplot(data=df, y=${x})
plt.title(${plotTitle})
plt.ylabel(${plotYLabel})
plt.tight_layout()`;
      break;

    case 'heatmap':
      plotCode = isMobile ? `
# Create a lightweight correlation heatmap
plt.figure(figsize=${figSize})
numeric_cols = df.select_dtypes(include=['number'])
corr = numeric_cols.corr()
image = plt.imshow(corr, cmap='coolwarm', aspect='auto', vmin=-1, vmax=1)
plt.colorbar(image)
plt.xticks(range(len(corr.columns)), corr.columns, rotation=45, ha='right')
plt.yticks(range(len(corr.index)), corr.index)
plt.title(${plotTitle})
plt.tight_layout()` : `
# Create correlation heatmap
plt.figure(figsize=${figSize})
numeric_cols = df.select_dtypes(include=['number'])
sns.heatmap(numeric_cols.corr(), annot=True, cmap='coolwarm', center=0)
plt.title(${plotTitle})
plt.tight_layout()`;
      break;

    default:
      plotCode = `
# Create scatter plot
plt.figure(figsize=${figSize})
plt.scatter(df[${x}], df[${y}])
plt.title(${plotTitle})
plt.xlabel(${plotXLabel})
plt.ylabel(${plotYLabel})
plt.tight_layout()`;
  }

  const showPlot = `

# bIDE's worker-safe runtime captures the open figure as PNG after execution.
plt.show()`;

  return imports + loadData + plotCode + showPlot;
}

/**
 * Generate R/ggplot2 plotting code with data-pronoun column access so headers
 * containing spaces, punctuation, or other non-syntactic characters still work.
 */
export function generateRPlot(config: PlotConfig): string {
  const { dataset, chartType, xColumn, yColumn, colorColumn, title, xLabel, yLabel } = config;

  const datasetLiteral = stringLiteral(dataset);
  const x = stringLiteral(xColumn);
  const y = stringLiteral(yColumn || xColumn);
  const color = colorColumn ? stringLiteral(colorColumn) : null;
  const plotTitle = stringLiteral(title);
  const plotXLabel = stringLiteral(xLabel);
  const plotYLabel = stringLiteral(yLabel);

  const loadPackages = `# Load required libraries
library(readr)
library(dplyr)
library(ggplot2)

`;

  const loadData = `# Load selected bIDE dataset
df <- read_csv(${datasetLiteral})
cat("Dataset loaded:", nrow(df), "rows,", ncol(df), "columns\\n")

`;

  let plotCode = '';

  switch (chartType) {
    case 'bar':
      plotCode = `# Create bar chart
ggplot(df, aes(x = .data[[${x}]], y = .data[[${y}]]${color ? `, fill = .data[[${color}]]` : ''})) +
  geom_col(position = "dodge") +
  labs(title = ${plotTitle}, x = ${plotXLabel}, y = ${plotYLabel}) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1), plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'line':
      plotCode = `# Create line chart
ggplot(df, aes(x = .data[[${x}]], y = .data[[${y}]])) +
  geom_line(color = "#a855f7", linewidth = 1.2) +
  geom_point(color = "#a855f7", size = 2) +
  labs(title = ${plotTitle}, x = ${plotXLabel}, y = ${plotYLabel}) +
  theme_minimal() +
  theme(plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'scatter':
      plotCode = `# Create scatter plot
ggplot(df, aes(x = .data[[${x}]], y = .data[[${y}]]${color ? `, color = .data[[${color}]]` : ''})) +
  geom_point(size = 3, alpha = 0.7) +
  labs(title = ${plotTitle}, x = ${plotXLabel}, y = ${plotYLabel}) +
  theme_minimal() +
  theme(plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'histogram':
      plotCode = `# Create histogram
ggplot(df, aes(x = .data[[${x}]])) +
  geom_histogram(bins = 30, fill = "#a855f7", color = "black", alpha = 0.7) +
  labs(title = ${plotTitle}, x = ${plotXLabel}, y = "Frequency") +
  theme_minimal() +
  theme(plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'box':
      plotCode = `# Create box plot for the selected numeric column
ggplot(df, aes(y = .data[[${x}]])) +
  geom_boxplot(fill = "#a855f7", alpha = 0.7) +
  labs(title = ${plotTitle}, x = NULL, y = ${plotYLabel}) +
  theme_minimal() +
  theme(plot.title = element_text(size = 14, face = "bold"))
`;
      break;

    case 'heatmap':
      plotCode = `# Create correlation heatmap
library(reshape2)
numeric_cols <- df %>% select(where(is.numeric))
cor_matrix <- cor(numeric_cols, use = "complete.obs")
cor_melted <- melt(cor_matrix)

ggplot(cor_melted, aes(x = Var1, y = Var2, fill = value)) +
  geom_tile() +
  geom_text(aes(label = round(value, 2)), size = 3) +
  scale_fill_gradient2(low = "blue", mid = "white", high = "red", midpoint = 0) +
  labs(title = ${plotTitle}, x = NULL, y = NULL) +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1), plot.title = element_text(size = 14, face = "bold"))
`;
      break;
  }

  return loadPackages + loadData + plotCode;
}
