import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyntaxSection } from '@/components/SyntaxSection';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema';
import { SoftwareApplicationSchema } from '@/components/SoftwareApplicationSchema';

export default function TypeScriptDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>TypeScript Reference - bIDE Documentation</title>
        <meta name="description" content="Complete TypeScript reference manual for type-safe JavaScript development." />
      </Helmet>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://codemixapp.com/' },
        { name: 'Documentation', url: 'https://codemixapp.com/docs' },
        { name: 'TypeScript', url: 'https://codemixapp.com/docs/typescript' }
      ]} />
      <SoftwareApplicationSchema 
        language="typescript"
        languageName="TypeScript"
        description="Free online TypeScript IDE with type checking. Learn typed JavaScript in your browser. Perfect for modern web development with static type safety."
      />
      
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔷</span>
                <div>
                  <h1 className="text-2xl font-bold">TypeScript Reference</h1>
                  <p className="text-xs text-muted-foreground">Typed superset of JavaScript</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=typescript')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is TypeScript?</h2>
              <p className="text-muted-foreground leading-relaxed">
                TypeScript is a typed superset of JavaScript developed by Microsoft. It adds static type checking 
                and advanced IDE support to JavaScript, catching errors at compile time rather than runtime. 
                TypeScript compiles to plain JavaScript and works anywhere JavaScript runs.
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
                    <span>Large-scale applications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>React, Angular, Vue projects</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Node.js backends</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Type-safe APIs</span>
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
                    <span>Write TypeScript code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Learn type annotations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span>No execution (editor-only)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">Industry Use:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Web Development</Badge>
                <Badge>Enterprise</Badge>
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
                <li>🔹 All JavaScript is valid TypeScript</li>
                <li>🔹 Use interfaces for object shapes</li>
                <li>🔹 Type inference reduces explicit annotations</li>
                <li>🔹 Generics enable reusable typed functions</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Type Annotations"
              icon="🏷️"
              language="typescript"
              examples={[
                {
                  title: 'Basic Types',
                  code: `let name: string = "Alice";
let age: number = 25;
let isStudent: boolean = true;
let hobbies: string[] = ["reading", "coding"];

// Type inference (TypeScript figures it out)
let city = "NYC";  // string inferred`,
                  explanation: 'Add types after colon. TypeScript often infers types automatically.'
                },
                {
                  title: 'Interfaces',
                  code: `interface Person {
  name: string;
  age: number;
  email?: string;  // optional
}

const user: Person = {
  name: "Alice",
  age: 25
};`,
                  explanation: 'Interfaces define object shapes. ? makes properties optional.'
                },
              ]}
            />

            <SyntaxSection
              title="Functions with Types"
              icon="⚙️"
              language="typescript"
              examples={[
                {
                  title: 'Typed Functions',
                  code: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

// Arrow function
const add = (a: number, b: number): number => {
  return a + b;
};

console.log(greet("Alice"));
console.log(add(2, 3));`,
                  explanation: 'Annotate parameter types and return type.'
                },
              ]}
            />

            <SyntaxSection
              title="Generics"
              icon="🎯"
              language="typescript"
              examples={[
                {
                  title: 'Generic Functions',
                  code: `function identity<T>(arg: T): T {
  return arg;
}

let output1 = identity<string>("hello");
let output2 = identity<number>(42);

// Array generic
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}`,
                  explanation: 'Generics create reusable components that work with any type.'
                },
              ]}
            />
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => navigate('/docs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All References
            </Button>
            <Button onClick={() => navigate('/ide?lang=typescript')}>
              Open in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
