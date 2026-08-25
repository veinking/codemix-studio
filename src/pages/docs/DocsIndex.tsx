import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LanguageCapabilityCard } from '@/components/LanguageCapabilityCard';
import { languageCapabilities } from '@/data/languageCapabilities';
import { Helmet } from 'react-helmet';

const V1_RUNTIME_LANGUAGES = new Set(['python', 'r', 'javascript', 'sql']);

export default function DocsIndex() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const executableLanguages = languageCapabilities.filter(language => V1_RUNTIME_LANGUAGES.has(language.language));

  const filteredLanguages = !searchQuery
    ? executableLanguages
    : executableLanguages.filter(language =>
        language.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        || language.description.toLowerCase().includes(searchQuery.toLowerCase())
        || language.useCases.some(useCase => useCase.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  return (
    <>
      <Helmet>
        <title>Documentation Hub - bIDE | Python, R, JavaScript & SQL</title>
        <meta name="description" content="bIDE reference guides for the four V1 browser runtimes: Python, R, JavaScript, and SQL. Review syntax and examples, then open supported code in the browser workspace." />
        <meta name="keywords" content="python docs, r docs, javascript docs, sql docs, browser ide documentation, programming reference" />
        <link rel="canonical" href="https://bideide.com/docs" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Language References</h1>
                  <p className="text-sm text-muted-foreground">Reference guides for bIDE's current executable browser runtimes</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/ide')}>
                Back to IDE
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search Python, R, JavaScript, or SQL..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground text-center">
              bIDE V1 executes Python, R, JavaScript, and SQL. Older reference URLs for other languages now return here rather than implying a runtime that is not shipped.
            </p>
          </div>

          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Executable Languages</h2>
              <p className="text-sm text-muted-foreground">Run these four languages directly from the current bIDE workspace.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredLanguages.map(capability => (
                <LanguageCapabilityCard key={capability.language} capability={capability} />
              ))}
            </div>

            {filteredLanguages.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No current bIDE runtime matches your search.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
