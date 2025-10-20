import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyntaxSection } from '@/components/SyntaxSection';
import { CodeExample } from '@/components/CodeExample';
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

export default function SQLDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>SQL Reference - bIDE Documentation</title>
        <meta name="description" content="Complete SQL reference manual for database queries and data manipulation." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🗄️</span>
                <div>
                  <h1 className="text-2xl font-bold">SQL Reference</h1>
                  <p className="text-xs text-muted-foreground">Query and manage relational databases</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=sql')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">What is SQL?</h2>
              <p className="text-muted-foreground leading-relaxed">
                SQL (Structured Query Language) is a standard language for storing, manipulating, and retrieving data in 
                relational databases. It's used by virtually every database system including MySQL, PostgreSQL, SQL Server, 
                Oracle, and SQLite. SQL is essential for data analysts, database administrators, and backend developers.
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
                    <span>Query databases for reporting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Data manipulation (CRUD operations)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Business intelligence and analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Database design and schema management</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Complex joins and aggregations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Data warehousing</span>
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
                    <span>Run SQL queries in-browser (SQLite via WebAssembly)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Practice SQL syntax and commands</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Learn database operations</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-semibold mb-2">Industry Use:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Data Analysis</Badge>
                <Badge>Business Intelligence</Badge>
                <Badge>Backend Development</Badge>
                <Badge>Finance</Badge>
                <Badge>Healthcare</Badge>
                <Badge>E-commerce</Badge>
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
                <li>🔹 SQL keywords are case-insensitive (but UPPERCASE is convention)</li>
                <li>🔹 Use LIMIT to restrict number of rows returned</li>
                <li>🔹 ORDER BY for sorting results</li>
                <li>🔹 GROUP BY for aggregations</li>
                <li>🔹 Always end statements with semicolon</li>
                <li>🔹 Use aliases (AS) for clarity</li>
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
                <li>⚠️ Single quotes for strings, not double quotes</li>
                <li>⚠️ NULL comparisons require IS NULL, not = NULL</li>
                <li>⚠️ Forgetting GROUP BY when using aggregate functions</li>
                <li>⚠️ JOIN types matter (INNER, LEFT, RIGHT, FULL)</li>
                <li>⚠️ Column names in SELECT must be in GROUP BY or aggregated</li>
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Core Syntax Reference</h2>

            <SyntaxSection
              title="Basic Queries"
              icon="🔍"
              language="sql"
              examples={[
                {
                  title: 'SELECT Statement',
                  code: `SELECT name, age, city 
FROM users 
WHERE age > 25;`,
                  explanation: 'Retrieve specific columns from a table with conditions.'
                },
                {
                  title: 'SELECT with ORDER BY',
                  code: `SELECT name, salary 
FROM employees 
ORDER BY salary DESC 
LIMIT 10;`,
                  explanation: 'Order results and limit number of rows returned.'
                },
                {
                  title: 'DISTINCT Values',
                  code: `SELECT DISTINCT city 
FROM users;`,
                  explanation: 'Get unique values, removing duplicates.'
                },
              ]}
            />

            <SyntaxSection
              title="Filtering Data"
              icon="🎯"
              language="sql"
              examples={[
                {
                  title: 'WHERE Clause',
                  code: `SELECT * FROM products 
WHERE price > 100 
  AND category = 'Electronics'
  AND stock > 0;`,
                  explanation: 'Filter rows based on multiple conditions.'
                },
                {
                  title: 'IN and BETWEEN',
                  code: `SELECT * FROM orders 
WHERE status IN ('pending', 'processing', 'shipped');

SELECT * FROM sales 
WHERE date BETWEEN '2024-01-01' AND '2024-12-31';`,
                  explanation: 'IN checks if value is in a list, BETWEEN for ranges.'
                },
                {
                  title: 'LIKE Pattern Matching',
                  code: `SELECT * FROM customers 
WHERE email LIKE '%@gmail.com';

SELECT * FROM products 
WHERE name LIKE 'Apple%';`,
                  explanation: '% is wildcard for any characters. _ for single character.'
                },
              ]}
            />

            <SyntaxSection
              title="Joins"
              icon="🔗"
              language="sql"
              examples={[
                {
                  title: 'INNER JOIN',
                  code: `SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;`,
                  explanation: 'Combine rows from two tables based on related column.'
                },
                {
                  title: 'LEFT JOIN',
                  code: `SELECT users.name, orders.total
FROM users
LEFT JOIN orders ON users.id = orders.user_id;`,
                  explanation: 'All rows from left table, matching rows from right (or NULL).'
                },
                {
                  title: 'Multiple Joins',
                  code: `SELECT users.name, orders.total, products.name
FROM users
JOIN orders ON users.id = orders.user_id
JOIN order_items ON orders.id = order_items.order_id
JOIN products ON order_items.product_id = products.id;`,
                  explanation: 'Chain multiple joins to combine data from many tables.'
                },
              ]}
            />

            <SyntaxSection
              title="Aggregations"
              icon="📊"
              language="sql"
              examples={[
                {
                  title: 'COUNT, SUM, AVG',
                  code: `SELECT 
  COUNT(*) as total_orders,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value
FROM orders;`,
                  explanation: 'Aggregate functions calculate values across rows.'
                },
                {
                  title: 'GROUP BY',
                  code: `SELECT 
  category,
  COUNT(*) as product_count,
  AVG(price) as avg_price
FROM products
GROUP BY category
ORDER BY product_count DESC;`,
                  explanation: 'Group rows by column and aggregate each group.'
                },
                {
                  title: 'HAVING (filter groups)',
                  code: `SELECT 
  customer_id,
  COUNT(*) as order_count,
  SUM(total) as lifetime_value
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 5;`,
                  explanation: 'HAVING filters groups (WHERE filters rows before grouping).'
                },
              ]}
            />

            <SyntaxSection
              title="Data Modification"
              icon="✏️"
              language="sql"
              examples={[
                {
                  title: 'INSERT Data',
                  code: `INSERT INTO users (name, email, age) 
VALUES ('Alice', 'alice@example.com', 25);

-- Multiple rows
INSERT INTO users (name, email, age) 
VALUES 
  ('Bob', 'bob@example.com', 30),
  ('Charlie', 'charlie@example.com', 28);`,
                  explanation: 'Add new rows to a table.'
                },
                {
                  title: 'UPDATE Data',
                  code: `UPDATE users 
SET age = 26, city = 'New York'
WHERE name = 'Alice';`,
                  explanation: 'Modify existing rows. Always use WHERE to avoid updating all rows!'
                },
                {
                  title: 'DELETE Data',
                  code: `DELETE FROM users 
WHERE age < 18;`,
                  explanation: 'Remove rows from table. Use WHERE carefully!'
                },
              ]}
            />

            <SyntaxSection
              title="Advanced Queries"
              icon="🚀"
              language="sql"
              examples={[
                {
                  title: 'Subqueries',
                  code: `SELECT name, salary 
FROM employees 
WHERE salary > (
  SELECT AVG(salary) 
  FROM employees
);`,
                  explanation: 'Query within a query. Inner query runs first.'
                },
                {
                  title: 'CASE Statements',
                  code: `SELECT 
  name,
  score,
  CASE 
    WHEN score >= 90 THEN 'A'
    WHEN score >= 80 THEN 'B'
    WHEN score >= 70 THEN 'C'
    ELSE 'F'
  END as grade
FROM students;`,
                  explanation: 'Conditional logic in SQL queries.'
                },
              ]}
            />

            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Example Queries</h2>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sales Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="sql"
                      code={`SELECT 
  products.category,
  COUNT(DISTINCT orders.id) as order_count,
  SUM(order_items.quantity * order_items.price) as revenue
FROM products
JOIN order_items ON products.id = order_items.product_id
JOIN orders ON order_items.order_id = orders.id
WHERE orders.date >= '2024-01-01'
GROUP BY products.category
ORDER BY revenue DESC;`}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeExample
                      language="sql"
                      code={`SELECT 
  users.name,
  COUNT(orders.id) as total_orders,
  SUM(orders.total) as lifetime_value,
  MAX(orders.date) as last_order_date
FROM users
LEFT JOIN orders ON users.id = orders.user_id
GROUP BY users.id, users.name
HAVING COUNT(orders.id) > 0
ORDER BY lifetime_value DESC
LIMIT 20;`}
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
            <Button onClick={() => navigate('/ide?lang=sql')}>
              Try SQL in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
