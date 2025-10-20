import { Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const AIUsageIndicator = () => {
  const { aiUsage, isGuest } = useAuth();
  
  if (!aiUsage) return null;
  
  const isLimited = aiUsage.tier !== 'pro';
  const isLow = isLimited && aiUsage.remaining <= 1;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            aiUsage.tier === 'pro' 
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              : isLow
              ? "bg-destructive/20 text-destructive border border-destructive animate-pulse"
              : "bg-secondary text-secondary-foreground"
          )}>
            <Sparkles className="h-4 w-4" />
            {aiUsage.tier === 'pro' ? (
              <span>∞ Unlimited</span>
            ) : (
              <span>{aiUsage.remaining}/{aiUsage.limit} AI</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{aiUsage.message}</p>
          {isLimited && (
            <p className="text-xs text-muted-foreground mt-1">
              Resets every 5 days
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
