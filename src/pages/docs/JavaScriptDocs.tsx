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

export default function JavaScriptDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>JavaScript Documentation - bIDE | Modern JS Reference & Examples</title>
        <meta name="description" content="JavaScript reference guide for bIDE. ES6+ features, DOM manipulation, async/await, arrays, objects, and more. Interactive examples you can run instantly." />
        <meta name="keywords" content="javascript documentation, javascript syntax, javascript tutorial, es6 javascript, modern javascript, javascript examples, learn javascript" />
        <link rel="canonical" href="https://bideide.com/docs/javascript" />
      </Helmet>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://bideide.com/' },
        { name: 'Documentation', url: 'https://bideide.com/docs' },
        { name: 'JavaScript', url: 'https://bideide.com/docs/javascript' }
      ]} />
      <SoftwareApplicationSchema 
        language="javascript"
        languageName="JavaScript"
        description="Free online JavaScript IDE with modern ES6+ support. Run JavaScript code directly in your browser. Perfect for learning web development and testing code snippets."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-slate-50 to-yellow-50 dark:from-background dark:via-slate-900 dark:to-yellow-950">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚡</span>
                <div>
                  <h1 className="text-2xl font-bold">JavaScript Reference</h1>
                  <p className="text-xs text-muted-foreground">The language of the web</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=javascript')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is JavaScript?</h2>
              <p className="text-muted-foreground leading-relaxed">
                JavaScript is a versatile, high-level programming language that runs in web browsers and on servers (Node.js). 
                Originally created to make web pages interactive, it has evolved into one of the most popular programming languages 
                in the world, powering everything from simple websites to complex web applications.
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
                    <span>Frontend web development</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Interactive web applications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>DOM manipulation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Async operations and APIs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Browser automation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Client-side validation</span>
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
                    <span>Run JavaScript code directly in browser</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Test code snippets instantly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Learn and practice syntax</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span>No DOM access (console-based only)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">Industry Use:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Web Development</Badge>
                <Badge>Mobile Apps</Badge>
                <Badge>E-commerce</Badge>
                <Badge>Startups</Badge>
                <Badge>Gaming</Badge>
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
                <li>🔹 Use === for comparison (not ==)</li>
                <li>🔹 Template literals: `Hello ${'${name}'}`</li>
                <li>🔹 Array methods: .map(), .filter(), .reduce()</li>
                <li>🔹 async/await for asynchronous code</li>
                <li>🔹 const for values that won't change, let for variables</li>
                <li>🔹 Arrow functions for cleaner syntax</li>
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
                <li>⚠️ == does type coercion, always use ===</li>
                <li>⚠️ this binding can be confusing in different contexts</li>
                <li>⚠️ Variables declared with var have function scope</li>
                <li>⚠️ Forgetting to return in arrow functions</li>
                <li>⚠️ Async functions always return promises</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Variables & Data Types"
              icon="📦"
              language="javascript"
              examples={[
                {
                  title: 'let, const, and var',
                  code: `let age = 25;           // can change
const name = "Alice";   // cannot change
var old = 10;           // legacy, avoid

age = 26;  // OK
// name = "Bob";  // Error!`,
                  explanation: 'Use const by default, let when you need to reassign. Avoid var.'
                },
                {
                  title: 'Arrays',
                  code: `const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);  // "apple"

// Add item
fruits.push("orange");

// Remove last item
fruits.pop();`,
                  explanation: 'Arrays are zero-indexed. Use .push() and .pop() to modify.'
                },
                {
                  title: 'Objects',
                  code: `const person = {
  name: "Alice",
  age: 25,
  city: "New York"
};

console.log(person.name);     // "Alice"
console.log(person["age"]);   // 25

// Add property
person.job = "Developer";`,
                  explanation: 'Objects store key-value pairs. Access with dot or bracket notation.'
                },
              ]}
            />

            <SyntaxSection
              title="Control Flow"
              icon="🔀"
              language="javascript"
              examples={[
                {
                  title: 'If-Else Statements',
                  code: `const age = 20;

if (age >= 18) {
  console.log("Adult");
} else if (age >= 13) {
  console.log("Teenager");
} else {
  console.log("Child");
}`,
                  explanation: 'Use curly braces for code blocks. Condition in parentheses.'
                },
                {
                  title: 'Ternary Operator',
                  code: `const age = 20;
const status = age >= 18 ? "Adult" : "Minor";
console.log(status);  // "Adult"`,
                  explanation: 'Compact way to write simple conditionals.'
                },
                {
                  title: 'Switch Statement',
                  code: `const day = "Monday";

switch (day) {
  case "Monday":
    console.log("Start of week");
    break;
  case "Friday":
    console.log("Almost weekend!");
    break;
  default:
    console.log("Regular day");
}`,
                  explanation: 'Switch is useful for multiple conditions on same value.'
                },
              ]}
            />

            <SyntaxSection
              title="Loops"
              icon="🔁"
              language="javascript"
              examples={[
                {
                  title: 'For Loop',
                  code: `for (let i = 0; i < 5; i++) {
  console.log(i);  // 0, 1, 2, 3, 4
}

// Loop over array
const fruits = ["apple", "banana", "cherry"];
for (let i = 0; i < fruits.length; i++) {
  console.log(fruits[i]);
}`,
                  explanation: 'Classic for loop with initialization, condition, and increment.'
                },
                {
                  title: 'For...of Loop',
                  code: `const fruits = ["apple", "banana", "cherry"];

for (const fruit of fruits) {
  console.log(fruit);
}`,
                  explanation: 'Cleaner way to iterate over array values.'
                },
                {
                  title: 'While Loop',
                  code: `let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}`,
                  explanation: 'While loops continue until condition is false.'
                },
              ]}
            />

            <SyntaxSection
              title="Functions"
              icon="⚙️"
              language="javascript"
              examples={[
                {
                  title: 'Function Declaration',
                  code: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Alice"));  // "Hello, Alice!"`,
                  explanation: 'Traditional function declaration with function keyword.'
                },
                {
                  title: 'Arrow Functions',
                  code: `const greet = (name) => {
  return \`Hello, \${name}!\`;
};

// Concise version (implicit return)
const add = (a, b) => a + b;

console.log(add(2, 3));  // 5`,
                  explanation: 'Arrow functions are shorter and don\'t bind their own this.'
                },
                {
                  title: 'Default Parameters',
                  code: `const greet = (name = "Guest") => {
  return \`Hello, \${name}!\`;
};

console.log(greet());         // "Hello, Guest!"
console.log(greet("Alice"));  // "Hello, Alice!"`,
                  explanation: 'Parameters can have default values for when not provided.'
                },
              ]}
            />

            <SyntaxSection
              title="Array Methods"
              icon="📋"
              language="javascript"
              examples={[
                {
                  title: 'map, filter, reduce',
                  code: `const numbers = [1, 2, 3, 4, 5];

// map: transform each element
const doubled = numbers.map(n => n * 2);
console.log(doubled);  // [2, 4, 6, 8, 10]

// filter: keep elements that pass test
const evens = numbers.filter(n => n % 2 === 0);
console.log(evens);  // [2, 4]

// reduce: combine into single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log(sum);  // 15`,
                  explanation: 'Functional array methods for common operations.'
                },
              ]}
            />

            <SyntaxSection
              title="Async/Await"
              icon="⏱️"
              language="javascript"
              examples={[
                {
                  title: 'Promises and Async/Await',
                  code: `// Promise-based
function fetchData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: "Hello" });
    }, 1000);
  });
}

// Using async/await
async function getData() {
  console.log("Fetching...");
  const result = await fetchData();
  console.log(result.data);
}

getData();`,
                  explanation: 'async/await makes asynchronous code look synchronous.'
                },
              ]}
            />

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Example Projects</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Array Manipulation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="javascript"
                      code={`const students = [
  { name: "Alice", score: 85 },
  { name: "Bob", score: 92 },
  { name: "Charlie", score: 78 }
];

// Filter and map
const topStudents = students
  .filter(s => s.score >= 80)
  .map(s => s.name);

console.log("Top students:", topStudents);
// ["Alice", "Bob"]`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Async Data Processing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="javascript"
                      code={`async function processData() {
  const data = [1, 2, 3, 4, 5];
  
  // Simulate async operation
  const results = await Promise.all(
    data.map(async (num) => {
      return num * 2;
    })
  );
  
  console.log("Results:", results);
  // [2, 4, 6, 8, 10]
}

processData();`}
                    />
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
            <Button onClick={() => navigate('/ide?lang=javascript')}>
              Try JavaScript in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
