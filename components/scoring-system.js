// Advanced Digital Readiness Scoring System
class DigitalReadinessScorer {
    constructor() {
        this.maxScore = 100;
        this.weights = {
            goals: 0.25,           // 25% - What they want to achieve
            digitalStatus: 0.30,   // 30% - Current digital maturity
            budget: 0.25,          // 25% - Investment readiness
            challenge: 0.20        // 20% - Problem awareness
        };
        
        this.scoringRules = this.initializeScoringRules();
    }

    initializeScoringRules() {
        return {
            goals: {
                'more_customers': { base: 25, complexity: 'medium', impact: 'high' },
                'showcase': { base: 20, complexity: 'low', impact: 'medium' },
                'brand': { base: 20, complexity: 'medium', impact: 'high' },
                'automate': { base: 25, complexity: 'high', impact: 'high' },
                'app': { base: 30, complexity: 'high', impact: 'high' }
            },
            digitalStatus: {
                'no_presence': { score: 15, readiness: 'low', gap: 'major' },
                'basic_social': { score: 35, readiness: 'emerging', gap: 'significant' },
                'basic_website': { score: 65, readiness: 'developing', gap: 'moderate' },
                'no_results': { score: 80, readiness: 'advanced', gap: 'minor' }
            },
            budget: {
                'below_2k': { score: 25, viability: 'limited', risk: 'high' },
                '2k_10k': { score: 55, viability: 'moderate', risk: 'medium' },
                '10k_25k': { score: 75, viability: 'good', risk: 'low' },
                '25k_plus': { score: 90, viability: 'excellent', risk: 'minimal' }
            },
            challenge: {
                'no_leads': { score: 85, specificity: 'high', urgency: 'critical' },
                'dont_know': { score: 30, specificity: 'low', urgency: 'low' },
                'no_time': { score: 65, specificity: 'medium', urgency: 'high' },
                'low_sales': { score: 90, specificity: 'high', urgency: 'critical' }
            }
        };
    }

    calculateOverallScore(formData) {
        let totalScore = 0;
        const scoreBreakdown = {};

        // Goals scoring
        const goalsScore = this.calculateGoalsScore(formData.goals);
        scoreBreakdown.goals = {
            score: goalsScore,
            weight: this.weights.goals,
            weightedScore: goalsScore * this.weights.goals
        };
        totalScore += scoreBreakdown.goals.weightedScore;

        // Digital status scoring with realistic assessment
        const statusData = this.scoringRules.digitalStatus[formData.digitalStatus] || { score: 0, readiness: 'unknown' };
        const statusScore = this.calculateRealisticStatusScore(statusData, formData);
        scoreBreakdown.digitalStatus = {
            score: statusScore,
            weight: this.weights.digitalStatus,
            weightedScore: statusScore * this.weights.digitalStatus,
            readiness: statusData.readiness,
            gap: statusData.gap
        };
        totalScore += scoreBreakdown.digitalStatus.weightedScore;

        // Budget scoring with viability analysis
        const budgetData = this.scoringRules.budget[formData.budget] || { score: 0, viability: 'unknown' };
        const budgetScore = this.calculateRealisticBudgetScore(budgetData, formData);
        scoreBreakdown.budget = {
            score: budgetScore,
            weight: this.weights.budget,
            weightedScore: budgetScore * this.weights.budget,
            viability: budgetData.viability,
            risk: budgetData.risk
        };
        totalScore += scoreBreakdown.budget.weightedScore;

        // Challenge scoring with specificity weighting
        const challengeData = this.scoringRules.challenge[formData.challenge] || { score: 0, specificity: 'unknown' };
        const challengeScore = this.calculateRealisticChallengeScore(challengeData, formData);
        scoreBreakdown.challenge = {
            score: challengeScore,
            weight: this.weights.challenge,
            weightedScore: challengeScore * this.weights.challenge,
            specificity: challengeData.specificity,
            urgency: challengeData.urgency
        };
        totalScore += scoreBreakdown.challenge.weightedScore;

        return {
            totalScore: Math.min(Math.round(totalScore), this.maxScore),
            breakdown: scoreBreakdown,
            category: this.getScoreCategory(totalScore),
            recommendations: this.getRecommendations(totalScore, formData)
        };
    }

    calculateGoalsScore(goals) {
        if (!goals || !Array.isArray(goals) || goals.length === 0) {
            return 0;
        }

        // Calculate realistic score based on goal complexity and impact
        let totalScore = 0;
        let complexityBonus = 0;
        let impactMultiplier = 1;

        goals.forEach(goal => {
            const goalData = this.scoringRules.goals[goal];
            if (goalData) {
                totalScore += goalData.base;
                
                // Complexity bonus for advanced goals
                if (goalData.complexity === 'high') {
                    complexityBonus += 5;
                } else if (goalData.complexity === 'medium') {
                    complexityBonus += 2;
                }
                
                // Impact multiplier adjustment
                if (goalData.impact === 'high') {
                    impactMultiplier += 0.1;
                }
            }
        });

        // Realistic goal combination scoring
        const combinationScore = this.getRealisticGoalCombination(goals);
        
        // Final calculation with diminishing returns for too many goals
        let finalScore = (totalScore + complexityBonus) * impactMultiplier + combinationScore;
        
        // Apply realistic cap - too many goals can reduce focus
        if (goals.length > 3) {
            finalScore *= 0.9; // Slight penalty for lack of focus
        }
        
        return Math.min(Math.round(finalScore), 100);
    }

    getRealisticGoalCombination(goals) {
        // Realistic bonus for complementary goal combinations
        let combinationBonus = 0;
        
        // Strategic combinations that work well together
        if (goals.includes('brand') && goals.includes('showcase')) {
            combinationBonus += 8; // Brand + showcase is powerful
        }
        if (goals.includes('more_customers') && goals.includes('automate')) {
            combinationBonus += 10; // Growth + efficiency is excellent
        }
        if (goals.includes('app') && goals.includes('brand')) {
            combinationBonus += 12; // Premium combination
        }
        
        // Focus bonus for 2-3 goals (sweet spot)
        if (goals.length >= 2 && goals.length <= 3) {
            combinationBonus += 5;
        }
        
        return combinationBonus;
    }

    calculateRealisticStatusScore(statusData, formData) {
        let score = statusData.score;
        
        // Adjust based on goal alignment
        if (formData.goals) {
            // If they want advanced goals but have basic status, reduce score
            const advancedGoals = formData.goals.filter(g => 
                ['app', 'automate'].includes(g)
            ).length;
            
            if (advancedGoals > 0 && statusData.readiness === 'low') {
                score *= 0.7; // Major gap penalty
            } else if (advancedGoals > 0 && statusData.readiness === 'emerging') {
                score *= 0.85; // Moderate gap penalty
            }
        }
        
        return Math.round(score);
    }

    calculateRealisticBudgetScore(budgetData, formData) {
        let score = budgetData.score;
        
        // Budget-goal alignment scoring
        if (formData.goals) {
            const expensiveGoals = formData.goals.filter(g => 
                ['app', 'automate', 'brand'].includes(g)
            ).length;
            
            // Penalty for expensive goals with low budget
            if (expensiveGoals > 0 && budgetData.viability === 'limited') {
                score *= 0.5; // Major viability penalty
            } else if (expensiveGoals > 1 && budgetData.viability === 'moderate') {
                score *= 0.8; // Moderate viability penalty
            }
            
            // Bonus for appropriate budget-goal matching
            if (expensiveGoals > 0 && budgetData.viability === 'excellent') {
                score *= 1.1; // Reward realistic planning
            }
        }
        
        return Math.round(score);
    }

    calculateRealisticChallengeScore(challengeData, formData) {
        let score = challengeData.score;
        
        // Challenge-goal alignment
        if (formData.goals && formData.challenge) {
            // Specific challenges aligned with specific goals get bonus
            if (formData.challenge === 'no_leads' && formData.goals.includes('more_customers')) {
                score *= 1.15; // Clear problem-solution alignment
            }
            if (formData.challenge === 'low_sales' && formData.goals.includes('automate')) {
                score *= 1.1; // Efficiency solving sales problems
            }
        }
        
        return Math.round(score);
    }

    getScoreCategory(score) {
        if (score >= 80) return { level: 'high', label: 'Digitally Ready', color: '#10b981' };
        if (score >= 60) return { level: 'medium-high', label: 'Nearly Ready', color: '#3b82f6' };
        if (score >= 40) return { level: 'medium', label: 'Getting Started', color: '#f59e0b' };
        if (score >= 20) return { level: 'low-medium', label: 'Early Stage', color: '#ef4444' };
        return { level: 'low', label: 'Just Beginning', color: '#6b7280' };
    }

    getRecommendations(score, formData) {
        const recommendations = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            productSuggestion: null
        };

        // Immediate recommendations based on current status
        if (formData.digitalStatus === 'no_presence') {
            recommendations.immediate.push({
                icon: '🌐',
                title: 'Establish Online Presence',
                description: 'Start with a basic website or social media profiles',
                priority: 'high'
            });
        }

        if (formData.challenge === 'no_leads') {
            recommendations.immediate.push({
                icon: '📈',
                title: 'Lead Generation Setup',
                description: 'Implement basic lead capture and follow-up systems',
                priority: 'high'
            });
        }

        // Short-term recommendations
        if (formData.goals.includes('automate')) {
            recommendations.shortTerm.push({
                icon: '🤖',
                title: 'Process Automation',
                description: 'Set up automated customer management workflows',
                priority: 'medium'
            });
        }

        if (formData.goals.includes('brand')) {
            recommendations.shortTerm.push({
                icon: '✨',
                title: 'Brand Development',
                description: 'Create consistent brand identity across all platforms',
                priority: 'medium'
            });
        }

        // Long-term recommendations
        if (formData.budget === '25k_plus') {
            recommendations.longTerm.push({
                icon: '🚀',
                title: 'Advanced Solutions',
                description: 'Custom development and enterprise-level features',
                priority: 'low'
            });
        }

        // Product suggestion based on comprehensive analysis
        recommendations.productSuggestion = this.getProductRecommendation(score, formData);

        return recommendations;
    }

    getProductRecommendation(score, formData) {
        const { budget, digitalStatus, goals, challenge } = formData;

        // Decision tree for product recommendation
        if (budget === 'below_2k' || digitalStatus === 'no_presence') {
            return {
                product: 'Disblay',
                confidence: 'high',
                reason: 'Perfect starting point for digital presence',
                features: [
                    'Quick setup and deployment',
                    'Basic online presence',
                    'Mobile-friendly design',
                    'WhatsApp integration'
                ],
                pricing: 'Under ₹2,000/month',
                setupTime: '24-48 hours'
            };
        }

        if (budget === '25k_plus' && goals.includes('app')) {
            return {
                product: 'HEBT',
                confidence: 'high',
                reason: 'Advanced custom solutions for your requirements',
                features: [
                    'Custom app development',
                    'Enterprise-grade features',
                    'Full technical support',
                    'Scalable architecture'
                ],
                pricing: '₹25,000+/month',
                setupTime: '4-8 weeks'
            };
        }

        if (goals.includes('brand') && (budget === '10k_25k' || budget === '25k_plus')) {
            return {
                product: 'Topiko + Brandpreneuring',
                confidence: 'high',
                reason: 'Complete brand building and digital presence solution',
                features: [
                    'Professional brand strategy',
                    'Complete digital ecosystem',
                    'Marketing campaign support',
                    'Premium design and development'
                ],
                pricing: '₹15,000-30,000/month',
                setupTime: '2-4 weeks'
            };
        }

        // Default recommendation - Topiko
        return {
            product: 'Topiko',
            confidence: 'medium',
            reason: 'Comprehensive solution for growing businesses',
            features: [
                'Professional website and app',
                'Lead management system',
                'Digital marketing tools',
                'Analytics and reporting'
            ],
            pricing: '₹5,000-15,000/month',
            setupTime: '1-2 weeks'
        };
    }

    // Dimension-based scoring for detailed breakdown
    calculateDimensionScores(formData) {
        const dimensions = {
            visibility: this.calculateVisibilityScore(formData),
            engagement: this.calculateEngagementScore(formData),
            automation: this.calculateAutomationScore(formData),
            brandPresentation: this.calculateBrandScore(formData)
        };

        return dimensions;
    }

    calculateVisibilityScore(formData) {
        let score = 0;
        
        // Base score from digital status
        const statusScores = {
            'no_presence': 20,
            'basic_social': 50,
            'basic_website': 75,
            'no_results': 90
        };
        score += statusScores[formData.digitalStatus] || 0;
        
        // Boost for showcase goal
        if (formData.goals.includes('showcase')) {
            score += 15;
        }
        
        return Math.min(score, 100);
    }

    calculateEngagementScore(formData) {
        let score = 30; // Base score
        
        // Score based on goals
        if (formData.goals.includes('more_customers')) score += 30;
        if (formData.goals.includes('brand')) score += 20;
        
        // Challenge awareness
        if (formData.challenge === 'no_leads') score += 20;
        if (formData.challenge === 'low_sales') score += 25;
        
        return Math.min(score, 100);
    }

    calculateAutomationScore(formData) {
        let score = 10; // Base score
        
        // Direct automation goal
        if (formData.goals.includes('automate')) score += 50;
        
        // Budget indicates automation capability
        if (formData.budget === '10k_25k') score += 20;
        if (formData.budget === '25k_plus') score += 30;
        
        // Time constraint indicates need for automation
        if (formData.challenge === 'no_time') score += 20;
        
        return Math.min(score, 100);
    }

    calculateBrandScore(formData) {
        let score = 40; // Base score for existing businesses
        
        // Brand-focused goals
        if (formData.goals.includes('brand')) score += 40;
        if (formData.goals.includes('app')) score += 20;
        
        // Higher budget indicates brand investment capability
        if (formData.budget === '25k_plus') score += 20;
        
        return Math.min(score, 100);
    }

    // Calculate realistic Solution Match score (60-95%)
    calculateSolutionMatchScore(formData, recommendedProduct) {
        let baseScore = 75; // Start with neutral match
        
        // Product-specific scoring
        const productScoring = {
            'Disblay': { baseRange: [60, 75], strengths: ['showcase', 'basic'] },
            'Topiko': { baseRange: [70, 85], strengths: ['more_customers', 'showcase', 'brand'] },
            'Topiko + Brandpreneuring': { baseRange: [75, 90], strengths: ['brand', 'more_customers'] },
            'HEBT': { baseRange: [80, 95], strengths: ['app', 'automate'] }
        };
        
        const productData = productScoring[recommendedProduct] || { baseRange: [65, 80], strengths: [] };
        baseScore = productData.baseRange[0];
        
        // Goal alignment scoring
        if (formData.goals) {
            const alignedGoals = formData.goals.filter(goal => 
                productData.strengths.includes(goal)
            ).length;
            
            const goalAlignmentBonus = (alignedGoals / formData.goals.length) * 15;
            baseScore += goalAlignmentBonus;
        }
        
        // Budget-product fit
        const budgetFit = this.calculateBudgetProductFit(formData.budget, recommendedProduct);
        baseScore += budgetFit;
        
        // Digital readiness alignment
        const readinessAlignment = this.calculateReadinessProductAlignment(formData, recommendedProduct);
        baseScore += readinessAlignment;
        
        // Challenge-solution fit
        const challengeFit = this.calculateChallengeSolutionFit(formData.challenge, recommendedProduct);
        baseScore += challengeFit;
        
        // Ensure score stays within realistic range (60-95%)
        return Math.min(Math.max(Math.round(baseScore), 60), 95);
    }
    
    calculateBudgetProductFit(budget, product) {
        const budgetProductMatrix = {
            'below_2k': { 'Disblay': 8, 'Topiko': -5, 'Topiko + Brandpreneuring': -10, 'HEBT': -15 },
            '2k_10k': { 'Disblay': 5, 'Topiko': 8, 'Topiko + Brandpreneuring': 3, 'HEBT': -8 },
            '10k_25k': { 'Disblay': 0, 'Topiko': 5, 'Topiko + Brandpreneuring': 8, 'HEBT': 3 },
            '25k_plus': { 'Disblay': -3, 'Topiko': 3, 'Topiko + Brandpreneuring': 5, 'HEBT': 10 }
        };
        
        return budgetProductMatrix[budget]?.[product] || 0;
    }
    
    calculateReadinessProductAlignment(formData, product) {
        const readinessProductMatrix = {
            'no_presence': { 'Disblay': 5, 'Topiko': 0, 'Topiko + Brandpreneuring': -3, 'HEBT': -8 },
            'basic_social': { 'Disblay': 3, 'Topiko': 5, 'Topiko + Brandpreneuring': 3, 'HEBT': -5 },
            'basic_website': { 'Disblay': 0, 'Topiko': 3, 'Topiko + Brandpreneuring': 5, 'HEBT': 3 },
            'no_results': { 'Disblay': -3, 'Topiko': 5, 'Topiko + Brandpreneuring': 8, 'HEBT': 8 }
        };
        
        return readinessProductMatrix[formData.digitalStatus]?.[product] || 0;
    }
    
    calculateChallengeSolutionFit(challenge, product) {
        const challengeSolutionMatrix = {
            'no_leads': { 'Disblay': 3, 'Topiko': 8, 'Topiko + Brandpreneuring': 5, 'HEBT': 5 },
            'low_sales': { 'Disblay': 5, 'Topiko': 8, 'Topiko + Brandpreneuring': 8, 'HEBT': 3 },
            'no_time': { 'Disblay': 8, 'Topiko': 5, 'Topiko + Brandpreneuring': 3, 'HEBT': 8 },
            'dont_know': { 'Disblay': 5, 'Topiko': 3, 'Topiko + Brandpreneuring': 0, 'HEBT': -3 }
        };
        
        return challengeSolutionMatrix[challenge]?.[product] || 0;
    }

    // Generate insights based on scoring
    generateInsights(scoreData, formData) {
        const insights = [];
        const { totalScore, breakdown, category } = scoreData;

        // Overall readiness insight
        insights.push({
            type: 'overall',
            icon: category.level === 'high' ? '🎉' : category.level === 'medium-high' ? '👍' : '💡',
            title: `You're ${category.label}!`,
            description: this.getReadinessDescription(category.level, totalScore),
            priority: 'high'
        });

        // Specific insights based on weak areas
        Object.entries(breakdown).forEach(([dimension, data]) => {
            if (data.score < 60) {
                insights.push(this.getImprovementInsight(dimension, data.score, formData));
            }
        });

        // Opportunity insights
        if (formData.budget === '25k_plus' && totalScore < 80) {
            insights.push({
                type: 'opportunity',
                icon: '🚀',
                title: 'High Growth Potential',
                description: 'Your budget allows for advanced solutions that could significantly accelerate your digital transformation.',
                priority: 'medium'
            });
        }

        return insights.slice(0, 5); // Limit to top 5 insights
    }

    getReadinessDescription(level, score) {
        const descriptions = {
            'high': `With a score of ${score}/100, you're well-positioned for digital success. Your business shows strong readiness across multiple dimensions.`,
            'medium-high': `Your score of ${score}/100 indicates good digital readiness. A few strategic improvements could unlock significant growth.`,
            'medium': `At ${score}/100, you're on the right track. Focus on strengthening key areas to accelerate your digital journey.`,
            'low-medium': `Your ${score}/100 score shows potential. With the right guidance, you can build a strong digital foundation.`,
            'low': `Starting at ${score}/100 is perfectly fine. Every successful business began somewhere, and you're taking the right first step.`
        };
        
        return descriptions[level] || descriptions['medium'];
    }

    getImprovementInsight(dimension, score, formData) {
        const insights = {
            goals: {
                icon: '🎯',
                title: 'Expand Your Vision',
                description: 'Consider additional goals like automation or branding to maximize your digital potential.',
                priority: 'medium'
            },
            digitalStatus: {
                icon: '🌐',
                title: 'Strengthen Online Presence',
                description: 'Building a more robust digital foundation will significantly improve your readiness score.',
                priority: 'high'
            },
            budget: {
                icon: '💰',
                title: 'Investment Planning',
                description: 'Consider allocating more resources to digital initiatives for better ROI.',
                priority: 'low'
            },
            challenge: {
                icon: '🔍',
                title: 'Problem Clarity',
                description: 'Identifying specific challenges helps us provide more targeted solutions.',
                priority: 'medium'
            }
        };

        return insights[dimension] || {
            icon: '💡',
            title: 'Improvement Opportunity',
            description: 'This area could benefit from focused attention.',
            priority: 'low'
        };
    }

    // Calculate 3-category match percentages (Marketing, Website, Branding)
    calculateThreeCategoryMatch(formData) {
        const categories = {
            Marketing: this.calculateMarketingMatch(formData),
            Website: this.calculateWebsiteMatch(formData),
            Branding: this.calculateBrandingMatch(formData)
        };
        
        return categories;
    }
    
    calculateMarketingMatch(formData) {
        let score = 40; // Base marketing relevance
        
        // Goal alignment
        if (formData.goals) {
            if (formData.goals.includes('more_customers')) score += 25;
            if (formData.goals.includes('showcase')) score += 15;
            if (formData.goals.includes('brand')) score += 10;
        }
        
        // Challenge alignment
        if (formData.challenge === 'no_leads') score += 20;
        if (formData.challenge === 'low_sales') score += 15;
        
        // Budget viability for marketing
        const budgetScores = {
            'below_2k': 10,
            '2k_10k': 15,
            '10k_25k': 20,
            '25k_plus': 25
        };
        score += budgetScores[formData.budget] || 10;
        
        // Digital status - marketing works better with some online presence
        const statusScores = {
            'no_presence': -10,
            'basic_social': 5,
            'basic_website': 10,
            'no_results': 15
        };
        score += statusScores[formData.digitalStatus] || 0;
        
        return Math.min(Math.max(Math.round(score), 25), 95);
    }
    
    calculateWebsiteMatch(formData) {
        let score = 50; // Base website relevance (most businesses need one)
        
        // Goal alignment
        if (formData.goals) {
            if (formData.goals.includes('showcase')) score += 20;
            if (formData.goals.includes('more_customers')) score += 15;
            if (formData.goals.includes('app')) score += 10; // Apps often need web presence
        }
        
        // Digital status - higher need if lacking web presence
        const statusScores = {
            'no_presence': 25,
            'basic_social': 20,
            'basic_website': 5,
            'no_results': 10
        };
        score += statusScores[formData.digitalStatus] || 0;
        
        // Budget viability
        const budgetScores = {
            'below_2k': 15,
            '2k_10k': 20,
            '10k_25k': 15,
            '25k_plus': 10
        };
        score += budgetScores[formData.budget] || 10;
        
        // Challenge alignment
        if (formData.challenge === 'no_leads') score += 10;
        if (formData.challenge === 'low_sales') score += 10;
        
        return Math.min(Math.max(Math.round(score), 30), 95);
    }
    
    calculateBrandingMatch(formData) {
        let score = 35; // Base branding relevance
        
        // Goal alignment
        if (formData.goals) {
            if (formData.goals.includes('brand')) score += 30;
            if (formData.goals.includes('showcase')) score += 15;
            if (formData.goals.includes('app')) score += 10;
        }
        
        // Budget - branding typically requires higher investment
        const budgetScores = {
            'below_2k': 5,
            '2k_10k': 10,
            '10k_25k': 20,
            '25k_plus': 25
        };
        score += budgetScores[formData.budget] || 5;
        
        // Digital status - branding more valuable with existing presence
        const statusScores = {
            'no_presence': 5,
            'basic_social': 10,
            'basic_website': 15,
            'no_results': 20
        };
        score += statusScores[formData.digitalStatus] || 0;
        
        // Challenge alignment
        if (formData.challenge === 'low_sales') score += 15; // Branding can help sales
        if (formData.challenge === 'no_leads') score += 10;
        
        return Math.min(Math.max(Math.round(score), 20), 95);
    }

    // Export scoring results for admin dashboard
    exportScoringData(formData) {
        const scoreData = this.calculateOverallScore(formData);
        const dimensionScores = this.calculateDimensionScores(formData);
        const insights = this.generateInsights(scoreData, formData);

        return {
            timestamp: new Date().toISOString(),
            sessionId: formData.sessionId,
            overall: scoreData,
            dimensions: dimensionScores,
            insights: insights,
            formData: {
                goals: formData.goals,
                digitalStatus: formData.digitalStatus,
                budget: formData.budget,
                challenge: formData.challenge
            }
        };
    }
}

// Global instance for use in main application
window.digitalReadinessScorer = new DigitalReadinessScorer();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DigitalReadinessScorer;
}