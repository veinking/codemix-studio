-- Enable realtime for activity_stats table to show live updates on homepage
ALTER PUBLICATION supabase_realtime ADD TABLE activity_stats;