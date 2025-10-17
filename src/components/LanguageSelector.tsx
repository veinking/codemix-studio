import { Code2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface LanguageSelectorProps {
  currentLanguage: 'python' | 'r' | 'javascript' | 'sql';
  onLanguageChange: (lang: 'python' | 'r' | 'javascript' | 'sql') => void;
  initializedRuntimes: Set<string>;
  isMobile?: boolean;
}

const LANGUAGES = [
  { 
    value: 'python' as const, 
    label: 'Python', 
    icon: '🐍',
    color: 'hsl(var(--chart-1))',
    availableOn: 'all'
  },
  { 
    value: 'r' as const, 
    label: 'R', 
    icon: '📊',
    color: 'hsl(var(--chart-2))',
    availableOn: 'all'
  },
  { 
    value: 'javascript' as const, 
    label: 'JavaScript', 
    icon: '⚡',
    color: 'hsl(var(--chart-3))',
    availableOn: 'all'
  },
  { 
    value: 'sql' as const, 
    label: 'SQL', 
    icon: '🗄️',
    color: 'hsl(var(--chart-4))',
    availableOn: 'all'
  },
];

export const LanguageSelector = ({ 
  currentLanguage, 
  onLanguageChange, 
  initializedRuntimes,
  isMobile = false 
}: LanguageSelectorProps) => {
  const currentLang = LANGUAGES.find(l => l.value === currentLanguage);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          className="gap-2 min-w-[140px] justify-between touch-manipulation"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLang?.icon}</span>
            <span className="font-medium">{currentLang?.label}</span>
            {initializedRuntimes.has(currentLanguage) && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">✓</Badge>
            )}
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {LANGUAGES.map((lang) => {
          const isActive = lang.value === currentLanguage;
          const isInitialized = initializedRuntimes.has(lang.value);
          const unavailableOnMobile = isMobile && lang.availableOn === 'desktop';
          
          return (
            <DropdownMenuItem
              key={lang.value}
              onClick={() => !unavailableOnMobile && onLanguageChange(lang.value)}
              disabled={unavailableOnMobile}
              className={`
                flex items-center justify-between gap-2 cursor-pointer
                ${isActive ? 'bg-accent' : ''}
                ${unavailableOnMobile ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{lang.icon}</span>
                <span className="font-medium">{lang.label}</span>
              </div>
              <div className="flex items-center gap-1">
                {isInitialized && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">Ready</Badge>
                )}
                {unavailableOnMobile && (
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">Desktop</Badge>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Click to switch • Code auto-saves
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
