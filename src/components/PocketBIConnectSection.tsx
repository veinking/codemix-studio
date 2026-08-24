import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { beginPocketBIOAuth, isPocketBIOAuthConfigured } from '@/integrations/pocketbi/oauth';
import { Loader2, ShieldCheck } from 'lucide-react';

interface PocketBIConnectSectionProps {
  disabled?: boolean;
  returnTo?: string;
  onBusyChange?: (busy: boolean) => void;
}

export const PocketBIConnectSection = ({
  disabled = false,
  returnTo = '/ide',
  onBusyChange,
}: PocketBIConnectSectionProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const setBusy = (busy: boolean) => {
    setLoading(busy);
    onBusyChange?.(busy);
  };

  const handlePocketBIConnect = async () => {
    if (!isPocketBIOAuthConfigured()) {
      toast({
        title: 'PocketBI connection is not enabled yet',
        description: 'This deployment is missing its PocketBI OAuth configuration. You can still use the password fallback or continue as a guest.',
      });
      return;
    }

    setBusy(true);
    try {
      await beginPocketBIOAuth(returnTo);
    } catch (error: any) {
      setBusy(false);
      toast({
        title: 'PocketBI connection could not start',
        description: error?.message || 'Try again or use the email/password fallback.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3 mb-5">
      <Button type="button" className="w-full" onClick={handlePocketBIConnect} disabled={disabled || loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening PocketBI…
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Continue with PocketBI ID
          </>
        )}
      </Button>
      <p className="text-xs text-center leading-5 text-muted-foreground">
        Recommended. Sign in or create your PocketBI ID on PocketBI, approve bIDE once, then return here securely.
      </p>
      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or use password here</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
};
