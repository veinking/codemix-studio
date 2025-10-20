import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyntaxSection } from '@/components/SyntaxSection';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema';
import { SoftwareApplicationSchema } from '@/components/SoftwareApplicationSchema';

export default function JavaDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Java Reference - bIDE Documentation</title>
        <meta name="description" content="Complete Java reference manual for enterprise and Android development." />
      </Helmet>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://codemixapp.com/' },
        { name: 'Documentation', url: 'https://codemixapp.com/docs' },
        { name: 'Java', url: 'https://codemixapp.com/docs/java' }
      ]} />
      <SoftwareApplicationSchema 
        language="java"
        languageName="Java"
        description="Free online Java code editor with syntax highlighting. Learn Java programming for enterprise and Android development. Editor-only mode for learning and practice."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-slate-50 to-orange-50 dark:from-background dark:via-slate-900 dark:to-orange-950">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">☕</span>
                <div>
                  <h1 className="text-2xl font-bold">Java Reference</h1>
                  <p className="text-xs text-muted-foreground">Enterprise-grade OOP language</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=java')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is Java?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Java is a widely-used, object-oriented programming language and platform known for "write once, run anywhere" 
                capability. It powers Android apps, enterprise systems, and big data processing. Java emphasizes robustness, 
                security, and platform independence through the Java Virtual Machine (JVM).
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
                    <span>Enterprise applications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Android mobile development</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Backend microservices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Big data processing</span>
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
                    <span>Write and edit Java code</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Learn Java syntax</span>
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
                <Badge>Enterprise</Badge>
                <Badge>Android</Badge>
                <Badge>Finance</Badge>
                <Badge>Big Data</Badge>
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
                <li>🔹 Everything is an object (except primitives)</li>
                <li>🔹 Classes must be in files matching the class name</li>
                <li>🔹 Use camelCase for methods and variables</li>
                <li>🔹 Strong type system prevents many runtime errors</li>
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
                <li>⚠️ NullPointerExceptions from null values</li>
                <li>⚠️ Forgetting to close resources (use try-with-resources)</li>
                <li>⚠️ == compares references, use .equals() for objects</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Classes & Objects"
              icon="📦"
              language="java"
              examples={[
                {
                  title: 'Basic Class',
                  code: `public class Person {
    private String name;
    private int age;
    
    // Constructor
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // Getter
    public String getName() {
        return name;
    }
    
    // Method
    public void greet() {
        System.out.println("Hello, I'm " + name);
    }
}`,
                  explanation: 'Java is object-oriented. Classes define blueprints for objects.'
                },
              ]}
            />

            <SyntaxSection
              title="Control Flow"
              icon="🔀"
              language="java"
              examples={[
                {
                  title: 'If-Else',
                  code: `int age = 20;

if (age >= 18) {
    System.out.println("Adult");
} else if (age >= 13) {
    System.out.println("Teenager");
} else {
    System.out.println("Child");
}`,
                  explanation: 'Standard if-else with curly braces.'
                },
                {
                  title: 'For Loops',
                  code: `// Traditional for loop
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}

// For-each loop
String[] fruits = {"apple", "banana", "cherry"};
for (String fruit : fruits) {
    System.out.println(fruit);
}`,
                  explanation: 'Enhanced for loop (for-each) is cleaner for arrays.'
                },
              ]}
            />

            <SyntaxSection
              title="Collections"
              icon="📋"
              language="java"
              examples={[
                {
                  title: 'ArrayList',
                  code: `import java.util.ArrayList;

ArrayList<String> fruits = new ArrayList<>();
fruits.add("apple");
fruits.add("banana");
fruits.add("cherry");

System.out.println(fruits.get(0));  // apple
System.out.println(fruits.size());   // 3`,
                  explanation: 'ArrayList is a dynamic array. Must import from java.util.'
                },
              ]}
            />
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => navigate('/docs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All References
            </Button>
            <Button onClick={() => navigate('/ide?lang=java')}>
              Open in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
