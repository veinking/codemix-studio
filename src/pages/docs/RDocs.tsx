import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyntaxSection } from '@/components/SyntaxSection';
import { CodeExample } from '@/components/CodeExample';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema';
import { SoftwareApplicationSchema } from '@/components/SoftwareApplicationSchema';

export default function RDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>R Documentation - bIDE | Statistical Programming Reference</title>
        <meta name="description" content="Complete R language reference for bIDE. Data analysis, visualization with ggplot2, statistical functions, and data manipulation. Run R code examples instantly in your browser." />
        <meta name="keywords" content="r documentation, r programming, r syntax, r tutorial, r examples, ggplot2, data analysis in r, statistical programming" />
        <link rel="canonical" href="https://bideide.com/docs/r" />
      </Helmet>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://bideide.com/' },
        { name: 'Documentation', url: 'https://bideide.com/docs' },
        { name: 'R', url: 'https://bideide.com/docs/r' }
      ]} />
      <SoftwareApplicationSchema 
        language="r"
        languageName="R"
        description="Free online R IDE for statistics and data science. Run R code with webR in your browser. Includes ggplot2, dplyr, and statistical analysis tools."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-slate-50 to-purple-50 dark:from-background dark:via-slate-900 dark:to-purple-950">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <h1 className="text-2xl font-bold">R Reference</h1>
                  <p className="text-xs text-muted-foreground">Statistical computing and data visualization</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=r')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is R?</h2>
              <p className="text-muted-foreground leading-relaxed">
                R is a programming language and environment specifically designed for statistical computing and graphics. 
                Developed by statisticians for statisticians, it excels at data analysis, statistical modeling, and creating 
                publication-quality visualizations. R is the go-to language in academia, biotech, and data science.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Use Cases & Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Statistical analysis and modeling</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Data visualization with ggplot2</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Bioinformatics and genomics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Time series forecasting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>A/B testing and experimentation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Academic research publications</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Can You Do in bIDE?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Run R code in-browser (via webR/WebAssembly)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Install CRAN packages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Create plots and visualizations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Statistical analysis and modeling</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">Industry Use:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Statistics</Badge>
                <Badge>Biotech</Badge>
                <Badge>Pharma</Badge>
                <Badge>Academia</Badge>
                <Badge>Finance</Badge>
                <Badge>Market Research</Badge>
              </div>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>🔹 Use {'<-'} for assignment (not =)</li>
                <li>🔹 Vectorized operations: x * 2 multiplies entire vector</li>
                <li>🔹 Missing values: NA (not null)</li>
                <li>🔹 Load libraries: library(ggplot2)</li>
                <li>🔹 Pipe operator: {`%>%`} for chaining operations</li>
                <li>🔹 View data: head(df), summary(df), str(df)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Common Pitfalls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>⚠️ Indexing starts at 1 (not 0)</li>
                <li>⚠️ Factors can cause confusion - understand levels</li>
                <li>⚠️ Use == for comparison, not =</li>
                <li>⚠️ R is case-sensitive (data ≠ Data)</li>
                <li>⚠️ Vectors are recycled in operations</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Vectors & Data Structures"
              icon="📊"
              language="r"
              examples={[
                {
                  title: 'Creating Vectors',
                  code: `x <- c(1, 2, 3, 4, 5)
names <- c("Alice", "Bob", "Charlie")

# Sequences
seq1 <- 1:10
seq2 <- seq(0, 100, by=10)`,
                  explanation: 'Use c() to combine values. <- is the assignment operator.'
                },
                {
                  title: 'Data Frames',
                  code: `df <- data.frame(
  name = c("Alice", "Bob", "Charlie"),
  age = c(25, 30, 35),
  score = c(95, 87, 92)
)

# Access columns
df$name
df[["age"]]

# Filter rows
df[df$age > 28, ]`,
                  explanation: 'Data frames are like tables - columns can have different types.'
                },
                {
                  title: 'Lists',
                  code: `my_list <- list(
  numbers = c(1, 2, 3),
  text = "Hello",
  data = data.frame(x=1:3, y=4:6)
)

# Access elements
my_list$numbers
my_list[[1]]`,
                  explanation: 'Lists can contain mixed types and nested structures.'
                },
              ]}
            />

            <SyntaxSection
              title="Control Flow"
              icon="🔀"
              language="r"
              examples={[
                {
                  title: 'If-Else Statements',
                  code: `x <- 10

if (x > 0) {
  print("Positive")
} else if (x < 0) {
  print("Negative")
} else {
  print("Zero")
}`,
                  explanation: 'Curly braces define code blocks. Parentheses around conditions.'
                },
                {
                  title: 'For Loops',
                  code: `for (i in 1:5) {
  print(i)
}

# Loop over vector
fruits <- c("apple", "banana", "cherry")
for (fruit in fruits) {
  print(fruit)
}`,
                  explanation: '1:5 creates a sequence from 1 to 5. For loops iterate over sequences.'
                },
                {
                  title: 'While Loops',
                  code: `count <- 1
while (count <= 5) {
  print(count)
  count <- count + 1
}`,
                  explanation: 'While loops continue until condition becomes FALSE.'
                },
              ]}
            />

            <SyntaxSection
              title="Functions"
              icon="⚙️"
              language="r"
              examples={[
                {
                  title: 'Defining Functions',
                  code: `greet <- function(name) {
  return(paste("Hello", name))
}

message <- greet("Alice")
print(message)  # "Hello Alice"`,
                  explanation: 'Functions are assigned to variables. Return is optional for last expression.'
                },
                {
                  title: 'Default Parameters',
                  code: `greet <- function(name, greeting = "Hello") {
  return(paste(greeting, name))
}

greet("Alice")           # "Hello Alice"
greet("Bob", "Hi")       # "Hi Bob"`,
                  explanation: 'Parameters can have default values.'
                },
                {
                  title: 'Anonymous Functions',
                  code: `# Apply function to vector
squared <- sapply(1:5, function(x) x^2)
print(squared)  # 1 4 9 16 25`,
                  explanation: 'Anonymous functions are useful with apply family functions.'
                },
              ]}
            />

            <SyntaxSection
              title="Data Manipulation (dplyr)"
              icon="🔧"
              language="r"
              examples={[
                {
                  title: 'Filter and Select',
                  code: `library(dplyr)

# Filter rows
adults <- df %>% 
  filter(age >= 18)

# Select columns
names_ages <- df %>% 
  select(name, age)`,
                  explanation: 'The pipe operator %>% chains operations together.'
                },
                {
                  title: 'Mutate and Summarize',
                  code: `df %>%
  mutate(age_group = ifelse(age >= 30, "30+", "Under 30")) %>%
  group_by(age_group) %>%
  summarize(
    avg_score = mean(score),
    count = n()
  )`,
                  explanation: 'mutate creates new columns, summarize aggregates data.'
                },
              ]}
            />

            <SyntaxSection
              title="Plotting with ggplot2"
              icon="📈"
              language="r"
              examples={[
                {
                  title: 'Basic Plot',
                  code: `library(ggplot2)

ggplot(df, aes(x = age, y = score)) +
  geom_point() +
  labs(title = "Age vs Score",
       x = "Age", 
       y = "Score") +
  theme_minimal()`,
                  explanation: 'ggplot2 uses layers (+) to build plots incrementally.'
                },
                {
                  title: 'Bar Plot',
                  code: `ggplot(df, aes(x = name, y = score, fill = name)) +
  geom_col() +
  labs(title = "Scores by Person") +
  theme(legend.position = "none")`,
                  explanation: 'geom_col creates bar plots. fill adds color.'
                },
              ]}
            />

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Example Projects</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistical Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="r"
                      code={`# Load data
data <- read.csv("data.csv")

# Summary statistics
summary(data)

# Linear regression
model <- lm(y ~ x, data = data)
summary(model)

# Visualize
plot(data$x, data$y)
abline(model, col = "red")`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Visualization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="r"
                      code={`library(ggplot2)
library(dplyr)

# Data processing and viz
mtcars %>%
  mutate(efficiency = mpg / wt) %>%
  ggplot(aes(x = hp, y = efficiency, color = factor(cyl))) +
  geom_point(size = 3) +
  geom_smooth(method = "lm") +
  labs(title = "Engine Power vs Efficiency",
       x = "Horsepower",
       y = "Efficiency (mpg/wt)",
       color = "Cylinders") +
  theme_minimal()`}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Popular Libraries</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">ggplot2</h3>
                    <p className="text-sm text-muted-foreground">Elegant data visualization</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">dplyr</h3>
                    <p className="text-sm text-muted-foreground">Data manipulation grammar</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">tidyr</h3>
                    <p className="text-sm text-muted-foreground">Data tidying tools</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">caret</h3>
                    <p className="text-sm text-muted-foreground">Machine learning toolkit</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => navigate('/docs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All References
            </Button>
            <Button onClick={() => navigate('/ide?lang=r')}>
              Try R in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
