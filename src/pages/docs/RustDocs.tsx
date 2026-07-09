import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema';
import { SoftwareApplicationSchema } from '@/components/SoftwareApplicationSchema';

export default function RustDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Rust Reference - bIDE Documentation</title>
      </Helmet>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://bideide.com/' },
        { name: 'Documentation', url: 'https://bideide.com/docs' },
        { name: 'Rust', url: 'https://bideide.com/docs/rust' }
      ]} />
      <SoftwareApplicationSchema 
        language="rust"
        languageName="Rust"
        description="Free online Rust code editor. Learn Rust for systems programming with memory safety. Perfect for WebAssembly and blockchain development."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-slate-50 to-orange-50 dark:from-background dark:via-slate-900 dark:to-orange-950">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🦀</span>
                <div>
                  <h1 className="text-2xl font-bold">Rust Reference</h1>
                  <p className="text-xs text-muted-foreground">Memory-safe systems language</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=rust')}>
                  Open in IDE
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Rust is a modern systems programming language focused on safety, speed, and concurrency. 
                    It prevents memory errors at compile time without garbage collection.
                  </p>
                  <div>
                    <h3 className="font-semibold mb-2">In bIDE:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Write and edit Rust code</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span>No execution (editor-only)</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Industry Use:</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Systems</Badge>
                      <Badge>WebAssembly</Badge>
                      <Badge>Blockchain</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between">
            <Button variant="outline" onClick={() => navigate('/docs')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              All References
            </Button>
            <Button onClick={() => navigate('/ide?lang=rust')}>
              Open in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
