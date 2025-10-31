-- Supabase Analytics Data Inspection Script
-- Run this to see what data exists before cleanup

-- 1. Check all table record counts
SELECT 
    'funnel_analytics' as table_name, 
    COUNT(*) as total_records
FROM funnel_analytics
UNION ALL
SELECT 
    'page_visits' as table_name, 
    COUNT(*) as total_records
FROM page_visits
UNION ALL
SELECT 
    'user_sessions' as table_name, 
    COUNT(*) as total_records
FROM user_sessions;

-- 2. Check recent funnel analytics data (last 24 hours)
SELECT 
    screen_name,
    action_type,
    COUNT(*) as count,
    MAX(created_at) as latest_timestamp
FROM funnel_analytics 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY screen_name, action_type
ORDER BY screen_name, action_type;

-- 3. Check landing page tracking specifically
SELECT 
    screen_name,
    action_type,
    COUNT(*) as count
FROM funnel_analytics 
WHERE screen_name = 'landing'
AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY screen_name, action_type;

-- 4. Check page visits by URL
SELECT 
    page_url,
    COUNT(*) as visit_count,
    MAX(timestamp) as latest_visit
FROM page_visits 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY page_url
ORDER BY visit_count DESC;

-- 5. Check user sessions
SELECT 
    COUNT(*) as total_sessions,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(first_visit) as earliest_session,
    MAX(first_visit) as latest_session
FROM user_sessions 
WHERE first_visit >= NOW() - INTERVAL '24 hours';

-- 6. Check for duplicate landing page entries
SELECT 
    session_id,
    COUNT(*) as landing_page_records
FROM funnel_analytics 
WHERE screen_name = 'landing'
AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY session_id
HAVING COUNT(*) > 1
ORDER BY landing_page_records DESC;