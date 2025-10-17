import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, Code2 } from 'lucide-react';

interface Stats {
  total_code_runs: number;
  total_lines_executed: number;
  active_users_today: number;
}

export const ActivityStats = () => {
  const [stats, setStats] = useState<Stats>({
    total_code_runs: 0,
    total_lines_executed: 0,
    active_users_today: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_stats')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching stats:', error);
          return;
        }

        if (data) {
          setStats({
            total_code_runs: data.total_code_runs || 0,
            total_lines_executed: data.total_lines_executed || 0,
            active_users_today: data.active_users_today || 0
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Set up realtime subscription for live updates
    const channel = supabase
      .channel('activity_stats_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'activity_stats'
        },
        (payload) => {
          const newData = payload.new as Stats;
          setStats({
            total_code_runs: newData.total_code_runs || 0,
            total_lines_executed: newData.total_lines_executed || 0,
            active_users_today: newData.active_users_today || 0
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="w-full py-8 bg-gradient-to-r from-primary/5 to-accent/5 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors">
            <div className="p-3 rounded-lg bg-primary/10">
              <Code2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(stats.total_code_runs)}
              </p>
              <p className="text-sm text-muted-foreground">Code runs today</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors">
            <div className="p-3 rounded-lg bg-accent/10">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(stats.active_users_today)}
              </p>
              <p className="text-sm text-muted-foreground">Active students</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors">
            <div className="p-3 rounded-lg bg-secondary/10">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatNumber(stats.total_lines_executed)}
              </p>
              <p className="text-sm text-muted-foreground">Lines of code run</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
