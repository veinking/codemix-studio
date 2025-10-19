import { useNavigate } from 'react-router-dom';
import { Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpgradeDialog = ({ open, onOpenChange }: UpgradeDialogProps) => {
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Usage Limit Reached
          </AlertDialogTitle>
          <AlertDialogDescription>
            You've used all your AI features for today. Upgrade to continue!
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <Card className="p-6 border-2 border-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-xl">OpenIDE Pro</h3>
            <Badge variant="secondary">👑 PRO</Badge>
          </div>
          <ul className="space-y-2 text-sm mb-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong>Unlimited AI usage</strong> - No daily limits</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Priority AI processing</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Extended code sharing (365 days)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Priority support</span>
            </li>
          </ul>
          <div className="text-center border-t pt-4">
            <div>
              <span className="text-3xl font-bold">$7.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>No refunds. Cancel anytime.</strong>
            </p>
          </div>
        </Card>
        
        <AlertDialogFooter className="sm:flex-col sm:space-x-0 gap-2">
          {isGuest && (
            <Button 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                navigate('/auth?mode=signup');
              }} 
              className="w-full"
            >
              Create Free Account
              <Badge className="ml-2">6 uses/day</Badge>
            </Button>
          )}
          <Button 
            onClick={() => {
              onOpenChange(false);
              navigate('/upgrade');
            }} 
            className="w-full"
          >
            Upgrade to Pro
          </Button>
          <AlertDialogCancel className="w-full">Maybe Later</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
