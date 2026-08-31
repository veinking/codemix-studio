import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  /** Languages fully wired through the current IDE state/execution flow. */
  enabledLanguages?: SupportedLanguage[];
}

type LanguageOption = {
  value: SupportedLanguage;
  label: string;
  icon: string;
};

const LANGUAGES: LanguageOption[] = [
  { value: "python", label: "Python", icon: "🐍" },
  { value: "r", label: "R", icon: "📊" },
  { value: "javascript", label: "JavaScript", icon: "⚡" },
  { value: "sql", label: "SQL", icon: "🗄️" },
];

const CURRENTLY_WIRED: SupportedLanguage[] = ["python", "r", "javascript", "sql"];

export const LanguageSelector = ({
  currentLanguage,
  onLanguageChange,
  initializedRuntimes,
  loadingRuntimes = new Set(),
  isMobile = false,
  enabledLanguages = CURRENTLY_WIRED,
}: LanguageSelectorProps) => {
  const enabled = new Set(enabledLanguages);
  const ready = LANGUAGES.filter((language) => enabled.has(language.value));
  const current = ready.find((language) => language.value === currentLanguage) || ready[0] || LANGUAGES[0];
  const isCurrentLoading = loadingRuntimes.has(currentLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="gap-2 min-w-[132px] justify-between touch-manipulation"
          aria-label={`Runtime: ${current.label}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0" aria-hidden="true">{current.icon}</span>
            <span className="font-medium truncate">{current.label}</span>
            {isCurrentLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" aria-hidden="true" />
            ) : initializedRuntimes.has(currentLanguage) ? (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">✓</Badge>
            ) : null}
          </div>
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>Executable runtimes</DropdownMenuLabel>
        <DropdownMenuGroup>
          {ready.map((language) => {
            const isInitialized = initializedRuntimes.has(language.value);
            const isLoading = loadingRuntimes.has(language.value);
            return (
              <DropdownMenuItem
                key={language.value}
                onClick={() => onLanguageChange(language.value)}
                disabled={isLoading}
                className={`flex items-center justify-between gap-2 ${language.value === currentLanguage ? "bg-accent" : ""} cursor-pointer`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0" aria-hidden="true">{language.icon}</span>
                  <span className="font-medium truncate">{language.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-primary" aria-hidden="true" />
                  ) : isInitialized ? (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Ready</Badge>
                  ) : (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Available</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <div className="px-2 py-2 text-xs leading-5 text-muted-foreground">
          bIDE currently executes Python, R, JavaScript, and SQL. Future runtimes are not shown until they are wired end-to-end.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};