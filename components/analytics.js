// Topiko Analytics Tracking Module
// Safe, non-breaking analytics implementation

class TopikoAnalytics {
    constructor(supabaseClient, sessionId) {
        this.supabase = supabaseClient;
        this.sessionId = sessionId;
        this.currentScreen = 'landing';
        this.screenStartTime = Date.now();
        this.isInitialized = false;
        
        // Initialize analytics safely
        this.init();
    }

    async init() {
        try {
            if (!this.supabase) {
                console.log('📊 Analytics: Supabase not available, running in offline mode');
                return;
            }

            // Parse UTM parameters and page info
            this.pageInfo = this.getPageInfo();
            this.utmParams = this.getUTMParams();
            this.sessionInfo = this.getSessionInfo();

            // Track initial page visit
            await this.trackPageVisit();
            await this.initializeSession();
            await this.trackScreenView('landing');

            this.isInitialized = true;
            console.log('📊 Analytics initialized successfully');
        } catch (error) {
            console.log('📊 Analytics initialization failed (non-critical):', error);
        }
    }

    // Extract UTM parameters from URL
    getUTMParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            utm_source: urlParams.get('utm_source'),
            utm_medium: urlParams.get('utm_medium'),
            utm_campaign: urlParams.get('utm_campaign'),
            utm_content: urlParams.get('utm_content'),
            utm_term: urlParams.get('utm_term')
        };
    }

    // Get page and browser information
    getPageInfo() {
        return {
            page_url: window.location.href,
            page_title: document.title,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_width: screen.width,
            screen_height: screen.height,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // Get session information
    getSessionInfo() {
        const userAgent = navigator.userAgent;
        let deviceType = 'desktop';
        let browser = 'unknown';

        // Detect device type
        if (/Mobi|Android/i.test(userAgent)) deviceType = 'mobile';
        else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'tablet';

        // Detect browser
        if (userAgent.includes('Chrome')) browser = 'chrome';
        else if (userAgent.includes('Firefox')) browser = 'firefox';
        else if (userAgent.includes('Safari')) browser = 'safari';
        else if (userAgent.includes('Edge')) browser = 'edge';

        return {
            device_type: deviceType,
            browser: browser,
            traffic_source: this.getTrafficSource(),
            landing_page: window.location.href
        };
    }

    // Determine traffic source
    getTrafficSource() {
        const referrer = document.referrer;
        const utm_source = this.utmParams.utm_source;

        if (utm_source) return utm_source;
        if (!referrer) return 'direct';
        
        const domain = new URL(referrer).hostname;
        if (domain.includes('google')) return 'google';
        if (domain.includes('facebook')) return 'facebook';
        if (domain.includes('instagram')) return 'instagram';
        if (domain.includes('linkedin')) return 'linkedin';
        if (domain.includes('youtube')) return 'youtube';
        
        return 'referral';
    }

    // Track page visit
    async trackPageVisit() {
        try {
            if (!this.supabase) return;

            const visitData = {
                session_id: this.sessionId,
                ...this.pageInfo,
                ...this.utmParams
            };

            const { error } = await this.supabase
                .from('page_visits')
                .insert(visitData);

            if (error) throw error;
        } catch (error) {
            console.log('📊 Analytics: Page visit tracking failed (non-critical):', error);
        }
    }

    // Initialize or update session
    async initializeSession() {
        try {
            if (!this.supabase) return;

            // Check if session exists
            const { data: existingSession } = await this.supabase
                .from('user_sessions')
                .select('*')
                .eq('session_id', this.sessionId)
                .single();

            if (existingSession) {
                // Update existing session
                await this.supabase
                    .from('user_sessions')
                    .update({
                        last_activity: new Date().toISOString(),
                        total_page_views: existingSession.total_page_views + 1
                    })
                    .eq('session_id', this.sessionId);
            } else {
                // Create new session
                const sessionData = {
                    session_id: this.sessionId,
                    ...this.sessionInfo,
                    ...this.utmParams
                };

                await this.supabase
                    .from('user_sessions')
                    .insert(sessionData);
            }
        } catch (error) {
            console.log('📊 Analytics: Session tracking failed (non-critical):', error);
        }
    }

    // Track screen views and transitions
    async trackScreenView(screenName, actionDetails = {}) {
        try {
            if (!this.supabase || !this.isInitialized) return;

            const now = Date.now();
            const timeSpent = Math.round((now - this.screenStartTime) / 1000);

            // Track previous screen exit if not first screen
            if (this.currentScreen && this.currentScreen !== screenName) {
                await this.supabase
                    .from('funnel_analytics')
                    .insert({
                        session_id: this.sessionId,
                        screen_name: this.currentScreen,
                        action_type: 'screen_exit',
                        action_details: actionDetails,
                        time_spent: timeSpent,
                        next_screen: screenName,
                        conversion_step: this.getConversionStep(this.currentScreen)
                    });
            }

            // Track new screen entry
            await this.supabase
                .from('funnel_analytics')
                .insert({
                    session_id: this.sessionId,
                    screen_name: screenName,
                    action_type: 'screen_view',
                    action_details: actionDetails,
                    conversion_step: this.getConversionStep(screenName)
                });

            this.currentScreen = screenName;
            this.screenStartTime = now;
        } catch (error) {
            console.log('📊 Analytics: Screen tracking failed (non-critical):', error);
        }
    }

    // Track button clicks and user actions
    async trackAction(actionType, actionDetails = {}) {
        try {
            if (!this.supabase || !this.isInitialized) return;

            await this.supabase
                .from('funnel_analytics')
                .insert({
                    session_id: this.sessionId,
                    screen_name: this.currentScreen,
                    action_type: actionType,
                    action_details: actionDetails,
                    conversion_step: this.getConversionStep(this.currentScreen)
                });
        } catch (error) {
            console.log('📊 Analytics: Action tracking failed (non-critical):', error);
        }
    }

    // Update session conversion status
    async updateConversionStatus(status, additionalData = {}) {
        try {
            if (!this.supabase) return;

            await this.supabase
                .from('user_sessions')
                .update({
                    conversion_status: status,
                    last_activity: new Date().toISOString(),
                    ...additionalData
                })
                .eq('session_id', this.sessionId);
        } catch (error) {
            console.log('📊 Analytics: Conversion tracking failed (non-critical):', error);
        }
    }

    // Get conversion step number
    getConversionStep(screenName) {
        const steps = {
            'landing': 1,
            'mobile_entry': 2,
            'otp_verification': 3,
            'basic_info': 4,
            'assessment': 5,
            'results': 6
        };
        return steps[screenName] || 0;
    }

    // Track drop-off
    async trackDropOff(reason = 'unknown') {
        try {
            if (!this.supabase) return;

            const timeSpent = Math.round((Date.now() - this.screenStartTime) / 1000);

            await this.supabase
                .from('funnel_analytics')
                .insert({
                    session_id: this.sessionId,
                    screen_name: this.currentScreen,
                    action_type: 'drop_off',
                    action_details: { reason: reason },
                    time_spent: timeSpent,
                    dropped_off: true,
                    conversion_step: this.getConversionStep(this.currentScreen)
                });

            await this.updateConversionStatus('dropped_off', {
                exit_page: window.location.href
            });
        } catch (error) {
            console.log('📊 Analytics: Drop-off tracking failed (non-critical):', error);
        }
    }

    // Update daily stats (called periodically)
    async updateDailyStats() {
        try {
            if (!this.supabase) return;

            // This would typically be called from a backend process
            // For now, we'll just ensure today's record exists
            const today = new Date().toISOString().split('T')[0];
            
            const { error } = await this.supabase
                .from('daily_stats')
                .upsert({ date: today }, { onConflict: 'date' });

            if (error) throw error;
        } catch (error) {
            console.log('📊 Analytics: Daily stats update failed (non-critical):', error);
        }
    }

    // Utility method to track common conversions
    async trackConversion(type, data = {}) {
        const conversionMap = {
            'mobile_entered': 'mobile_entered',
            'otp_verified': 'otp_verified', 
            'assessment_started': 'assessment_started',
            'assessment_completed': 'completed',
            'whatsapp_clicked': 'whatsapp_conversion'
        };

        await this.updateConversionStatus(conversionMap[type] || type, data);
        await this.trackAction('conversion', { type, ...data });
    }
}

// Utility functions for easy integration
window.TopikoAnalytics = TopikoAnalytics;

// Safe tracking wrapper functions
window.trackScreenView = function(screenName, details = {}) {
    if (window.analytics && window.analytics.isInitialized) {
        window.analytics.trackScreenView(screenName, details);
    }
};

window.trackAction = function(actionType, details = {}) {
    if (window.analytics && window.analytics.isInitialized) {
        window.analytics.trackAction(actionType, details);
    }
};

window.trackConversion = function(type, data = {}) {
    if (window.analytics && window.analytics.isInitialized) {
        window.analytics.trackConversion(type, data);
    }
};

// Track page unload (drop-off detection)
window.addEventListener('beforeunload', function() {
    if (window.analytics && window.analytics.isInitialized) {
        // Use sendBeacon for reliable tracking on page unload
        window.analytics.trackDropOff('page_unload');
    }
});

console.log('📊 Analytics module loaded successfully');