import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Cloud features restored.', {
        style: {
          marginBottom: 'env(safe-area-inset-bottom)'
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Cloud features disabled.', {
        style: {
          marginBottom: 'env(safe-area-inset-bottom)'
        }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
