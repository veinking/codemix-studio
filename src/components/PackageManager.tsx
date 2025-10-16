import { useState } from "react";
import { Package, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface PackageManagerProps {
  installedPackages: string[];
  onInstallPackage: (packageName: string) => Promise<void>;
  isInstalling: boolean;
  currentLanguage?: 'python' | 'r' | 'javascript' | 'sql';
}

const PYTHON_PACKAGES = [
  "numpy",
  "pandas", 
  "matplotlib",
  "scipy",
  "scikit-learn",
  "plotly",
  "seaborn",
];

const R_PACKAGES = [
  "ggplot2",
  "dplyr",
  "tidyr",
  "readr",
  "caret",
  "randomForest",
  "data.table",
];

export const PackageManager = ({
  installedPackages,
  onInstallPackage,
  isInstalling,
  currentLanguage = 'python',
}: PackageManagerProps) => {
  const [packageName, setPackageName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleInstall = async () => {
    if (!packageName.trim()) return;
    await onInstallPackage(packageName.trim());
    setPackageName("");
  };

  return (
    <div className="border-t border-border">
      <button
        className="w-full p-2 flex items-center justify-between hover:bg-secondary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Packages</span>
        </div>
        <Badge variant="secondary">{installedPackages.length}</Badge>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-border bg-card/50">
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Package name..."
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInstall()}
              className="flex-1"
              disabled={isInstalling}
            />
            <Button
              size="sm"
              onClick={handleInstall}
              disabled={isInstalling || !packageName.trim()}
            >
              {isInstalling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>

          {(currentLanguage === 'python' || currentLanguage === 'r') && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Common {currentLanguage === 'python' ? 'Python' : 'R'} packages:
              </p>
              <div className="flex flex-wrap gap-1">
                {(currentLanguage === 'python' ? PYTHON_PACKAGES : R_PACKAGES).map((pkg) => {
                  const isInstalled = installedPackages.includes(pkg);
                  return (
                    <Badge
                      key={pkg}
                      variant={isInstalled ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => !isInstalled && onInstallPackage(pkg)}
                    >
                      {pkg}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {(currentLanguage === 'javascript' || currentLanguage === 'sql') && (
            <p className="text-xs text-muted-foreground italic">
              {currentLanguage === 'javascript' 
                ? 'JavaScript runs built-in libraries' 
                : 'SQL uses built-in database engine'}
            </p>
          )}

          {installedPackages.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Installed:</p>
              <ScrollArea className="h-20">
                <div className="flex flex-wrap gap-1">
                  {installedPackages.map((pkg) => (
                    <Badge key={pkg} variant="secondary" className="text-xs">
                      {pkg}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
