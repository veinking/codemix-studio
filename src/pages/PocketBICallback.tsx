import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { completePocketBIOAuth } from '@/integrations/pocketbi/oauth';

const PocketBICallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void completePocketBIOAuth()
      .then((returnTo) => {
        if (active) navigate(returnTo, { replace: true });
      })
      .catch((reason) => {
        history.replaceState(null, '', '/auth/pocketbi/callback');
        if (active) setError(reason instanceof Error ? reason.message : 'PocketBI ID could not complete the secure connection.');
      });
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Connect PocketBI ID</CardTitle>
          <CardDescription>bIDE is completing the one-time PKCE authorization and creating this browser's local session.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive leading-6">{error}</p>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => navigate('/ide', { replace: true })}>Return to bIDE</Button>
                <Button variant="outline" asChild><a href="https://pocketbi.app/account">PocketBI Account Home</a></Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Finishing secure connection…</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PocketBICallback;
