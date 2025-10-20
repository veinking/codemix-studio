import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyntaxSection } from '@/components/SyntaxSection';
import { CodeExample } from '@/components/CodeExample';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

export default function PHPDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>PHP Reference - bIDE Documentation</title>
        <meta name="description" content="Complete PHP reference manual for server-side web development." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐘</span>
                <div>
                  <h1 className="text-2xl font-bold">PHP Reference</h1>
                  <p className="text-xs text-muted-foreground">Server-side scripting for the web</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=php')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is PHP?</h2>
              <p className="text-muted-foreground leading-relaxed">
                PHP (Hypertext Preprocessor) is a widely-used server-side scripting language designed for web development. 
                It powers over 75% of websites including WordPress, Facebook, and Wikipedia. PHP excels at generating 
                dynamic page content, handling forms, managing sessions, and interacting with databases.
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
                    <span>Building dynamic websites</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Content management systems</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>E-commerce platforms</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Form processing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>RESTful API development</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Session management</span>
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
                    <span>Run PHP code in-browser (via WebAssembly)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Test PHP syntax and logic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Learn and practice PHP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span>No database connections in browser</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">Industry Use:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Web Development</Badge>
                <Badge>E-commerce</Badge>
                <Badge>CMS</Badge>
                <Badge>Startups</Badge>
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
                <li>🔹 All PHP code must be within {'<?php ?>'} tags</li>
                <li>🔹 Variables start with $ (e.g., $name)</li>
                <li>🔹 Use . for string concatenation</li>
                <li>🔹 Arrays can use numeric or associative keys</li>
                <li>🔹 End statements with semicolon</li>
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
                <li>⚠️ Forgetting $ before variable names</li>
                <li>⚠️ Using + instead of . for concatenation</li>
                <li>⚠️ Case sensitivity with function names (inconsistent)</li>
                <li>⚠️ Not sanitizing user input (security risk)</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Variables & Data Types"
              icon="📦"
              language="php"
              examples={[
                {
                  title: 'Creating Variables',
                  code: `<?php
$name = "Alice";
$age = 25;
$height = 5.6;
$isStudent = true;

echo "Name: $name, Age: $age";
?>`,
                  explanation: 'Variables start with $. PHP is loosely typed.'
                },
                {
                  title: 'Arrays',
                  code: `<?php
// Indexed array
$fruits = ["apple", "banana", "cherry"];
echo $fruits[0];  // apple

// Associative array
$person = [
    "name" => "Alice",
    "age" => 25,
    "city" => "NYC"
];
echo $person["name"];  // Alice
?>`,
                  explanation: 'Arrays can be indexed or associative (key-value pairs).'
                },
              ]}
            />

            <SyntaxSection
              title="Control Flow"
              icon="🔀"
              language="php"
              examples={[
                {
                  title: 'If-Else Statements',
                  code: `<?php
$age = 20;

if ($age >= 18) {
    echo "Adult";
} elseif ($age >= 13) {
    echo "Teenager";
} else {
    echo "Child";
}
?>`,
                  explanation: 'Standard if-else with curly braces. Use elseif (one word).'
                },
                {
                  title: 'For Loops',
                  code: `<?php
for ($i = 0; $i < 5; $i++) {
    echo $i . " ";
}

// Foreach for arrays
$fruits = ["apple", "banana", "cherry"];
foreach ($fruits as $fruit) {
    echo $fruit . " ";
}
?>`,
                  explanation: 'foreach is commonly used for iterating over arrays.'
                },
              ]}
            />

            <SyntaxSection
              title="Functions"
              icon="⚙️"
              language="php"
              examples={[
                {
                  title: 'Defining Functions',
                  code: `<?php
function greet($name) {
    return "Hello, " . $name . "!";
}

echo greet("Alice");

// Default parameters
function sayHello($name = "Guest") {
    return "Hello, $name!";
}
?>`,
                  explanation: 'Use function keyword. Parameters can have default values.'
                },
              ]}
            />

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Example Code</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Form Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeExample
                    language="php"
                    code={`<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST["name"]);
    $email = filter_var($_POST["email"], FILTER_SANITIZE_EMAIL);
    
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "Welcome, $name! Email: $email";
    } else {
        echo "Invalid email address";
    }
}
?>`}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => navigate('/docs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All References
            </Button>
            <Button onClick={() => navigate('/ide?lang=php')}>
              Try PHP in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
