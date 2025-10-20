import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageCapability } from '@/data/languageCapabilities';

interface LanguageCapabilityCardProps {
  capability: LanguageCapability;
}

export const LanguageCapabilityCard = ({ capability }: LanguageCapabilityCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{capability.icon}</span>
            <div>
              <CardTitle className="text-xl">{capability.displayName}</CardTitle>
              <CardDescription className="text-xs mt-1">{capability.description}</CardDescription>
            </div>
          </div>
          <Badge variant={capability.category === 'executable' ? 'default' : 'secondary'}>
            {capability.category === 'executable' ? '▶ Runs' : '📝 Edit'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">What it's for:</h4>
          <div className="flex flex-wrap gap-1">
            {capability.useCases.slice(0, 3).map((useCase, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {useCase}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">In bIDE:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              {capability.bideSupport.codeExecution ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-muted-foreground" />
              )}
              <span>Code Execution</span>
            </div>
            <div className="flex items-center gap-2">
              {capability.bideSupport.plotting ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-muted-foreground" />
              )}
              <span>Plotting/Visualization</span>
            </div>
            <div className="flex items-center gap-2">
              {capability.bideSupport.packageInstallation ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-muted-foreground" />
              )}
              <span>Package Installation</span>
            </div>
          </div>
        </div>
        
        <div>
          <Badge variant="secondary" className="text-xs">
            {capability.difficulty === 'beginner' && '🟢 Beginner Friendly'}
            {capability.difficulty === 'intermediate' && '🟡 Intermediate'}
            {capability.difficulty === 'advanced' && '🔴 Advanced'}
          </Badge>
        </div>
        
        <Button 
          className="w-full mt-2" 
          variant="outline"
          onClick={() => navigate(`/docs/${capability.language}`)}
        >
          View Full Reference
        </Button>
      </CardContent>
    </Card>
  );
};
