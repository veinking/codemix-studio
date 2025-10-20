import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

import { SupportedLanguage } from '@/runtimes/RuntimeRegistry';

type Lang = SupportedLanguage;

interface TranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCode: string;
  sourceLanguage: Lang;
  onTranslated: (code: string, language: Lang) => void;
}

export const TranslateDialog = ({
  open,
  onOpenChange,
  sourceCode,
  sourceLanguage,
  onTranslated,
}: TranslateDialogProps) => {
  const [targetLanguage, setTargetLanguage] = useState<Lang>('python');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (targetLanguage === sourceLanguage) {
      toast.error("Target language must be different from source");
      return;
    }

    if (!sourceCode.trim()) {
      toast.error("No code to translate");
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('code-translator', {
        body: {
          sourceLanguage,
          targetLanguage,
          code: sourceCode,
        },
      });

      if (error) throw error;

      const translated = data?.translatedCode?.trim();
      if (!translated) throw new Error('No translated code received');
      
      onTranslated(translated, targetLanguage);
      toast.success(`Code translated to ${targetLanguage.toUpperCase()}!`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Translation error:", error);
      toast.error(error?.message || "Failed to translate code");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Translate Code</DialogTitle>
          <DialogDescription>
            Convert your {sourceLanguage.toUpperCase()} code to another language
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">From</label>
              <div className="mt-1 p-2 bg-secondary rounded-md text-center">
                {sourceLanguage.toUpperCase()}
              </div>
            </div>

            <ArrowRight className="w-5 h-5 mt-6" />

            <div className="flex-1">
              <label className="text-sm font-medium">To</label>
              <Select value={targetLanguage} onValueChange={(v: Lang) => setTargetLanguage(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['python', 'r', 'javascript', 'sql', 'php', 'ruby', 'lua', 'typescript', 'java', 'cpp', 'c', 'rust', 'go', 'swift', 'kotlin', 'csharp'] as Lang[])
                    .filter(l => l !== sourceLanguage)
                    .map(l => (
                      <SelectItem key={l} value={l}>
                        {l.toUpperCase()}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                'Translate Code'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
