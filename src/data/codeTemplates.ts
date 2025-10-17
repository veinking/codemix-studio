export interface CodeTemplate {
  id: string;
  category: 'data-science' | 'ml' | 'visualization' | 'stats' | 'interview-prep';
  title: string;
  description: string;
  language: 'python' | 'r';
  code: string;
  expectedOutput: string;
  packages: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export const codeTemplates: CodeTemplate[] = [
  // Data Science Templates
  {
    id: 'load-csv-basic',
    category: 'data-science',
    title: 'Load CSV & Basic Stats',
    description: 'Load a CSV file and compute basic statistics',
    language: 'python',
    code: `import pandas as pd
import numpy as np

# Create sample data
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
    'Age': [25, 30, 35, 28, 32],
    'Salary': [50000, 60000, 75000, 55000, 65000]
}

df = pd.DataFrame(data)

print("Dataset Overview:")
print(df.head())
print("\\nBasic Statistics:")
print(df.describe())
print("\\nData Types:")
print(df.dtypes)`,
    expectedOutput: 'Displays dataset overview, statistical summary, and data types',
    packages: ['pandas', 'numpy'],
    difficulty: 'beginner',
    tags: ['pandas', 'data-analysis', 'statistics']
  },
  {
    id: 'data-cleaning',
    category: 'data-science',
    title: 'Data Cleaning Pipeline',
    description: 'Handle missing values and outliers',
    language: 'python',
    code: `import pandas as pd
import numpy as np

# Create sample data with missing values
data = {
    'A': [1, 2, np.nan, 4, 5],
    'B': [np.nan, 2, 3, 4, 100],
    'C': [1, 2, 3, 4, 5]
}

df = pd.DataFrame(data)

print("Original Data:")
print(df)

# Handle missing values
df_cleaned = df.fillna(df.mean())

print("\\nAfter filling missing values:")
print(df_cleaned)

# Remove outliers using IQR method
Q1 = df_cleaned.quantile(0.25)
Q3 = df_cleaned.quantile(0.75)
IQR = Q3 - Q1

df_no_outliers = df_cleaned[~((df_cleaned < (Q1 - 1.5 * IQR)) | (df_cleaned > (Q3 + 1.5 * IQR))).any(axis=1)]

print("\\nAfter removing outliers:")
print(df_no_outliers)`,
    expectedOutput: 'Shows original data, data after filling missing values, and data after outlier removal',
    packages: ['pandas', 'numpy'],
    difficulty: 'intermediate',
    tags: ['data-cleaning', 'outliers', 'missing-data']
  },
  {
    id: 'pandas-fundamentals',
    category: 'data-science',
    title: 'Pandas Fundamentals',
    description: 'Essential pandas operations for data manipulation',
    language: 'python',
    code: `import pandas as pd

# Create sample dataset
data = {
    'Product': ['A', 'B', 'C', 'A', 'B', 'C'],
    'Sales': [100, 150, 200, 120, 180, 220],
    'Region': ['East', 'West', 'East', 'West', 'East', 'West']
}

df = pd.DataFrame(data)

print("Original Data:")
print(df)

# Filtering
print("\\nProducts with Sales > 150:")
print(df[df['Sales'] > 150])

# Grouping
print("\\nAverage Sales by Product:")
print(df.groupby('Product')['Sales'].mean())

# Sorting
print("\\nSorted by Sales (descending):")
print(df.sort_values('Sales', ascending=False))

# Adding new column
df['Revenue'] = df['Sales'] * 1.2
print("\\nWith Revenue column:")
print(df)`,
    expectedOutput: 'Demonstrates filtering, grouping, sorting, and column creation',
    packages: ['pandas'],
    difficulty: 'beginner',
    tags: ['pandas', 'filtering', 'groupby', 'sorting']
  },

  // Machine Learning Templates
  {
    id: 'linear-regression',
    category: 'ml',
    title: 'Simple Linear Regression',
    description: 'Build and evaluate a linear regression model',
    language: 'python',
    code: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# Generate sample data
np.random.seed(42)
X = np.random.rand(100, 1) * 10
y = 2 * X.squeeze() + 1 + np.random.randn(100) * 2

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Evaluate
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"Model Coefficient: {model.coef_[0]:.2f}")
print(f"Model Intercept: {model.intercept_:.2f}")
print(f"Mean Squared Error: {mse:.2f}")
print(f"R² Score: {r2:.2f}")`,
    expectedOutput: 'Displays model parameters and evaluation metrics',
    packages: ['numpy', 'scikit-learn'],
    difficulty: 'intermediate',
    tags: ['machine-learning', 'regression', 'sklearn']
  },
  {
    id: 'knn-classifier',
    category: 'ml',
    title: 'KNN Classifier',
    description: 'Classify data using K-Nearest Neighbors',
    language: 'python',
    code: `import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, classification_report

# Generate sample data
X, y = make_classification(n_samples=200, n_features=2, n_redundant=0, 
                          n_informative=2, random_state=42, n_clusters_per_class=1)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)

# Predict
y_pred = knn.predict(X_test)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)

print(f"Accuracy: {accuracy:.2%}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))`,
    expectedOutput: 'Shows model accuracy and detailed classification metrics',
    packages: ['numpy', 'scikit-learn'],
    difficulty: 'intermediate',
    tags: ['classification', 'knn', 'sklearn']
  },
  {
    id: 'decision-tree',
    category: 'ml',
    title: 'Decision Tree Classifier',
    description: 'Build a decision tree for classification',
    language: 'python',
    code: `import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, confusion_matrix

# Load iris dataset
iris = load_iris()
X, y = iris.data, iris.target

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
clf = DecisionTreeClassifier(max_depth=3, random_state=42)
clf.fit(X_train, y_train)

# Predict
y_pred = clf.predict(X_test)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)
cm = confusion_matrix(y_test, y_pred)

print(f"Accuracy: {accuracy:.2%}")
print("\\nConfusion Matrix:")
print(cm)
print(f"\\nFeature Importances:")
for i, importance in enumerate(clf.feature_importances_):
    print(f"{iris.feature_names[i]}: {importance:.3f}")`,
    expectedOutput: 'Displays accuracy, confusion matrix, and feature importances',
    packages: ['numpy', 'scikit-learn'],
    difficulty: 'intermediate',
    tags: ['decision-tree', 'classification', 'iris']
  },

  // Visualization Templates
  {
    id: 'line-chart',
    category: 'visualization',
    title: 'Line Chart',
    description: 'Create a simple line plot',
    language: 'python',
    code: `import matplotlib.pyplot as plt
import numpy as np

# Generate data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create plot
plt.figure(figsize=(10, 6))
plt.plot(x, y, linewidth=2, color='#6366f1')
plt.title('Sine Wave', fontsize=16, fontweight='bold')
plt.xlabel('X axis', fontsize=12)
plt.ylabel('Y axis', fontsize=12)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

print("Line chart created successfully!")`,
    expectedOutput: 'Displays a sine wave line chart',
    packages: ['matplotlib', 'numpy'],
    difficulty: 'beginner',
    tags: ['visualization', 'matplotlib', 'line-chart']
  },
  {
    id: 'scatter-regression',
    category: 'visualization',
    title: 'Scatter Plot with Regression',
    description: 'Scatter plot with regression line overlay',
    language: 'python',
    code: `import matplotlib.pyplot as plt
import numpy as np
from sklearn.linear_model import LinearRegression

# Generate data
np.random.seed(42)
x = np.random.rand(50) * 10
y = 2 * x + 1 + np.random.randn(50) * 2

# Fit regression
model = LinearRegression()
model.fit(x.reshape(-1, 1), y)
y_pred = model.predict(x.reshape(-1, 1))

# Create plot
plt.figure(figsize=(10, 6))
plt.scatter(x, y, alpha=0.6, s=50, color='#6366f1', label='Data')
plt.plot(x, y_pred, color='#ef4444', linewidth=2, label='Regression Line')
plt.title('Scatter Plot with Regression Line', fontsize=16, fontweight='bold')
plt.xlabel('X', fontsize=12)
plt.ylabel('Y', fontsize=12)
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

print(f"Regression equation: y = {model.coef_[0]:.2f}x + {model.intercept_:.2f}")`,
    expectedOutput: 'Scatter plot with fitted regression line',
    packages: ['matplotlib', 'numpy', 'scikit-learn'],
    difficulty: 'intermediate',
    tags: ['scatter-plot', 'regression', 'visualization']
  },
  {
    id: 'heatmap',
    category: 'visualization',
    title: 'Correlation Heatmap',
    description: 'Visualize correlations between variables',
    language: 'python',
    code: `import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

# Create sample data
np.random.seed(42)
data = {
    'A': np.random.randn(100),
    'B': np.random.randn(100),
    'C': np.random.randn(100),
    'D': np.random.randn(100)
}

# Make B correlated with A
data['B'] = data['A'] * 0.5 + np.random.randn(100) * 0.5

df = pd.DataFrame(data)

# Compute correlation matrix
corr = df.corr()

# Create heatmap
plt.figure(figsize=(8, 6))
im = plt.imshow(corr, cmap='coolwarm', vmin=-1, vmax=1)
plt.colorbar(im)

# Add labels
plt.xticks(range(len(corr.columns)), corr.columns)
plt.yticks(range(len(corr.columns)), corr.columns)

# Add correlation values
for i in range(len(corr)):
    for j in range(len(corr)):
        plt.text(j, i, f'{corr.iloc[i, j]:.2f}', 
                ha='center', va='center', color='white' if abs(corr.iloc[i, j]) > 0.5 else 'black')

plt.title('Correlation Heatmap', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.show()

print("Heatmap created successfully!")`,
    expectedOutput: 'Correlation matrix heatmap with values',
    packages: ['matplotlib', 'numpy', 'pandas'],
    difficulty: 'intermediate',
    tags: ['heatmap', 'correlation', 'visualization']
  },

  // Statistics Templates
  {
    id: 't-test',
    category: 'stats',
    title: 'T-Test',
    description: 'Perform a two-sample t-test',
    language: 'python',
    code: `import numpy as np
from scipy import stats

# Generate two samples
np.random.seed(42)
group1 = np.random.normal(100, 15, 50)
group2 = np.random.normal(105, 15, 50)

# Perform t-test
t_stat, p_value = stats.ttest_ind(group1, group2)

print("Two-Sample T-Test Results")
print("=" * 40)
print(f"Group 1 Mean: {group1.mean():.2f}")
print(f"Group 2 Mean: {group2.mean():.2f}")
print(f"\\nT-Statistic: {t_stat:.4f}")
print(f"P-Value: {p_value:.4f}")

alpha = 0.05
if p_value < alpha:
    print(f"\\nResult: Reject null hypothesis (p < {alpha})")
    print("The means are significantly different.")
else:
    print(f"\\nResult: Fail to reject null hypothesis (p >= {alpha})")
    print("No significant difference between means.")`,
    expectedOutput: 'T-test results with interpretation',
    packages: ['numpy', 'scipy'],
    difficulty: 'intermediate',
    tags: ['statistics', 't-test', 'hypothesis-testing']
  },
  {
    id: 'chi-square',
    category: 'stats',
    title: 'Chi-Square Test',
    description: 'Test for independence in categorical data',
    language: 'python',
    code: `import numpy as np
from scipy.stats import chi2_contingency

# Create contingency table
observed = np.array([
    [30, 10],
    [15, 25],
    [20, 20]
])

# Perform chi-square test
chi2, p_value, dof, expected = chi2_contingency(observed)

print("Chi-Square Test of Independence")
print("=" * 40)
print("\\nObserved Frequencies:")
print(observed)
print("\\nExpected Frequencies:")
print(expected.round(2))
print(f"\\nChi-Square Statistic: {chi2:.4f}")
print(f"Degrees of Freedom: {dof}")
print(f"P-Value: {p_value:.4f}")

alpha = 0.05
if p_value < alpha:
    print(f"\\nResult: Reject null hypothesis (p < {alpha})")
    print("Variables are dependent.")
else:
    print(f"\\nResult: Fail to reject null hypothesis (p >= {alpha})")
    print("Variables are independent.")`,
    expectedOutput: 'Chi-square test results with interpretation',
    packages: ['numpy', 'scipy'],
    difficulty: 'intermediate',
    tags: ['chi-square', 'categorical-data', 'hypothesis-testing']
  },
  {
    id: 'distributions',
    category: 'stats',
    title: 'Probability Distributions',
    description: 'Explore common probability distributions',
    language: 'python',
    code: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate data from different distributions
x = np.linspace(-4, 4, 1000)

# Normal distribution
normal = stats.norm.pdf(x, 0, 1)

# t-distribution
t_dist = stats.t.pdf(x, df=5)

# Chi-square distribution
x_chi = np.linspace(0, 15, 1000)
chi_square = stats.chi2.pdf(x_chi, df=5)

# Create plots
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].plot(x, normal, linewidth=2, color='#6366f1')
axes[0].set_title('Normal Distribution', fontweight='bold')
axes[0].grid(True, alpha=0.3)

axes[1].plot(x, t_dist, linewidth=2, color='#ef4444')
axes[1].set_title('T-Distribution (df=5)', fontweight='bold')
axes[1].grid(True, alpha=0.3)

axes[2].plot(x_chi, chi_square, linewidth=2, color='#10b981')
axes[2].set_title('Chi-Square Distribution (df=5)', fontweight='bold')
axes[2].grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

print("Probability distributions plotted successfully!")`,
    expectedOutput: 'Three distribution plots side by side',
    packages: ['numpy', 'matplotlib', 'scipy'],
    difficulty: 'beginner',
    tags: ['distributions', 'probability', 'statistics']
  },

  // Interview Prep Templates
  {
    id: 'fizzbuzz',
    category: 'interview-prep',
    title: 'FizzBuzz',
    description: 'Classic FizzBuzz problem',
    language: 'python',
    code: `def fizzbuzz(n):
    """Print numbers 1 to n, replacing multiples of 3 with Fizz,
    multiples of 5 with Buzz, and multiples of both with FizzBuzz"""
    
    for i in range(1, n + 1):
        if i % 3 == 0 and i % 5 == 0:
            print("FizzBuzz")
        elif i % 3 == 0:
            print("Fizz")
        elif i % 5 == 0:
            print("Buzz")
        else:
            print(i)

# Test
fizzbuzz(15)`,
    expectedOutput: 'Prints FizzBuzz sequence for numbers 1-15',
    packages: [],
    difficulty: 'beginner',
    tags: ['interview', 'algorithm', 'basics']
  },
  {
    id: 'two-sum',
    category: 'interview-prep',
    title: 'Two Sum',
    description: 'Find two numbers that add up to a target',
    language: 'python',
    code: `def two_sum(nums, target):
    """
    Find indices of two numbers that add up to target.
    Time Complexity: O(n)
    Space Complexity: O(n)
    """
    seen = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    
    return None

# Test cases
test_cases = [
    ([2, 7, 11, 15], 9),
    ([3, 2, 4], 6),
    ([3, 3], 6)
]

for nums, target in test_cases:
    result = two_sum(nums, target)
    print(f"Input: nums = {nums}, target = {target}")
    print(f"Output: {result}")
    if result:
        print(f"Verification: {nums[result[0]]} + {nums[result[1]]} = {target}")
    print()`,
    expectedOutput: 'Solves two-sum problem with verification',
    packages: [],
    difficulty: 'beginner',
    tags: ['interview', 'hash-table', 'algorithm']
  },
  {
    id: 'string-manipulation',
    category: 'interview-prep',
    title: 'String Manipulation',
    description: 'Common string operations and algorithms',
    language: 'python',
    code: `def reverse_string(s):
    """Reverse a string"""
    return s[::-1]

def is_palindrome(s):
    """Check if string is palindrome"""
    s = ''.join(c.lower() for c in s if c.isalnum())
    return s == s[::-1]

def count_vowels(s):
    """Count vowels in string"""
    vowels = 'aeiouAEIOU'
    return sum(1 for c in s if c in vowels)

def first_unique_char(s):
    """Find first unique character"""
    from collections import Counter
    counts = Counter(s)
    for i, char in enumerate(s):
        if counts[char] == 1:
            return i
    return -1

# Test all functions
test_string = "A man a plan a canal Panama"

print(f"Original: {test_string}")
print(f"Reversed: {reverse_string(test_string)}")
print(f"Is Palindrome: {is_palindrome(test_string)}")
print(f"Vowel Count: {count_vowels(test_string)}")

test_string2 = "leetcode"
print(f"\\nFirst unique char in '{test_string2}': index {first_unique_char(test_string2)}")`,
    expectedOutput: 'Demonstrates various string operations',
    packages: [],
    difficulty: 'beginner',
    tags: ['interview', 'strings', 'algorithms']
  },

  // R Templates
  {
    id: 'r-basic-stats',
    category: 'data-science',
    title: 'R: Basic Statistics',
    description: 'Calculate basic statistics in R',
    language: 'r',
    code: `# Create sample data
data <- c(12, 15, 18, 21, 24, 27, 30, 33, 36, 39)

# Basic statistics
cat("Mean:", mean(data), "\\n")
cat("Median:", median(data), "\\n")
cat("Standard Deviation:", sd(data), "\\n")
cat("Variance:", var(data), "\\n")
cat("Min:", min(data), "\\n")
cat("Max:", max(data), "\\n")

# Summary statistics
cat("\\nSummary Statistics:\\n")
print(summary(data))

# Quantiles
cat("\\nQuartiles:\\n")
print(quantile(data))`,
    expectedOutput: 'Displays comprehensive statistical summary',
    packages: [],
    difficulty: 'beginner',
    tags: ['r', 'statistics', 'basics']
  },
  {
    id: 'r-data-frame',
    category: 'data-science',
    title: 'R: Data Frame Operations',
    description: 'Work with data frames in R',
    language: 'r',
    code: `# Create data frame
df <- data.frame(
  Name = c("Alice", "Bob", "Charlie", "David"),
  Age = c(25, 30, 35, 28),
  Salary = c(50000, 60000, 75000, 55000)
)

cat("Original Data Frame:\\n")
print(df)

# Filtering
cat("\\nAge > 27:\\n")
print(df[df$Age > 27, ])

# Adding column
df$Bonus <- df$Salary * 0.1

cat("\\nWith Bonus Column:\\n")
print(df)

# Summary statistics
cat("\\nSummary:\\n")
print(summary(df))`,
    expectedOutput: 'Demonstrates data frame creation and manipulation',
    packages: [],
    difficulty: 'beginner',
    tags: ['r', 'data-frames', 'data-manipulation']
  },
  {
    id: 'r-visualization',
    category: 'visualization',
    title: 'R: Basic Plotting',
    description: 'Create visualizations in R',
    language: 'r',
    code: `# Create sample data
x <- seq(0, 10, length.out = 100)
y <- sin(x)

# Line plot
plot(x, y, type = "l", col = "blue", lwd = 2,
     main = "Sine Wave",
     xlab = "X", ylab = "Y")
grid()

cat("Line plot created successfully!\\n")

# Scatter plot
x2 <- rnorm(50)
y2 <- x2 * 2 + rnorm(50)

plot(x2, y2, pch = 19, col = "darkred",
     main = "Scatter Plot",
     xlab = "X", ylab = "Y")
abline(lm(y2 ~ x2), col = "blue", lwd = 2)
grid()

cat("Scatter plot with regression line created!\\n")`,
    expectedOutput: 'Creates line plot and scatter plot with regression',
    packages: [],
    difficulty: 'beginner',
    tags: ['r', 'visualization', 'plotting']
  }
];

export const getTemplatesByCategory = (category: CodeTemplate['category']) => {
  return codeTemplates.filter(t => t.category === category);
};

export const getTemplatesByLanguage = (language: 'python' | 'r') => {
  return codeTemplates.filter(t => t.language === language);
};

export const getTemplatesByDifficulty = (difficulty: CodeTemplate['difficulty']) => {
  return codeTemplates.filter(t => t.difficulty === difficulty);
};

export const searchTemplates = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return codeTemplates.filter(t => 
    t.title.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};
