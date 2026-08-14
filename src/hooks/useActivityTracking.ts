import { supabase } from '@/integrations/supabase/client';

interface ActivityMetrics {
  codeLines?: number;
  activityType: 'code_run' | 'template_loaded' | 'plot_created' | 'notebook_executed';
  activityDescription: string;
  language?: string;
}

export const useActivityTracking = () => {
  const trackActivity = (metrics: ActivityMetrics): void => {
    // Product telemetry must never keep the editor in a running/busy state.
    // Fire both independent RPCs concurrently and surface failures only to the
    // developer console; execution output is the user-facing source of truth.
    void Promise.all([
      supabase.rpc('increment_stats', {
        code_runs: metrics.activityType === 'code_run' ? 1 : 0,
        lines: metrics.codeLines || 0,
      }),
      supabase.rpc('add_recent_activity', {
        activity_type: metrics.activityType,
        activity_description: metrics.activityDescription,
        language: metrics.language || null,
      }),
    ])
      .then(([statsResult, activityResult]) => {
        if (statsResult.error) {
          console.warn('[Activity Tracking] Stats update failed:', statsResult.error.message);
        }
        if (activityResult.error) {
          console.warn('[Activity Tracking] Recent activity update failed:', activityResult.error.message);
        }
      })
      .catch((error) => {
        console.warn('[Activity Tracking] Telemetry request failed:', error);
      });
  };

  return { trackActivity };
};
