-- Supabase Analytics Tables Setup
-- Run this script in your Supabase SQL editor: https://supabase.com/dashboard/project/uyaubwfmxelcshuyaf/sql

-- 1. Page Visits Table - Track every page view with UTM data
CREATE TABLE IF NOT EXISTS page_visits (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    screen_width INTEGER,
    screen_height INTEGER,
    language TEXT,
    timezone TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Sessions Table - Track session-level data
CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    first_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_page_views INTEGER DEFAULT 1,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    traffic_source TEXT,
    landing_page TEXT,
    exit_page TEXT,
    conversion_status TEXT DEFAULT 'in_progress', -- in_progress, mobile_entered, otp_verified, completed, dropped_off
    mobile_number TEXT,
    assessment_completed BOOLEAN DEFAULT FALSE,
    whatsapp_clicked BOOLEAN DEFAULT FALSE,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    device_type TEXT, -- mobile, tablet, desktop
    browser TEXT,
    country TEXT,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Funnel Analytics Table - Track user flow through screens
CREATE TABLE IF NOT EXISTS funnel_analytics (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    screen_name TEXT NOT NULL, -- landing, mobile_entry, otp_verification, basic_info, assessment, results
    action_type TEXT NOT NULL, -- page_view, button_click, form_submit, exit
    action_details JSONB, -- store additional data like button_id, form_data, etc.
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER, -- in seconds
    next_screen TEXT,
    dropped_off BOOLEAN DEFAULT FALSE,
    conversion_step INTEGER, -- 1=landing, 2=mobile, 3=otp, 4=info, 5=assessment, 6=results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Stats Table - Aggregated statistics for faster reporting
CREATE TABLE IF NOT EXISTS daily_stats (
    id BIGSERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_visits INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    new_sessions INTEGER DEFAULT 0,
    returning_sessions INTEGER DEFAULT 0,
    mobile_entries INTEGER DEFAULT 0,
    otp_verifications INTEGER DEFAULT 0,
    assessments_completed INTEGER DEFAULT 0,
    whatsapp_conversions INTEGER DEFAULT 0,
    avg_session_duration DECIMAL DEFAULT 0,
    bounce_rate DECIMAL DEFAULT 0,
    conversion_rate DECIMAL DEFAULT 0,
    top_traffic_source TEXT,
    top_utm_campaign TEXT,
    peak_hour INTEGER, -- 0-23 hour of day
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. UTM Campaigns Table - Track campaign performance
CREATE TABLE IF NOT EXISTS utm_campaigns (
    id BIGSERIAL PRIMARY KEY,
    campaign_name TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    total_clicks INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL DEFAULT 0,
    cost_per_click DECIMAL DEFAULT 0,
    total_cost DECIMAL DEFAULT 0,
    roi DECIMAL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_timestamp ON page_visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_visits_utm_source ON page_visits(utm_source);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_first_visit ON user_sessions(first_visit);
CREATE INDEX IF NOT EXISTS idx_user_sessions_conversion_status ON user_sessions(conversion_status);

CREATE INDEX IF NOT EXISTS idx_funnel_analytics_session_id ON funnel_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_screen_name ON funnel_analytics(screen_name);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_conversion_step ON funnel_analytics(conversion_step);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Create triggers to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at 
    BEFORE UPDATE ON daily_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_utm_campaigns_updated_at 
    BEFORE UPDATE ON utm_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial daily stats record for today
INSERT INTO daily_stats (date) 
VALUES (CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;

-- Success message
SELECT 'Analytics tables created successfully! 🎉' AS status;