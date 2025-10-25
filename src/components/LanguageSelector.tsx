import { Code2, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SupportedLanguage } from "@/runtimes/RuntimeRegistry";

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  initializedRuntimes: Set<string>;
  loadingRuntimes?: Set<string>;
  isMobile?: boolean;
}

const EXECUTABLE_LANGUAGES = [
  { 
    value: 'python' as const, 
    label: 'Python', 
    icon: '🐍',
    color: 'hsl(var(--chart-1))',
    availableOn: 'all',
    executable: true
  },
  { 
    value: 'r' as const, 
    label: 'R', 
    icon: '📊',
    color: 'hsl(var(--chart-2))',
    availableOn: 'all',
    executable: true
  },
  { 
    value: 'javascript' as const, 
    label: 'JavaScript', 
    icon: '⚡',
    color: 'hsl(var(--chart-3))',
    availableOn: 'all',
    executable: true
  },
  { 
    value: 'sql' as const, 
    label: 'SQL', 
    icon: '🗄️',
    color: 'hsl(var(--chart-4))',
    availableOn: 'all',
    executable: true
  },
  { 
    value: 'php' as const, 
    label: 'PHP', 
    icon: '🐘',
    color: 'hsl(var(--chart-5))',
    availableOn: 'all',
    executable: true
  },
  { 
    value: 'ruby' as const, 
    label: 'Ruby', 
    icon: '💎',
    color: 'hsl(var(--destructive))',
    availableOn: 'all',
    executable: true
  },
  { 
    value: 'lua' as const, 
    label: 'Lua', 
    icon: '🌙',
    color: 'hsl(220, 91%, 60%)',
    availableOn: 'all',
    executable: true
  },
];

const EDITOR_ONLY_LANGUAGES = [
  { 
    value: 'java' as const, 
    label: 'Java', 
    icon: '☕',
    color: 'hsl(25, 95%, 53%)',
    availableOn: 'all',
    executable: false
  },
  { 
    value: 'cpp' as const, 
    label: 'C++', 
    icon: '⚙️',
    color: 'hsl(209, 100%, 50%)',
    availableOn: 'all',
    executable: false
  },
  { 
    value: 'c' as const, 
    label: 'C', 
    icon: '🔧',
    color: 'hsl(209, 70%, 45%)',
    availableOn: 'all',
    executable: false
  },
  { 
    value: 'rust' as const, 
    label: 'Rust', 
    icon: '🦀',
    color: 'hsl(16, 75%, 45%)',
    availableOn: 'all',
    executable: false
  },
  { 
    value: 'go' as const, 
    label: 'Go', 
    icon: '🐹',
    color: 'hsl(185, 100%, 40%)',
    availableOn: 'all',
    executable: false
  },
  { 
    value: 'swift' as const, 
    label: 'Swift', 
    icon: '🦅',
    color: 'hsl(12, 100%, 50%)',
    availableOn: 'all',
    executable: false
  },
  { 
    value: 'kotlin' as const, 
    label: 'Kotlin', 
    icon: '🅺',
    color: 'hsl(268, 100%, 45%)',
    availableOn: 'all',
    executable: false
  },
  { 
    value: 'typescript' as const, 
    label: 'TypeScript', 
    icon: '📘',
    color: 'hsl(211, 60%, 48%)',
    availableOn: 'all',
    executable: false
  },
  { 
    value: 'csharp' as const, 
    label: 'C#', 
    icon: '♯',
    color: 'hsl(280, 65%, 60%)',
    availableOn: 'all',
    executable: false
  },
];

const ALL_LANGUAGES = [...EXECUTABLE_LANGUAGES, ...EDITOR_ONLY_LANGUAGES];

export const LanguageSelector = ({ 
  currentLanguage, 
  onLanguageChange, 
  initializedRuntimes,
  loadingRuntimes = new Set(),
  isMobile = false 
}: LanguageSelectorProps) => {
  const currentLang = ALL_LANGUAGES.find(l => l.value === currentLanguage);
  const isCurrentLoading = loadingRuntimes.has(currentLanguage);
  
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
            {isCurrentLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            ) : initializedRuntimes.has(currentLanguage) ? (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">✓</Badge>
            ) : null}
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px] max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel>Executable Languages</DropdownMenuLabel>
        <DropdownMenuGroup>
          {EXECUTABLE_LANGUAGES.map((lang) => {
            const isActive = lang.value === currentLanguage;
            const isInitialized = initializedRuntimes.has(lang.value);
            const isLoading = loadingRuntimes.has(lang.value);
            
            return (
              <DropdownMenuItem
                key={lang.value}
                onClick={() => onLanguageChange(lang.value)}
                disabled={isLoading}
                className={`
                  flex items-center justify-between gap-2 cursor-pointer
                  ${isActive ? 'bg-accent' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.icon}</span>
                  <span className="font-medium">{lang.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  ) : isInitialized ? (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">Ready</Badge>
                  ) : null}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Editor Only (No Browser Execution)
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {EDITOR_ONLY_LANGUAGES.map((lang) => {
            const isActive = lang.value === currentLanguage;
            
            return (
              <DropdownMenuItem
                key={lang.value}
                onClick={() => onLanguageChange(lang.value)}
                className={`
                  flex items-center justify-between gap-2 cursor-pointer
                  ${isActive ? 'bg-accent' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.icon}</span>
                  <span className="font-medium">{lang.label}</span>
                </div>
                <Badge variant="outline" className="h-4 px-1 text-[10px]">Editor</Badge>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {currentLang?.executable 
            ? '✓ Full execution • Code auto-saves' 
            : '📝 Syntax highlighting only • Export to compile'}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
