import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code2, Sparkles, BarChart3, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  activity_type: string;
  activity_description: string;
  language: string | null;
  created_at: string;
}

export const RecentActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('recent_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      if (data) {
        setActivities(data);
      }
    };

    fetchActivities();

    // Set up realtime subscription
    const channel = supabase
      .channel('recent_activity_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recent_activity'
        },
        (payload) => {
          const newActivity = payload.new as Activity;
          setActivities((prev) => [newActivity, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'code_run':
        return <Code2 className="w-4 h-4 text-primary" />;
      case 'template_loaded':
        return <Sparkles className="w-4 h-4 text-accent" />;
      case 'plot_created':
        return <BarChart3 className="w-4 h-4 text-secondary" />;
      case 'notebook_executed':
        return <BookOpen className="w-4 h-4 text-primary" />;
      default:
        return <Code2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6 text-center">🔥 Live Activity</h2>
      <Card className="max-w-2xl mx-auto">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-md bg-background">
                  {getIcon(activity.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    Someone just <span className="font-medium">{activity.activity_description}</span>
                    {activity.language && (
                      <span className="ml-1 text-muted-foreground">
                        with {activity.language}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
