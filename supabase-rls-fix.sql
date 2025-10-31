-- Supabase RLS (Row Level Security) Fix for Analytics Tables
-- Run this in your Supabase SQL editor to allow public access to analytics tables

-- Disable RLS on analytics tables to allow public inserts/reads
ALTER TABLE page_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;  
ALTER TABLE funnel_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE utm_campaigns DISABLE ROW LEVEL SECURITY;

-- Or alternatively, enable RLS with permissive policies
-- (Uncomment these lines if you prefer to keep RLS enabled)

/*
-- Enable RLS
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE utm_campaigns ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for public access
CREATE POLICY "Allow public insert on page_visits" ON page_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on page_visits" ON page_visits FOR SELECT USING (true);

CREATE POLICY "Allow public insert on user_sessions" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on user_sessions" ON user_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public update on user_sessions" ON user_sessions FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on funnel_analytics" ON funnel_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on funnel_analytics" ON funnel_analytics FOR SELECT USING (true);

CREATE POLICY "Allow public insert on daily_stats" ON daily_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on daily_stats" ON daily_stats FOR SELECT USING (true);
CREATE POLICY "Allow public update on daily_stats" ON daily_stats FOR UPDATE USING (true);

CREATE POLICY "Allow public insert on utm_campaigns" ON utm_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on utm_campaigns" ON utm_campaigns FOR SELECT USING (true);
CREATE POLICY "Allow public update on utm_campaigns" ON utm_campaigns FOR UPDATE USING (true);
*/

-- Success message
SELECT 'Analytics table permissions fixed! 🎉' AS status;