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
      console.log('[Activity Tracking] Starting track:', metrics);
      
      // Increment global stats using the function
      const { data: statsData, error: statsError } = await supabase.rpc('increment_stats', {
        code_runs: metrics.activityType === 'code_run' ? 1 : 0,
        lines: metrics.codeLines || 0
      });

      if (statsError) {
        console.error('[Activity Tracking] Error updating stats:', statsError);
      } else {
        console.log('[Activity Tracking] Stats updated successfully');
      }

      // Add to recent activity feed using the function
      const { data: activityData, error: activityError } = await supabase.rpc('add_recent_activity', {
        activity_type: metrics.activityType,
        activity_description: metrics.activityDescription,
        language: metrics.language || null
      });

      if (activityError) {
        console.error('[Activity Tracking] Error adding activity:', activityError);
      } else {
        console.log('[Activity Tracking] Activity added successfully');
      }
    } catch (error) {
      console.error('[Activity Tracking] Unexpected error:', error);
    }
  };

  return { trackActivity };
};
