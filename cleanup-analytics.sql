-- Supabase Analytics Data Cleanup Script
-- Run this in your Supabase SQL Editor to clear all analytics data for fresh testing

-- WARNING: This will delete ALL analytics data. Make sure you want to start fresh!

-- 1. Clear funnel analytics (screen views, actions, conversions)
DELETE FROM funnel_analytics;

-- 2. Clear page visits (total visits tracking)
DELETE FROM page_visits;

-- 3. Clear user sessions 
DELETE FROM user_sessions;

-- 4. Clear daily stats (if exists)
DELETE FROM daily_stats;

-- 5. Clear UTM campaigns (if exists)
DELETE FROM utm_campaigns;

-- Reset any auto-increment sequences (if they exist)
-- Note: Supabase uses UUID by default, so this might not be needed
-- But including for completeness in case any tables use serial IDs

-- Check what tables actually exist first
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('funnel_analytics', 'page_visits', 'user_sessions', 'daily_stats', 'utm_campaigns');

-- Get count of records after cleanup (should all be 0)
SELECT 
    'funnel_analytics' as table_name, COUNT(*) as record_count 
FROM funnel_analytics
UNION ALL
SELECT 
    'page_visits' as table_name, COUNT(*) as record_count 
FROM page_visits
UNION ALL
SELECT 
    'user_sessions' as table_name, COUNT(*) as record_count 
FROM user_sessions;

-- Success message
SELECT 'Analytics data cleanup completed successfully!' as status;