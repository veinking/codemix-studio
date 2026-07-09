import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LanguageCapabilityCard } from '@/components/LanguageCapabilityCard';
import { languageCapabilities } from '@/data/languageCapabilities';
import { Helmet } from 'react-helmet';

export default function DocsIndex() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const executableLanguages = languageCapabilities.filter(l => l.category === 'executable');
  const editorOnlyLanguages = languageCapabilities.filter(l => l.category === 'editor-only');

  const filterLanguages = (langs: typeof languageCapabilities) => {
    if (!searchQuery) return langs;
    return langs.filter(lang =>
      lang.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.useCases.some(uc => uc.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  return (
    <>
      <Helmet>
        <title>Documentation Hub - bIDE | Reference for 16 Programming Languages</title>
        <meta name="description" content="Complete documentation for all 16 languages in bIDE. Syntax guides, code examples, and 'Open in IDE' feature. Languages: Python, R, JavaScript, SQL, PHP, Ruby, Lua, Java, TypeScript, C++, C, Rust, Go, Swift, Kotlin, C#." />
        <meta name="keywords" content="programming documentation, language reference, syntax guide, code examples, python docs, r docs, javascript docs, sql docs, multi-language reference" />
        <link rel="canonical" href="https://bideide.com/docs" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Language References</h1>
                  <p className="text-sm text-muted-foreground">Complete syntax guides and use cases for all supported languages</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/ide')}>
                Back to IDE
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search languages by name or use case..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>

          {/* Executable Languages */}
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Executable Languages</h2>
              <p className="text-sm text-muted-foreground">Run code directly in your browser with full runtime support</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterLanguages(executableLanguages).map(capability => (
                <LanguageCapabilityCard key={capability.language} capability={capability} />
              ))}
            </div>
            
            {filterLanguages(executableLanguages).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No executable languages match your search.</p>
            )}
          </div>

          {/* Editor-Only Languages */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Editor-Only Languages</h2>
              <p className="text-sm text-muted-foreground">Syntax highlighting and code editing without browser execution</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterLanguages(editorOnlyLanguages).map(capability => (
                <LanguageCapabilityCard key={capability.language} capability={capability} />
              ))}
            </div>
            
            {filterLanguages(editorOnlyLanguages).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No editor-only languages match your search.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
