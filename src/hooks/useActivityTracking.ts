import { supabase } from '@/integrations/supabase/client';

interface ActivityMetrics {
  codeLines?: number;
  activityType: 'code_run' | 'template_loaded' | 'plot_created' | 'notebook_executed';
  activityDescription: string;
  language?: string;
}

export const useActivityTracking = () => {
  const trackActivity = async (metrics: ActivityMetrics) => {
    try {
      // Increment global stats using the function
      const { error: statsError } = await (supabase.rpc as any)('increment_stats', {
        code_runs: metrics.activityType === 'code_run' ? 1 : 0,
        lines: metrics.codeLines || 0
      });

      if (statsError) {
        console.error('Error updating stats:', statsError);
      }

      // Add to recent activity feed using the function
      const { error: activityError } = await (supabase.rpc as any)('add_recent_activity', {
        activity_type: metrics.activityType,
        activity_description: metrics.activityDescription,
        language: metrics.language || null
      });

      if (activityError) {
        console.error('Error adding activity:', activityError);
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  return { trackActivity };
};
