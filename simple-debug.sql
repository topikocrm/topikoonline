-- Simple Debug SQL - Run this to check what's wrong

-- 1. Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('page_visits', 'user_sessions', 'funnel_analytics', 'daily_stats', 'utm_campaigns');

-- 2. Check user_sessions table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS status (fixed query)
SELECT t.schemaname, t.tablename, t.rowsecurity
FROM pg_tables t
WHERE t.schemaname = 'public' 
AND t.tablename IN ('page_visits', 'user_sessions', 'funnel_analytics', 'daily_stats', 'utm_campaigns');

-- 4. Try a simple insert test
INSERT INTO user_sessions (session_id, device_type, browser, traffic_source, landing_page) 
VALUES ('test_session_123', 'desktop', 'chrome', 'direct', 'https://test.com');

-- 5. Check if insert worked
SELECT session_id, device_type, browser, city, country FROM user_sessions WHERE session_id = 'test_session_123';