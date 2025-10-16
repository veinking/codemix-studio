import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Database, ArrowUpDown, Filter, BarChart3, Table2, Copy, Plus } from "lucide-react";
import { toast } from "sonner";

interface DataOperationsProps {
  onInsertCode: (code: string) => void;
  datasetName?: string;
}

const DATA_OPERATIONS = [
  {
    category: "Loading & Viewing",
    icon: <Table2 className="w-4 h-4" />,
    operations: [
      {
        name: "Load CSV",
        code: `import pandas as pd\n\n# Load CSV file\ndf = pd.read_csv('data.csv')\nprint(df.head())\nprint(f"\\nShape: {df.shape}")`,
        description: "Load and preview CSV data"
      },
      {
        name: "Show Info",
        code: `# Display dataset information\nprint(df.info())\nprint("\\nData types:")\nprint(df.dtypes)\nprint("\\nMissing values:")\nprint(df.isnull().sum())`,
        description: "Show dataset structure and info"
      },
      {
        name: "Basic Stats",
        code: `# Display basic statistics\nprint(df.describe())\nprint("\\nColumn statistics:")\nfor col in df.columns:\n    print(f"{col}: {df[col].nunique()} unique values")`,
        description: "Show statistical summary"
      }
    ]
  },
  {
    category: "Cleaning",
    icon: <Filter className="w-4 h-4" />,
    operations: [
      {
        name: "Drop Missing",
        code: `# Remove rows with missing values\ndf_clean = df.dropna()\nprint(f"Removed {len(df) - len(df_clean)} rows with missing values")\nprint(f"New shape: {df_clean.shape}")`,
        description: "Remove rows with null values"
      },
      {
        name: "Fill Missing",
        code: `# Fill missing values with mean (for numeric columns)\nfor col in df.select_dtypes(include=['float64', 'int64']).columns:\n    df[col].fillna(df[col].mean(), inplace=True)\n\n# Fill missing values with mode (for categorical columns)\nfor col in df.select_dtypes(include=['object']).columns:\n    df[col].fillna(df[col].mode()[0], inplace=True)\n\nprint("Missing values filled")`,
        description: "Fill missing values intelligently"
      },
      {
        name: "Remove Duplicates",
        code: `# Remove duplicate rows\noriginal_count = len(df)\ndf = df.drop_duplicates()\nprint(f"Removed {original_count - len(df)} duplicate rows")\nprint(f"New shape: {df.shape}")`,
        description: "Remove duplicate entries"
      }
    ]
  },
  {
    category: "Sorting & Filtering",
    icon: <ArrowUpDown className="w-4 h-4" />,
    operations: [
      {
        name: "Sort by Column",
        code: `# Sort by a specific column (change 'column_name' to your column)\ndf_sorted = df.sort_values('column_name', ascending=False)\nprint(df_sorted.head())`,
        description: "Sort data by column"
      },
      {
        name: "Filter Data",
        code: `# Filter rows based on condition (adjust condition as needed)\n# Example: filter where a column > 50\nfiltered_df = df[df['column_name'] > 50]\nprint(f"Filtered to {len(filtered_df)} rows")\nprint(filtered_df.head())`,
        description: "Filter rows by condition"
      },
      {
        name: "Group & Aggregate",
        code: `# Group by column and calculate statistics\ngrouped = df.groupby('column_name').agg({\n    'value_column': ['mean', 'sum', 'count']\n})\nprint(grouped)`,
        description: "Group data and aggregate"
      }
    ]
  },
  {
    category: "Visualization",
    icon: <BarChart3 className="w-4 h-4" />,
    operations: [
      {
        name: "Histogram",
        code: `import matplotlib.pyplot as plt\n\n# Create histogram for numeric column\nplt.figure(figsize=(10, 6))\ndf['column_name'].hist(bins=30)\nplt.xlabel('Value')\nplt.ylabel('Frequency')\nplt.title('Histogram')\nplt.tight_layout()\nplt.show()`,
        description: "Create histogram"
      },
      {
        name: "Bar Chart",
        code: `import matplotlib.pyplot as plt\n\n# Create bar chart for categorical data\nvalue_counts = df['column_name'].value_counts().head(10)\nplt.figure(figsize=(10, 6))\nvalue_counts.plot(kind='bar')\nplt.xlabel('Category')\nplt.ylabel('Count')\nplt.title('Top 10 Values')\nplt.xticks(rotation=45)\nplt.tight_layout()\nplt.show()`,
        description: "Create bar chart"
      },
      {
        name: "Correlation Heatmap",
        code: `import matplotlib.pyplot as plt\nimport seaborn as sns\n\n# Create correlation heatmap for numeric columns\nplt.figure(figsize=(12, 8))\ncorr = df.select_dtypes(include=['float64', 'int64']).corr()\nsns.heatmap(corr, annot=True, cmap='coolwarm', center=0)\nplt.title('Correlation Heatmap')\nplt.tight_layout()\nplt.show()`,
        description: "Visualize correlations"
      }
    ]
  }
];

export const DataOperations = ({ onInsertCode, datasetName }: DataOperationsProps) => {
  const handleInsert = (code: string, name: string) => {
    onInsertCode(code);
    toast.success(`Inserted: ${name}`);
  };

  const handleCopy = async (code: string, name: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied: ${name}`);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="w-4 h-4" />
          Data Ops
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[500px] bg-background">
        <SheetHeader>
          <SheetTitle>Data Operations</SheetTitle>
          <SheetDescription>
            Quick pandas operations for data analysis
            {datasetName && ` • Dataset: ${datasetName}`}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <div className="space-y-6 pr-4">
            {DATA_OPERATIONS.map((category) => (
              <div key={category.category} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
                  {category.icon}
                  <span>{category.category}</span>
                </div>
                
                <div className="space-y-2">
                  {category.operations.map((op) => (
                    <div
                      key={op.name}
                      className="p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-foreground">{op.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleInsert(op.code, op.name)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Insert
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleCopy(op.code, op.name)}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{op.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
