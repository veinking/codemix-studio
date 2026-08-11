import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

interface ActivityMetrics {
  codeLines?: number;
  activityType: 'code_run' | 'template_loaded' | 'plot_created' | 'notebook_executed';
  activityDescription: string;
  language?: string;
}

export const useActivityTracking = () => {
  const trackActivity = async (metrics: ActivityMetrics) => {
    // Activity tracking is an optional cloud feature. Local mode should never
    // make placeholder Supabase requests just because a user runs code.
    if (!isSupabaseConfigured) return;

    try {
      const { error: statsError } = await supabase.rpc('increment_stats', {
        code_runs: metrics.activityType === 'code_run' ? 1 : 0,
        lines: metrics.codeLines || 0
      });

      if (statsError) {
        console.error('[Activity Tracking] Error updating stats:', statsError);
      }

      const { error: activityError } = await supabase.rpc('add_recent_activity', {
        activity_type: metrics.activityType,
        activity_description: metrics.activityDescription,
        language: metrics.language || null
      });

      if (activityError) {
        console.error('[Activity Tracking] Error adding activity:', activityError);
      }
    } catch (error) {
      console.error('[Activity Tracking] Unexpected error:', error);
    }
  };

  return { trackActivity };
};
