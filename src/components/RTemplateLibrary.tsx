import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Plus, BarChart3, LineChart, PieChart, ScatterChart } from "lucide-react";
import { toast } from "sonner";

interface RTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  code: string;
  packages: string[];
}

const R_TEMPLATES: RTemplate[] = [
  {
    id: "ggplot-scatter",
    title: "Scatter Plot (ggplot2)",
    description: "Beautiful scatter plot with trend line",
    category: "ggplot2",
    icon: ScatterChart,
    packages: ["ggplot2"],
    code: `library(ggplot2)

# Create scatter plot with trend line
ggplot(df, aes(x = x_column, y = y_column)) +
  geom_point(alpha = 0.6, size = 3, color = "#3b82f6") +
  geom_smooth(method = "lm", se = TRUE, color = "#8b5cf6") +
  labs(
    title = "Scatter Plot with Trend",
    x = "X Variable",
    y = "Y Variable"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold"),
    axis.title = element_text(size = 12)
  )`
  },
  {
    id: "ggplot-bar",
    title: "Bar Chart (ggplot2)",
    description: "Grouped or stacked bar chart",
    category: "ggplot2",
    icon: BarChart3,
    packages: ["ggplot2", "dplyr"],
    code: `library(ggplot2)
library(dplyr)

# Create bar chart
df %>%
  count(category_column) %>%
  top_n(10, n) %>%
  ggplot(aes(x = reorder(category_column, n), y = n)) +
  geom_bar(stat = "identity", fill = "#3b82f6") +
  geom_text(aes(label = n), hjust = -0.2, size = 3) +
  coord_flip() +
  labs(
    title = "Top 10 Categories",
    x = "Category",
    y = "Count"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold")
  )`
  },
  {
    id: "ggplot-line",
    title: "Time Series (ggplot2)",
    description: "Line chart for time series data",
    category: "ggplot2",
    icon: LineChart,
    packages: ["ggplot2", "lubridate"],
    code: `library(ggplot2)
library(lubridate)

# Convert date column if needed
df$date <- as.Date(df$date_column)

# Create time series plot
ggplot(df, aes(x = date, y = value)) +
  geom_line(color = "#3b82f6", size = 1) +
  geom_point(color = "#1e40af", size = 2) +
  labs(
    title = "Time Series Analysis",
    x = "Date",
    y = "Value"
  ) +
  scale_x_date(date_labels = "%b %Y", date_breaks = "1 month") +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold"),
    axis.text.x = element_text(angle = 45, hjust = 1)
  )`
  },
  {
    id: "tidyverse-pipeline",
    title: "Data Pipeline (tidyverse)",
    description: "Complete data wrangling pipeline",
    category: "tidyverse",
    icon: BarChart3,
    packages: ["dplyr", "tidyr"],
    code: `library(dplyr)
library(tidyr)

# Complete data wrangling pipeline
result <- df %>%
  # Filter rows
  filter(column > value) %>%
  # Select columns
  select(col1, col2, col3) %>%
  # Create new columns
  mutate(
    new_col = col1 + col2,
    category = case_when(
      col3 > 100 ~ "High",
      col3 > 50 ~ "Medium",
      TRUE ~ "Low"
    )
  ) %>%
  # Group and summarize
  group_by(category) %>%
  summarise(
    mean_value = mean(new_col, na.rm = TRUE),
    median_value = median(new_col, na.rm = TRUE),
    count = n()
  ) %>%
  # Arrange results
  arrange(desc(mean_value))

print(result)`
  },
  {
    id: "faceted-plot",
    title: "Faceted Plot (ggplot2)",
    description: "Multiple plots by category",
    category: "ggplot2",
    icon: BarChart3,
    packages: ["ggplot2"],
    code: `library(ggplot2)

# Create faceted plot
ggplot(df, aes(x = x_column, y = y_column)) +
  geom_point(aes(color = category), alpha = 0.6, size = 2) +
  geom_smooth(method = "lm", se = FALSE) +
  facet_wrap(~category, scales = "free") +
  labs(
    title = "Analysis by Category",
    x = "X Variable",
    y = "Y Variable"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold"),
    strip.text = element_text(size = 11, face = "bold")
  )`
  },
  {
    id: "boxplot",
    title: "Box Plot (ggplot2)",
    description: "Distribution comparison",
    category: "ggplot2",
    icon: BarChart3,
    packages: ["ggplot2"],
    code: `library(ggplot2)

# Create box plot
ggplot(df, aes(x = category, y = value, fill = category)) +
  geom_boxplot(alpha = 0.7, outlier.color = "red") +
  geom_jitter(width = 0.2, alpha = 0.3, size = 1) +
  labs(
    title = "Distribution by Category",
    x = "Category",
    y = "Value"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold"),
    legend.position = "none"
  ) +
  coord_flip()`
  },
  {
    id: "heatmap",
    title: "Heatmap (ggplot2)",
    description: "Correlation or pivot table heatmap",
    category: "ggplot2",
    icon: BarChart3,
    packages: ["ggplot2", "reshape2"],
    code: `library(ggplot2)
library(reshape2)

# Create correlation heatmap
numeric_cols <- df %>% select(where(is.numeric))
corr_matrix <- cor(numeric_cols, use = "complete.obs")
melted_corr <- melt(corr_matrix)

ggplot(melted_corr, aes(x = Var1, y = Var2, fill = value)) +
  geom_tile(color = "white") +
  scale_fill_gradient2(
    low = "#3b82f6", mid = "white", high = "#ef4444",
    midpoint = 0, limits = c(-1, 1)
  ) +
  labs(title = "Correlation Heatmap", fill = "Correlation") +
  theme_minimal() +
  theme(
    axis.text.x = element_text(angle = 45, hjust = 1),
    plot.title = element_text(size = 16, face = "bold")
  )`
  },
  {
    id: "violin-plot",
    title: "Violin Plot (ggplot2)",
    description: "Distribution with density",
    category: "ggplot2",
    icon: BarChart3,
    packages: ["ggplot2"],
    code: `library(ggplot2)

# Create violin plot
ggplot(df, aes(x = category, y = value, fill = category)) +
  geom_violin(alpha = 0.7, trim = FALSE) +
  geom_boxplot(width = 0.1, fill = "white", alpha = 0.8) +
  labs(
    title = "Distribution by Category",
    x = "Category",
    y = "Value"
  ) +
  theme_minimal() +
  theme(
    plot.title = element_text(size = 16, face = "bold"),
    legend.position = "none"
  )`
  }
];

interface RTemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertCode: (code: string) => void;
}

export const RTemplateLibrary = ({
  open,
  onOpenChange,
  onInsertCode
}: RTemplateLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = R_TEMPLATES.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInsert = (template: RTemplate) => {
    onInsertCode(template.code);
    toast.success(`Inserted: ${template.title}`);
    onOpenChange(false);
  };

  const handleCopy = async (template: RTemplate) => {
    try {
      await navigator.clipboard.writeText(template.code);
      toast.success(`Copied: ${template.title}`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            R Template Library
          </DialogTitle>
          <DialogDescription>
            Beautiful ggplot2 visualizations and tidyverse workflows
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Templates Grid */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.id}
                  className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">{template.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.packages.map(pkg => (
                      <Badge key={pkg} variant="secondary" className="text-[10px] h-4 px-1">
                        {pkg}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleInsert(template)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Insert
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => handleCopy(template)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              No templates found for "{searchQuery}"
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
