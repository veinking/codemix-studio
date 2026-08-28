interface ActivityMetrics {
  codeLines?: number;
  activityType: 'code_run' | 'template_loaded' | 'plot_created' | 'notebook_executed';
  activityDescription: string;
  language?: string;
}

export const useActivityTracking = () => {
  const trackActivity = (_metrics: ActivityMetrics): void => {
    // The old global activity feed and counter UI are retired. Keep this
    // compatibility hook as a local no-op so existing execution paths do not
    // make network calls or reopen legacy Supabase telemetry permissions.
  };

  return { trackActivity };
};
