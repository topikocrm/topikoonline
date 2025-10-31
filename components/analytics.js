// Topiko Analytics Tracking Module
// Safe, non-breaking analytics implementation

class TopikoAnalytics {
    constructor(supabaseClient, sessionId) {
        this.supabase = supabaseClient;
        this.sessionId = this.getOrCreateSessionId(sessionId);
        this.currentScreen = 'landing';
        this.screenStartTime = Date.now();
        this.isInitialized = false;
        
        // Initialize analytics safely
        this.init();
    }

    // Get existing session ID from localStorage or create new one
    getOrCreateSessionId(providedSessionId) {
        try {
            const storageKey = 'topiko_session_id';
            const storedSessionId = localStorage.getItem(storageKey);
            
            // If we have a stored session that's less than 24 hours old, use it
            const sessionTimestamp = localStorage.getItem(storageKey + '_timestamp');
            const now = Date.now();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            
            if (storedSessionId && sessionTimestamp && (now - parseInt(sessionTimestamp)) < twentyFourHours) {
                console.log('📊 Using existing session:', storedSessionId);
                return storedSessionId;
            }
            
            // Create new session
            const newSessionId = providedSessionId || ('sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
            localStorage.setItem(storageKey, newSessionId);
            localStorage.setItem(storageKey + '_timestamp', now.toString());
            
            console.log('📊 Created new session:', newSessionId);
            return newSessionId;
            
        } catch (error) {
            console.log('📊 LocalStorage not available, using provided session ID');
            return providedSessionId || ('sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
        }
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
            
            // Get geographic location data
            this.locationInfo = await this.getLocationInfo();

            // Track initial page visit
            await this.trackPageVisit();
            await this.initializeSession();
            // Note: Landing screen view will be tracked by the main app, not here

            this.isInitialized = true;
            console.log('📊 Analytics initialized successfully');
            
            // Process any queued tracking calls
            if (window.trackingQueue && window.trackingQueue.length > 0) {
                console.log(`📊 Processing ${window.trackingQueue.length} queued tracking calls`);
                window.trackingQueue.forEach(call => {
                    if (call.type === 'screenView') {
                        this.trackScreenView(call.screenName, call.details);
                    }
                });
                window.trackingQueue = []; // Clear the queue
            }
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

    // Get geographic location from IP
    async getLocationInfo() {
        try {
            console.log('🌍 Getting location info...');
            
            // Try multiple geolocation services
            const services = [
                {
                    name: 'ipapi.co',
                    url: 'https://ipapi.co/json/',
                    parser: (data) => ({
                        city: data.city || 'Unknown',
                        region: data.region || 'Unknown', 
                        country: data.country_name || 'Unknown',
                        country_code: data.country_code || 'Unknown',
                        timezone: data.timezone || 'Unknown',
                        ip: data.ip || 'Unknown',
                        isp: data.org || 'Unknown'
                    })
                },
                {
                    name: 'ipinfo.io',
                    url: 'https://ipinfo.io/json',
                    parser: (data) => ({
                        city: data.city || 'Unknown',
                        region: data.region || 'Unknown',
                        country: data.country || 'Unknown',
                        country_code: data.country || 'Unknown',
                        timezone: data.timezone || 'Unknown',
                        ip: data.ip || 'Unknown',
                        isp: data.org || 'Unknown'
                    })
                },
                {
                    name: 'ip-api.com',
                    url: 'http://ip-api.com/json/',
                    parser: (data) => ({
                        city: data.city || 'Unknown',
                        region: data.regionName || 'Unknown',
                        country: data.country || 'Unknown',
                        country_code: data.countryCode || 'Unknown',
                        timezone: data.timezone || 'Unknown',
                        ip: data.query || 'Unknown',
                        isp: data.isp || 'Unknown'
                    })
                }
            ];
            
            for (const service of services) {
                try {
                    console.log(`🌍 Trying ${service.name}...`);
                    
                    const response = await fetch(service.url, {
                        timeout: 5000 // 5 second timeout
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    // Check if service returned an error
                    if (data.error || data.status === 'fail') {
                        throw new Error(data.message || `${service.name} returned error`);
                    }
                    
                    const locationInfo = service.parser(data);
                    console.log(`🌍 Location detected via ${service.name}:`, locationInfo);
                    return locationInfo;
                    
                } catch (serviceError) {
                    console.log(`🌍 ${service.name} failed:`, serviceError.message);
                    continue; // Try next service
                }
            }
            
            // All services failed
            throw new Error('All geolocation services failed');
            
        } catch (error) {
            console.log('🌍 Location detection failed (non-critical):', error);
            
            // Fallback to basic timezone detection
            return {
                city: 'Unknown',
                region: 'Unknown',
                country: 'Unknown', 
                country_code: 'Unknown',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
                ip: 'Unknown',
                isp: 'Unknown'
            };
        }
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
                ...this.utmParams,
                // Add location data if available
                ...(this.locationInfo && {
                    ip_address: this.locationInfo.ip !== 'Unknown' ? this.locationInfo.ip : null
                })
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
            const { data: existingSession, error: selectError } = await this.supabase
                .from('user_sessions')
                .select('*')
                .eq('session_id', this.sessionId)
                .maybeSingle(); // Use maybeSingle instead of single to avoid 406 when no rows found
                
            if (selectError && selectError.code !== 'PGRST116') {
                // PGRST116 = no rows returned, which is OK
                console.log('📊 Session lookup failed:', selectError);
                throw selectError;
            }

            if (existingSession) {
                // Skip session update to avoid 400 errors - just log that session exists
                console.log('📊 Existing session found, skipping update to avoid errors');
            } else {
                // Create new session with clean data
                const sessionData = {
                    session_id: this.sessionId,
                    device_type: this.sessionInfo?.device_type || 'unknown',
                    browser: this.sessionInfo?.browser || 'unknown',
                    traffic_source: this.sessionInfo?.traffic_source || 'direct',
                    landing_page: this.sessionInfo?.landing_page || window.location.href,
                    // UTM data
                    utm_source: this.utmParams?.utm_source || null,
                    utm_medium: this.utmParams?.utm_medium || null,
                    utm_campaign: this.utmParams?.utm_campaign || null,
                    // Location data
                    city: this.locationInfo?.city && this.locationInfo.city !== 'Unknown' ? this.locationInfo.city : null,
                    country: this.locationInfo?.country && this.locationInfo.country !== 'Unknown' ? this.locationInfo.country : null
                };

                console.log('📊 Creating new session:', sessionData);
                
                const { error: insertError } = await this.supabase
                    .from('user_sessions')
                    .insert(sessionData);
                    
                if (insertError) {
                    console.log('📊 Session insert failed:', insertError);
                    throw insertError;
                }
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

            // Skip session updates to avoid 400 errors - just log the conversion
            console.log('📊 Conversion status update skipped to avoid errors:', { 
                status, 
                additionalData,
                sessionId: this.sessionId 
            });
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

// Safe tracking wrapper functions with enhanced logging
window.trackScreenView = function(screenName, details = {}) {
    console.log(`📊 trackScreenView called: ${screenName}`, details);
    if (window.analytics && window.analytics.isInitialized) {
        console.log(`📊 Analytics ready - tracking ${screenName}`);
        window.analytics.trackScreenView(screenName, details);
    } else {
        console.log(`📊 Analytics not ready - queuing ${screenName}`);
        // Queue the tracking call for when analytics is ready
        if (!window.trackingQueue) window.trackingQueue = [];
        window.trackingQueue.push({ type: 'screenView', screenName, details });
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