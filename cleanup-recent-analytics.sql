-- Supabase Analytics Cleanup - Recent Data Only
-- This script only cleans data from the last 24 hours for safer testing

-- 1. Clean recent funnel analytics (last 24 hours)
DELETE FROM funnel_analytics 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 2. Clean recent page visits (last 24 hours)
DELETE FROM page_visits 
WHERE timestamp >= NOW() - INTERVAL '24 hours';

-- 3. Clean recent user sessions (last 24 hours)
DELETE FROM user_sessions 
WHERE first_visit >= NOW() - INTERVAL '24 hours';

-- Alternative: Clean by specific session IDs (if you know them)
-- DELETE FROM funnel_analytics WHERE session_id LIKE 'sess_%';
-- DELETE FROM page_visits WHERE session_id LIKE 'sess_%';
-- DELETE FROM user_sessions WHERE session_id LIKE 'sess_%';

-- Check remaining data counts
SELECT 
    'funnel_analytics' as table_name, 
    COUNT(*) as total_records,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_records
FROM funnel_analytics
UNION ALL
SELECT 
    'page_visits' as table_name, 
    COUNT(*) as total_records,
    COUNT(CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_records
FROM page_visits
UNION ALL
SELECT 
    'user_sessions' as table_name, 
    COUNT(*) as total_records,
    COUNT(CASE WHEN first_visit >= NOW() - INTERVAL '24 hours' THEN 1 END) as recent_records
FROM user_sessions;

SELECT 'Recent analytics data cleanup completed!' as status;