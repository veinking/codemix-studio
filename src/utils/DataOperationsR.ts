import { Database, ArrowUpDown, Filter, BarChart3, Table2 } from "lucide-react";

export const R_DATA_OPERATIONS = [
  {
    category: "Loading & Viewing",
    icon: Table2,
    operations: [
      {
        name: "Load CSV",
        code: `# Load CSV file with readr
library(readr)

df <- read_csv('data.csv')
print(head(df))
cat("\\nShape:", dim(df), "\\n")`,
        description: "Load and preview CSV data"
      },
      {
        name: "Show Structure",
        code: `# Display dataset structure
str(df)
cat("\\nSummary:\\n")
summary(df)
cat("\\nColumn names:\\n")
print(names(df))`,
        description: "Show dataset structure and info"
      },
      {
        name: "Basic Stats",
        code: `# Display basic statistics
summary(df)
cat("\\nColumn statistics:\\n")
for(col in names(df)) {
  cat(col, ": ", length(unique(df[[col]])), " unique values\\n")
}`,
        description: "Show statistical summary"
      }
    ]
  },
  {
    category: "Cleaning",
    icon: Filter,
    operations: [
      {
        name: "Drop Missing",
        code: `# Remove rows with missing values
df_clean <- na.omit(df)
removed <- nrow(df) - nrow(df_clean)
cat("Removed", removed, "rows with missing values\\n")
cat("New dimensions:", dim(df_clean), "\\n")`,
        description: "Remove rows with NA values"
      },
      {
        name: "Fill Missing",
        code: `# Fill missing values
library(dplyr)

df <- df %>%
  mutate(across(where(is.numeric), ~ifelse(is.na(.), mean(., na.rm = TRUE), .))) %>%
  mutate(across(where(is.character), ~ifelse(is.na(.), names(sort(table(.), decreasing=TRUE))[1], .)))

cat("Missing values filled\\n")`,
        description: "Fill missing values intelligently"
      },
      {
        name: "Remove Duplicates",
        code: `# Remove duplicate rows
original_count <- nrow(df)
df <- distinct(df)
removed <- original_count - nrow(df)
cat("Removed", removed, "duplicate rows\\n")
cat("New dimensions:", dim(df), "\\n")`,
        description: "Remove duplicate entries"
      }
    ]
  },
  {
    category: "Sorting & Filtering",
    icon: ArrowUpDown,
    operations: [
      {
        name: "Sort by Column",
        code: `library(dplyr)

# Sort by a specific column (change 'column_name' to your column)
df_sorted <- df %>% arrange(desc(column_name))
print(head(df_sorted))`,
        description: "Sort data by column"
      },
      {
        name: "Filter Data",
        code: `library(dplyr)

# Filter rows based on condition (adjust as needed)
filtered_df <- df %>% filter(column_name > 50)
cat("Filtered to", nrow(filtered_df), "rows\\n")
print(head(filtered_df))`,
        description: "Filter rows by condition"
      },
      {
        name: "Group & Aggregate",
        code: `library(dplyr)

# Group by column and calculate statistics
grouped <- df %>%
  group_by(column_name) %>%
  summarise(
    mean_value = mean(value_column, na.rm = TRUE),
    sum_value = sum(value_column, na.rm = TRUE),
    count = n()
  )
print(grouped)`,
        description: "Group data and aggregate"
      }
    ]
  },
  {
    category: "Visualization",
    icon: BarChart3,
    operations: [
      {
        name: "Histogram",
        code: `library(ggplot2)

# Create histogram for numeric column
ggplot(df, aes(x = column_name)) +
  geom_histogram(bins = 30, fill = "steelblue", color = "white") +
  labs(title = "Histogram", x = "Value", y = "Frequency") +
  theme_minimal()`,
        description: "Create histogram with ggplot2"
      },
      {
        name: "Bar Chart",
        code: `library(ggplot2)
library(dplyr)

# Create bar chart for categorical data
df %>%
  count(column_name) %>%
  top_n(10, n) %>%
  ggplot(aes(x = reorder(column_name, n), y = n)) +
  geom_bar(stat = "identity", fill = "steelblue") +
  coord_flip() +
  labs(title = "Top 10 Values", x = "Category", y = "Count") +
  theme_minimal()`,
        description: "Create bar chart"
      },
      {
        name: "Correlation Plot",
        code: `library(corrplot)

# Create correlation plot for numeric columns
numeric_cols <- df %>% select(where(is.numeric))
corr_matrix <- cor(numeric_cols, use = "complete.obs")
corrplot(corr_matrix, method = "color", type = "upper", 
         tl.col = "black", tl.srt = 45)
title("Correlation Matrix")`,
        description: "Visualize correlations"
      }
    ]
  }
];
