import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const GuestPrompt = () => {
  const { isGuest, aiUsage } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('guest-prompt-dismissed') === 'true';
  });
  const navigate = useNavigate();

  if (!isGuest || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('guest-prompt-dismissed', 'true');
    setDismissed(true);
  };

  const handleSignup = () => {
    navigate('/auth?mode=signup');
  };

  return (
    <Card 
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm p-4",
        "bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm",
        "border-primary/20 shadow-lg animate-in slide-in-from-bottom-4"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Get More AI Power</h3>
          <p className="text-xs text-muted-foreground">
            Create a free account for {aiUsage?.tier === 'guest' ? '2x more' : 'unlimited'} AI uses
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          className="flex-1" 
          onClick={handleSignup}
        >
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Sign Up Free
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleDismiss}
          className="text-xs"
        >
          Maybe Later
        </Button>
      </div>
    </Card>
  );
};
