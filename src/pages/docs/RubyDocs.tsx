import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyntaxSection } from '@/components/SyntaxSection';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema';
import { SoftwareApplicationSchema } from '@/components/SoftwareApplicationSchema';

export default function RubyDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Ruby Reference - bIDE Documentation</title>
        <meta name="description" content="Complete Ruby reference manual for elegant web development." />
      </Helmet>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://codemixapp.com/' },
        { name: 'Documentation', url: 'https://codemixapp.com/docs' },
        { name: 'Ruby', url: 'https://codemixapp.com/docs/ruby' }
      ]} />
      <SoftwareApplicationSchema 
        language="ruby"
        languageName="Ruby"
        description="Free online Ruby code editor. Learn Ruby programming with WebAssembly execution. Perfect for Ruby on Rails developers and beginners."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-slate-50 to-red-50 dark:from-background dark:via-slate-900 dark:to-red-950">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💎</span>
                <div>
                  <h1 className="text-2xl font-bold">Ruby Reference</h1>
                  <p className="text-xs text-muted-foreground">Elegant, readable programming</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=ruby')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is Ruby?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ruby is a dynamic, object-oriented programming language designed for developer happiness and productivity. 
                Created by Yukihiro Matsumoto, it emphasizes simplicity and elegance. Ruby on Rails, its famous web framework, 
                revolutionized web development with convention over configuration.
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
                    <span>Web development (Rails)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Scripting and automation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>DevOps tooling</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Rapid prototyping</span>
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
                    <span>Run Ruby code in-browser</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Practice Ruby syntax</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Rails features limited in browser</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">Industry Use:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Web Development</Badge>
                <Badge>Startups</Badge>
                <Badge>DevOps</Badge>
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
                <li>🔹 Everything is an object in Ruby</li>
                <li>🔹 Use snake_case for variables and methods</li>
                <li>🔹 Blocks are powerful: {`[1,2,3].each { |n| puts n }`}</li>
                <li>🔹 Question marks in method names indicate boolean return</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Variables & Data Types"
              icon="📦"
              language="ruby"
              examples={[
                {
                  title: 'Creating Variables',
                  code: `name = "Alice"
age = 25
is_student = true

# Symbols (immutable strings)
status = :active

puts "Name: #{name}, Age: #{age}"`,
                  explanation: 'Ruby uses dynamic typing. Symbols are memory-efficient identifiers.'
                },
                {
                  title: 'Arrays and Hashes',
                  code: `# Arrays
fruits = ["apple", "banana", "cherry"]
puts fruits[0]  # apple

# Hashes (like dictionaries)
person = {
  name: "Alice",
  age: 25,
  city: "NYC"
}
puts person[:name]  # Alice`,
                  explanation: 'Arrays and hashes are fundamental Ruby data structures.'
                },
              ]}
            />

            <SyntaxSection
              title="Control Flow"
              icon="🔀"
              language="ruby"
              examples={[
                {
                  title: 'If-Else Statements',
                  code: `age = 20

if age >= 18
  puts "Adult"
elsif age >= 13
  puts "Teenager"
else
  puts "Child"
end

# One-liner
puts "Adult" if age >= 18`,
                  explanation: 'Ruby uses end keyword instead of curly braces.'
                },
              ]}
            />

            <SyntaxSection
              title="Blocks & Iterators"
              icon="🔁"
              language="ruby"
              examples={[
                {
                  title: 'Each Iterator',
                  code: `[1, 2, 3, 4, 5].each do |num|
  puts num * 2
end

# Short form
[1, 2, 3].each { |n| puts n }`,
                  explanation: 'Blocks are Ruby\'s way of passing code to methods.'
                },
                {
                  title: 'Map and Select',
                  code: `numbers = [1, 2, 3, 4, 5]

# Map (transform)
doubled = numbers.map { |n| n * 2 }

# Select (filter)
evens = numbers.select { |n| n.even? }`,
                  explanation: 'Functional programming methods for collections.'
                },
              ]}
            />
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => navigate('/docs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All References
            </Button>
            <Button onClick={() => navigate('/ide?lang=ruby')}>
              Try Ruby in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
