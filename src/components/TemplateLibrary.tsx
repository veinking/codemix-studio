import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { codeTemplates, CodeTemplate } from '@/data/codeTemplates';
import { Search, Code2, Sparkles, TrendingUp } from 'lucide-react';

interface TemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: CodeTemplate) => void;
  currentLanguage: string;
}

export const TemplateLibrary = ({ open, onOpenChange, onSelectTemplate, currentLanguage }: TemplateLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredTemplates = codeTemplates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesLanguage = template.language === currentLanguage;
    
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleLoadTemplate = (template: CodeTemplate) => {
    onSelectTemplate(template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Code2 className="h-6 w-6 text-primary" />
            Code Templates
          </DialogTitle>
          <DialogDescription>
            Ready-to-run examples to jumpstart your coding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="data-science">Data Science</TabsTrigger>
              <TabsTrigger value="ml">ML</TabsTrigger>
              <TabsTrigger value="visualization">Viz</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
              <TabsTrigger value="interview-prep">Interview</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <ScrollArea className="h-[50vh]">
                <div className="grid gap-4 pr-4">
                  {filteredTemplates.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No templates found</p>
                      <p className="text-sm mt-2">Try adjusting your search or category</p>
                    </div>
                  ) : (
                    filteredTemplates.map((template) => (
                      <Card key={template.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{template.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {template.description}
                              </CardDescription>
                            </div>
                            <Button 
                              onClick={() => handleLoadTemplate(template)}
                              size="sm"
                            >
                              Load
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                              {template.difficulty}
                            </Badge>
                            {template.packages.length > 0 && (
                              <Badge variant="outline">
                                {template.packages.join(', ')}
                              </Badge>
                            )}
                            {template.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-3">
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            {template.expectedOutput}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
