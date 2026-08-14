import { ChevronDown, Loader2 } from "lucide-react";
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
  /** Languages fully wired through the current IDE state/execution flow. */
  enabledLanguages?: SupportedLanguage[];
}

type LanguageOption = {
  value: SupportedLanguage;
  label: string;
  icon: string;
  mode: "browser" | "experimental" | "editor";
};

const LANGUAGES: LanguageOption[] = [
  { value: "python", label: "Python", icon: "🐍", mode: "browser" },
  { value: "r", label: "R", icon: "📊", mode: "browser" },
  { value: "javascript", label: "JavaScript", icon: "⚡", mode: "browser" },
  { value: "sql", label: "SQL", icon: "🗄️", mode: "browser" },
  { value: "php", label: "PHP", icon: "🐘", mode: "experimental" },
  { value: "ruby", label: "Ruby", icon: "💎", mode: "experimental" },
  { value: "lua", label: "Lua", icon: "🌙", mode: "experimental" },
  { value: "typescript", label: "TypeScript", icon: "📘", mode: "editor" },
  { value: "java", label: "Java", icon: "☕", mode: "editor" },
  { value: "cpp", label: "C++", icon: "⚙️", mode: "editor" },
  { value: "c", label: "C", icon: "🔧", mode: "editor" },
  { value: "csharp", label: "C#", icon: "♯", mode: "editor" },
  { value: "rust", label: "Rust", icon: "🦀", mode: "editor" },
  { value: "go", label: "Go", icon: "🐹", mode: "editor" },
  { value: "swift", label: "Swift", icon: "🦅", mode: "editor" },
  { value: "kotlin", label: "Kotlin", icon: "🅺", mode: "editor" },
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
  const current = LANGUAGES.find((language) => language.value === currentLanguage) || LANGUAGES[0];
  const enabled = new Set(enabledLanguages);
  const ready = LANGUAGES.filter((language) => enabled.has(language.value));
  const coming = LANGUAGES.filter((language) => !enabled.has(language.value));
  const isCurrentLoading = loadingRuntimes.has(currentLanguage);

  const renderOption = (language: LanguageOption, active: boolean) => {
    const isEnabled = enabled.has(language.value);
    const isInitialized = initializedRuntimes.has(language.value);
    const isLoading = loadingRuntimes.has(language.value);

    return (
      <DropdownMenuItem
        key={language.value}
        onClick={() => isEnabled && onLanguageChange(language.value)}
        disabled={!isEnabled || isLoading}
        className={`flex items-center justify-between gap-2 ${active ? "bg-accent" : ""} ${isEnabled ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{language.icon}</span>
          <span className="font-medium truncate">{language.label}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
          ) : isInitialized && isEnabled ? (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Ready</Badge>
          ) : !isEnabled ? (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {language.mode === "editor" ? "Editor next" : "Runtime next"}
            </Badge>
          ) : (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Available</Badge>
          )}
        </div>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="gap-2 min-w-[132px] justify-between touch-manipulation"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">{current.icon}</span>
            <span className="font-medium truncate">{current.label}</span>
            {isCurrentLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />
            ) : initializedRuntimes.has(currentLanguage) ? (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">✓</Badge>
            ) : null}
          </div>
          <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[250px] max-h-[min(70vh,460px)] overflow-y-auto">
        <DropdownMenuLabel>Ready in bIDE</DropdownMenuLabel>
        <DropdownMenuGroup>
          {ready.map((language) => renderOption(language, language.value === currentLanguage))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Additional languages</DropdownMenuLabel>
        <DropdownMenuGroup>
          {coming.map((language) => renderOption(language, language.value === currentLanguage))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <div className="px-2 py-2 text-xs leading-5 text-muted-foreground">
          Languages are only enabled here after the editor, file model, runtime, and error handling are wired end-to-end. This prevents a selectable language from failing after you start typing.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
