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
  // Optional: inline CSV content to avoid filesystem reads in Pyodide
  datasetContent?: string;
}

export function generatePythonPlot(config: PlotConfig, isMobile: boolean = false): string {
  const { dataset, datasetContent, chartType, xColumn, yColumn, colorColumn, title, xLabel, yLabel } = config;

  // Mobile optimization: smaller figures, lower DPI
  const figSize = isMobile ? '(8, 5)' : '(10, 6)';
  const dpi = isMobile ? 72 : 100;

  const loadPackages = `# Imports only — packages are auto-loaded by the runtime
import pandas as pd
import matplotlib
matplotlib.use('module://matplotlib_pyodide.wasm_backend')
import matplotlib.pyplot as plt
import seaborn as sns

# Set plot style
sns.set_theme(style="whitegrid")`;

  const loadData = `
# Load the dataset
df = pd.read_csv("${dataset}")`;

  let plotCode = '';
  
  switch (chartType) {
    case 'bar':
      plotCode = `
# Create bar chart
plt.figure(figsize=${figSize})
sns.barplot(data=df, x='${xColumn}', y='${yColumn}')
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('${yLabel}')
plt.xticks(rotation=45)
plt.tight_layout()`;
      break;

    case 'line':
      plotCode = `
# Create line chart
plt.figure(figsize=${figSize})
sns.lineplot(data=df, x='${xColumn}', y='${yColumn}')
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('${yLabel}')
plt.tight_layout()`;
      break;

    case 'scatter':
      plotCode = colorColumn ? `
# Create scatter plot with color
plt.figure(figsize=${figSize})
sns.scatterplot(data=df, x='${xColumn}', y='${yColumn}', hue='${colorColumn}')
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('${yLabel}')
plt.legend(title='${colorColumn}')
plt.tight_layout()` : `
# Create scatter plot
plt.figure(figsize=${figSize})
sns.scatterplot(data=df, x='${xColumn}', y='${yColumn}')
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('${yLabel}')
plt.tight_layout()`;
      break;

    case 'histogram':
      plotCode = `
# Create histogram
plt.figure(figsize=${figSize})
sns.histplot(data=df, x='${xColumn}', bins=30)
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('Frequency')
plt.tight_layout()`;
      break;

    case 'box':
      plotCode = `
# Create box plot
plt.figure(figsize=${figSize})
sns.boxplot(data=df, y='${yColumn}')
plt.title('${title}')
plt.ylabel('${yLabel}')
plt.tight_layout()`;
      break;

    case 'heatmap':
      plotCode = `
# Create heatmap (requires numeric data)
plt.figure(figsize=${figSize})
numeric_cols = df.select_dtypes(include=['number'])
sns.heatmap(numeric_cols.corr(), annot=True, cmap='coolwarm', center=0)
plt.title('${title}')
plt.tight_layout()`;
      break;

    default:
      plotCode = `
# Create scatter plot (default)
plt.figure(figsize=${figSize})
plt.scatter(df['${xColumn}'], df['${yColumn}'])
plt.title('${title}')
plt.xlabel('${xLabel}')
plt.ylabel('${yLabel}')
plt.tight_layout()`;
  }

  const captureCode = `
# Capture the plot with enhanced error handling
try:
    import io
    import base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=${dpi}, bbox_inches='tight')
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode()
    print(f"data:image/png;base64,{img_str}")
    plt.close()
except Exception as e:
    plt.close()
    print(f"⚠️ Plot created but couldn't capture image: {str(e)}")
    print("📊 Plot code executed successfully. You can save and run this code in a local IDE to see the visualization.")`;

  return loadPackages + loadData + plotCode + captureCode;
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
