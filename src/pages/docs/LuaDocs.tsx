import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyntaxSection } from '@/components/SyntaxSection';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

export default function LuaDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Lua Reference - bIDE Documentation</title>
        <meta name="description" content="Complete Lua reference manual for game scripting and embedded systems." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌙</span>
                <div>
                  <h1 className="text-2xl font-bold">Lua Reference</h1>
                  <p className="text-xs text-muted-foreground">Lightweight scripting language</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=lua')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is Lua?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Lua is a lightweight, high-level scripting language designed for embedding in applications. 
                It's widely used in game development (Roblox, World of Warcraft) and embedded systems due to 
                its small footprint, simple syntax, and ease of integration with C/C++.
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
                    <span>Game scripting (Roblox, WoW)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Embedded systems</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Configuration files</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Rapid prototyping</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">Industry Use:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Gaming</Badge>
                <Badge>Embedded Systems</Badge>
                <Badge>Networking</Badge>
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
                <li>🔹 Arrays (tables) start at index 1, not 0</li>
                <li>🔹 Use -- for comments</li>
                <li>🔹 Tables are the only data structure</li>
                <li>🔹 Variables are global by default (use local)</li>
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
                <li>⚠️ Arrays start at 1, not 0</li>
                <li>⚠️ Forgetting local keyword makes variables global</li>
                <li>⚠️ ~= means "not equal", not !=</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Variables & Tables"
              icon="📦"
              language="lua"
              examples={[
                {
                  title: 'Creating Variables',
                  code: `local name = "Alice"
local age = 25
local isStudent = true

print("Name: " .. name .. ", Age: " .. age)`,
                  explanation: 'Use local to create local variables. .. concatenates strings.'
                },
                {
                  title: 'Tables (Arrays & Dictionaries)',
                  code: `-- Array (starts at 1!)
local fruits = {"apple", "banana", "cherry"}
print(fruits[1])  -- apple

-- Dictionary
local person = {
  name = "Alice",
  age = 25,
  city = "NYC"
}
print(person.name)  -- Alice`,
                  explanation: 'Tables serve as both arrays and dictionaries in Lua.'
                },
              ]}
            />

            <SyntaxSection
              title="Control Flow"
              icon="🔀"
              language="lua"
              examples={[
                {
                  title: 'If-Then-Else',
                  code: `local age = 20

if age >= 18 then
  print("Adult")
elseif age >= 13 then
  print("Teenager")
else
  print("Child")
end`,
                  explanation: 'Use then after condition. End with end keyword.'
                },
                {
                  title: 'For Loops',
                  code: `-- Numeric for loop
for i = 1, 5 do
  print(i)
end

-- Iterate over table
local fruits = {"apple", "banana", "cherry"}
for index, fruit in ipairs(fruits) do
  print(index, fruit)
end`,
                  explanation: 'ipairs iterates over array tables.'
                },
              ]}
            />

            <SyntaxSection
              title="Functions"
              icon="⚙️"
              language="lua"
              examples={[
                {
                  title: 'Defining Functions',
                  code: `function greet(name)
  return "Hello, " .. name .. "!"
end

print(greet("Alice"))

-- Anonymous function
local add = function(a, b)
  return a + b
end`,
                  explanation: 'Functions are first-class values in Lua.'
                },
              ]}
            />
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => navigate('/docs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All References
            </Button>
            <Button onClick={() => navigate('/ide?lang=lua')}>
              Try Lua in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
