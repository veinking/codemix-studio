import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { BreadcrumbSchema } from '@/components/BreadcrumbSchema';
import { SoftwareApplicationSchema } from '@/components/SoftwareApplicationSchema';

export default function KotlinDocs() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Kotlin Reference - bIDE Documentation</title>
      </Helmet>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://bideide.com/' },
        { name: 'Documentation', url: 'https://bideide.com/docs' },
        { name: 'Kotlin', url: 'https://bideide.com/docs/kotlin' }
      ]} />
      <SoftwareApplicationSchema 
        language="kotlin"
        languageName="Kotlin"
        description="Free online Kotlin code editor. Learn Kotlin for Android development and JVM applications. Modern, concise, and fully interoperable with Java."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-slate-50 to-purple-50 dark:from-background dark:via-slate-900 dark:to-purple-950">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🟣</span>
                <div>
                  <h1 className="text-2xl font-bold">Kotlin Reference</h1>
                  <p className="text-xs text-muted-foreground">Modern JVM language</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/docs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Docs
                </Button>
                <Button size="sm" onClick={() => navigate('/ide?lang=kotlin')}>
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
                    Kotlin is a modern JVM language and the preferred language for Android development. 
                    It's fully interoperable with Java while being more concise and expressive.
                  </p>
                  <div>
                    <h3 className="font-semibold mb-2">In bIDE:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Write and edit Kotlin code</span>
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
                      <Badge>Android</Badge>
                      <Badge>Backend</Badge>
                      <Badge>Mobile</Badge>
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
            <Button onClick={() => navigate('/ide?lang=kotlin')}>
              Open in IDE
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
