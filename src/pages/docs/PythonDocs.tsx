import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyntaxSection } from '@/components/SyntaxSection';
import { CodeExample } from '@/components/CodeExample';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PythonDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Python Reference - bIDE Documentation</title>
        <meta name="description" content="Complete Python reference manual with syntax examples, use cases, and best practices for data science and programming." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐍</span>
                <div>
                  <h1 className="text-2xl font-bold">Python Reference</h1>
                  <p className="text-xs text-muted-foreground">Beginner-friendly language for data science and more</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=python')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Overview */}
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is Python?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Python is a high-level, interpreted programming language known for its simplicity and readability. 
                Created by Guido van Rossum in 1991, it emphasizes code readability with significant whitespace. 
                Python's design philosophy emphasizes code readability with the use of significant indentation.
              </p>
            </div>

            {/* Use Cases */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Use Cases & Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Data analysis and visualization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Machine learning and AI</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Web scraping and automation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Scientific computing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Backend web development</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Task automation and scripting</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* bIDE Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Can You Do in bIDE?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Execute Python code in-browser (via Pyodide/WebAssembly)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Install and use popular packages (numpy, pandas, matplotlib, etc.)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Create data visualizations and plots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Work with CSV files and datasets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Native system access limited by browser security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Some C-extension packages may not work</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Industry Use */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Industry Use:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Data Science</Badge>
                <Badge>Machine Learning</Badge>
                <Badge>Finance</Badge>
                <Badge>Healthcare</Badge>
                <Badge>Academia</Badge>
                <Badge>Web Development</Badge>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>🔹 Indentation matters! Use 4 spaces per level</li>
                <li>🔹 Use list comprehensions for concise loops: [x*2 for x in range(5)]</li>
                <li>🔹 String formatting: f"Value: {'{variable}'}"</li>
                <li>🔹 Check type with type(variable)</li>
                <li>🔹 Use descriptive variable names for readability</li>
                <li>🔹 Python is case-sensitive (name ≠ Name)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Common Pitfalls */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Common Pitfalls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>⚠️ Mixing tabs and spaces causes IndentationError</li>
                <li>⚠️ Lists are mutable - be careful with references</li>
                <li>⚠️ Division: / gives float, // gives int</li>
                <li>⚠️ Mutable default arguments can cause bugs</li>
                <li>⚠️ Using == for comparison with None (use 'is' instead)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Core Syntax Reference */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Variables & Data Types"
              icon="📦"
              language="python"
              examples={[
                {
                  title: 'Creating Variables',
                  code: `name = "Alice"        # String
age = 25              # Integer
height = 5.6          # Float
is_student = True     # Boolean`,
                  explanation: 'Python uses dynamic typing - no need to declare types explicitly.'
                },
                {
                  title: 'Lists (Arrays)',
                  code: `fruits = ["apple", "banana", "cherry"]
print(fruits[0])  # Output: apple

# Add items
fruits.append("orange")

# Remove items
fruits.remove("banana")`,
                  explanation: 'Lists are ordered, mutable collections. Indexing starts at 0.'
                },
                {
                  title: 'Dictionaries (Objects)',
                  code: `student = {
    "name": "Alice",
    "age": 25,
    "major": "Computer Science"
}

print(student["name"])  # Output: Alice
student["gpa"] = 3.8    # Add new key`,
                  explanation: 'Dictionaries store data as key-value pairs. Keys must be unique.'
                },
                {
                  title: 'Tuples (Immutable)',
                  code: `coordinates = (10, 20)
x, y = coordinates  # Unpacking

# Tuples cannot be modified
# coordinates[0] = 15  # This would raise an error`,
                  explanation: 'Tuples are immutable lists. Use them for fixed collections.'
                },
              ]}
            />

            <SyntaxSection
              title="Control Flow"
              icon="🔀"
              language="python"
              examples={[
                {
                  title: 'If-Else Statements',
                  code: `age = 20

if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")`,
                  explanation: 'Use 4-space indentation to define code blocks. Colons (:) start blocks.'
                },
                {
                  title: 'Ternary Operator',
                  code: `age = 20
status = "Adult" if age >= 18 else "Minor"
print(status)  # Output: Adult`,
                  explanation: 'Compact way to write simple if-else statements in one line.'
                },
                {
                  title: 'Match Statement (Python 3.10+)',
                  code: `command = "start"

match command:
    case "start":
        print("Starting...")
    case "stop":
        print("Stopping...")
    case _:
        print("Unknown command")`,
                  explanation: 'Pattern matching similar to switch statements in other languages.'
                },
              ]}
            />

            <SyntaxSection
              title="Loops"
              icon="🔁"
              language="python"
              examples={[
                {
                  title: 'For Loops',
                  code: `# Loop over a range
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

# Loop over a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)`,
                  explanation: 'range(5) generates numbers 0-4. For loops iterate over sequences.'
                },
                {
                  title: 'While Loops',
                  code: `count = 0
while count < 5:
    print(count)
    count += 1`,
                  explanation: 'While loops continue until the condition becomes False.'
                },
                {
                  title: 'Loop Control (Break & Continue)',
                  code: `for i in range(10):
    if i == 3:
        continue  # Skip 3
    if i == 7:
        break     # Stop at 7
    print(i)`,
                  explanation: 'break exits the loop, continue skips to next iteration.'
                },
                {
                  title: 'Enumerate (Index + Value)',
                  code: `fruits = ["apple", "banana", "cherry"]
for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")
# 0: apple
# 1: banana
# 2: cherry`,
                  explanation: 'enumerate() provides both index and value in loops.'
                },
              ]}
            />

            <SyntaxSection
              title="Functions"
              icon="⚙️"
              language="python"
              examples={[
                {
                  title: 'Defining Functions',
                  code: `def greet(name):
    return f"Hello, {name}!"

message = greet("Alice")
print(message)  # Hello, Alice!`,
                  explanation: 'Use def to define functions. f-strings make formatting easy.'
                },
                {
                  title: 'Default Parameters',
                  code: `def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Alice"))              # Hello, Alice!
print(greet("Bob", "Hi"))          # Hi, Bob!`,
                  explanation: 'Parameters can have default values. Optional when calling.'
                },
                {
                  title: 'Lambda Functions',
                  code: `square = lambda x: x ** 2
print(square(5))  # 25

# Common with map/filter
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
print(squared)  # [1, 4, 9, 16, 25]`,
                  explanation: 'Lambda functions are one-line anonymous functions.'
                },
                {
                  title: '*args and **kwargs',
                  code: `def sum_all(*args):
    return sum(args)

print(sum_all(1, 2, 3, 4))  # 10

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25)`,
                  explanation: '*args accepts any number of positional arguments, **kwargs accepts keyword arguments.'
                },
              ]}
            />

            <SyntaxSection
              title="List Comprehensions"
              icon="⚡"
              language="python"
              examples={[
                {
                  title: 'Basic List Comprehension',
                  code: `# Traditional way
squares = []
for x in range(5):
    squares.append(x ** 2)

# List comprehension (Pythonic)
squares = [x ** 2 for x in range(5)]
print(squares)  # [0, 1, 4, 9, 16]`,
                  explanation: 'List comprehensions are more concise and readable.'
                },
                {
                  title: 'With Condition',
                  code: `# Even numbers only
evens = [x for x in range(10) if x % 2 == 0]
print(evens)  # [0, 2, 4, 6, 8]`,
                  explanation: 'Add if conditions to filter elements.'
                },
                {
                  title: 'Dictionary Comprehension',
                  code: `# Square numbers as dictionary
squares_dict = {x: x**2 for x in range(5)}
print(squares_dict)  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}`,
                  explanation: 'Comprehensions work with dictionaries too.'
                },
              ]}
            />

            <SyntaxSection
              title="String Operations"
              icon="📝"
              language="python"
              examples={[
                {
                  title: 'String Formatting',
                  code: `name = "Alice"
age = 25

# f-strings (recommended)
message = f"My name is {name} and I'm {age} years old"

# .format() method
message = "My name is {} and I'm {} years old".format(name, age)

# % operator (old style)
message = "My name is %s and I'm %d years old" % (name, age)`,
                  explanation: 'f-strings are the modern, preferred way to format strings.'
                },
                {
                  title: 'Common String Methods',
                  code: `text = "  Hello World  "
print(text.strip())         # "Hello World"
print(text.upper())         # "  HELLO WORLD  "
print(text.lower())         # "  hello world  "
print(text.replace("World", "Python"))  # "  Hello Python  "
print(text.split())         # ["Hello", "World"]`,
                  explanation: 'Strings have many built-in methods for manipulation.'
                },
                {
                  title: 'String Slicing',
                  code: `text = "Hello World"
print(text[0:5])    # "Hello"
print(text[:5])     # "Hello"
print(text[6:])     # "World"
print(text[-5:])    # "World"
print(text[::-1])   # "dlroW olleH" (reversed)`,
                  explanation: 'Slicing syntax: [start:end:step]. Negative indices count from end.'
                },
              ]}
            />

            <SyntaxSection
              title="Error Handling"
              icon="🛡️"
              language="python"
              examples={[
                {
                  title: 'Try-Except Blocks',
                  code: `try:
    number = int(input("Enter a number: "))
    result = 10 / number
    print(result)
except ValueError:
    print("Invalid number!")
except ZeroDivisionError:
    print("Cannot divide by zero!")
except Exception as e:
    print(f"An error occurred: {e}")`,
                  explanation: 'Catch specific exceptions to handle different error types.'
                },
                {
                  title: 'Finally Block',
                  code: `try:
    file = open("data.txt", "r")
    content = file.read()
except FileNotFoundError:
    print("File not found!")
finally:
    file.close()  # Always runs`,
                  explanation: 'finally block executes whether an exception occurred or not.'
                },
                {
                  title: 'Raising Exceptions',
                  code: `def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero!")
    return a / b

try:
    result = divide(10, 0)
except ValueError as e:
    print(e)`,
                  explanation: 'Use raise to throw your own exceptions with custom messages.'
                },
              ]}
            />

            {/* Example Projects */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Example Projects</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Data Analysis with Pandas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="python"
                      code={`import pandas as pd
import matplotlib.pyplot as plt

# Load dataset
df = pd.read_csv('data.csv')

# Basic analysis
print(df.describe())
print(df.head())

# Filter data
adults = df[df['age'] > 18]

# Visualize
df['column'].plot(kind='bar')
plt.title('Data Visualization')
plt.show()`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Web Scraping</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="python"
                      code={`import requests
from bs4 import BeautifulSoup

# Fetch webpage
response = requests.get('https://example.com')
soup = BeautifulSoup(response.text, 'html.parser')

# Extract data
titles = soup.find_all('h2')
for title in titles:
    print(title.text)

# Extract links
links = soup.find_all('a')
for link in links:
    print(link.get('href'))`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Simple Machine Learning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="python"
                      code={`from sklearn.linear_model import LinearRegression
import numpy as np

# Sample data
X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 6, 8, 10])

# Train model
model = LinearRegression()
model.fit(X, y)

# Predict
prediction = model.predict([[6]])
print(f"Prediction for 6: {prediction[0]}")  # ~12`}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Popular Libraries */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-4">Popular Libraries in bIDE</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">pandas</h3>
                    <p className="text-sm text-muted-foreground">Data manipulation and analysis</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">numpy</h3>
                    <p className="text-sm text-muted-foreground">Numerical computing</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">matplotlib</h3>
                    <p className="text-sm text-muted-foreground">Data visualization and plotting</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">scikit-learn</h3>
                    <p className="text-sm text-muted-foreground">Machine learning toolkit</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 pt-8 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => navigate('/docs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All References
            </Button>
            <Button onClick={() => navigate('/ide?lang=python')}>
              Try Python in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
