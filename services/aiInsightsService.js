const axios = require('axios');

class AIInsightsService {
  constructor() {
    this.huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    
    if (!this.huggingFaceApiKey) {
      console.warn('⚠️ HUGGING_FACE_API_KEY not found. AI insights will use mock data.');
    }
  }

  // Generate insights from dashboard metrics
  async generateInsights(metrics) {
    try {
      const insights = await Promise.all([
        this.generateSalesInsight(metrics),
        this.generateUserInsight(metrics),
        this.generatePerformanceInsight(metrics),
        this.generateRecommendation(metrics)
      ]);

      return {
        insights: insights.filter(insight => insight !== null),
        generatedAt: new Date(),
        confidence: this.calculateConfidence(metrics)
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getMockInsights(metrics);
    }
  }

  // Generate sales-focused insights
  async generateSalesInsight(metrics) {
    const salesData = {
      totalRevenue: metrics.totalRevenue || 0,
      revenueGrowth: metrics.revenueGrowth || 0,
      averageOrderValue: metrics.averageOrderValue || 0,
      totalSales: metrics.totalSales || 0,
      topSellingProducts: metrics.topSellingProducts || []
    };

    const prompt = this.buildSalesPrompt(salesData);
    
    try {
      const insight = await this.callHuggingFaceAPI(prompt);
      return {
        type: 'sales',
        title: 'Sales Performance',
        content: insight,
        priority: 'high',
        actionable: true,
        metrics: salesData
      };
    } catch (error) {
      return this.getMockSalesInsight(salesData);
    }
  }

  // Generate user behavior insights
  async generateUserInsight(metrics) {
    const userData = {
      activeUsers: metrics.activeUsersToday || 0,
      totalUsers: metrics.totalUsers || 0,
      userGrowthRate: metrics.userGrowthRate || 0,
      conversionRate: metrics.conversionRate || 0,
      bounceRate: metrics.bounceRate || 0,
      sessionDuration: metrics.averageSessionDuration || 0
    };

    const prompt = this.buildUserPrompt(userData);
    
    try {
      const insight = await this.callHuggingFaceAPI(prompt);
      return {
        type: 'users',
        title: 'User Behavior',
        content: insight,
        priority: 'medium',
        actionable: true,
        metrics: userData
      };
    } catch (error) {
      return this.getMockUserInsight(userData);
    }
  }

  // Generate performance insights
  async generatePerformanceInsight(metrics) {
    const performanceData = {
      pageViews: metrics.pageViewsLast24Hours || 0,
      uniqueSessions: metrics.uniqueSessions || 0,
      pagesPerSession: metrics.pagesPerSession || 0,
      returnVisitorRate: metrics.returnVisitorRate || 0,
      systemUptime: metrics.systemUptime || 0
    };

    const prompt = this.buildPerformancePrompt(performanceData);
    
    try {
      const insight = await this.callHuggingFaceAPI(prompt);
      return {
        type: 'performance',
        title: 'Platform Performance',
        content: insight,
        priority: 'medium',
        actionable: false,
        metrics: performanceData
      };
    } catch (error) {
      return this.getMockPerformanceInsight(performanceData);
    }
  }

  // Generate actionable recommendations
  async generateRecommendation(metrics) {
    const allData = {
      ...metrics,
      timestamp: new Date().toISOString()
    };

    const prompt = this.buildRecommendationPrompt(allData);
    
    try {
      const recommendation = await this.callHuggingFaceAPI(prompt);
      return {
        type: 'recommendation',
        title: 'AI Recommendation',
        content: recommendation,
        priority: 'high',
        actionable: true,
        category: 'optimization'
      };
    } catch (error) {
      return this.getMockRecommendation(allData);
    }
  }

  // Call Hugging Face API
  async callHuggingFaceAPI(prompt) {
    if (!this.huggingFaceApiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    const response = await axios.post(
      `${this.baseUrl}/microsoft/DialoGPT-medium`,
      {
        inputs: prompt,
        parameters: {
          max_length: 200,
          temperature: 0.7,
          do_sample: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.huggingFaceApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data[0]?.generated_text || 'Unable to generate insight at this time.';
  }

  // Build prompts for different insight types
  buildSalesPrompt(data) {
    return `Analyze these e-commerce sales metrics and provide a brief, actionable insight:

Revenue: $${data.totalRevenue.toLocaleString()}
Growth: ${data.revenueGrowth}%
Average Order Value: $${data.averageOrderValue}
Total Sales: ${data.totalSales}
Top Products: ${data.topSellingProducts.map(p => p.name).join(', ')}

Provide a concise business insight focusing on trends and opportunities.`;
  }

  buildUserPrompt(data) {
    return `Analyze these user engagement metrics and provide insights:

Active Users: ${data.activeUsers}
Total Users: ${data.totalUsers}
Growth Rate: ${data.userGrowthRate}%
Conversion Rate: ${data.conversionRate}%
Bounce Rate: ${data.bounceRate}%
Session Duration: ${data.sessionDuration} minutes

Focus on user behavior patterns and engagement opportunities.`;
  }

  buildPerformancePrompt(data) {
    return `Analyze these platform performance metrics:

Page Views: ${data.pageViews}
Unique Sessions: ${data.uniqueSessions}
Pages per Session: ${data.pagesPerSession}
Return Visitors: ${data.returnVisitorRate}%
Uptime: ${Math.round(data.systemUptime / 3600)} hours

Provide insights about platform health and user experience.`;
  }

  buildRecommendationPrompt(data) {
    return `Based on these comprehensive e-commerce metrics, provide 1-2 actionable recommendations:

${JSON.stringify(data, null, 2)}

Focus on specific, implementable strategies for growth and optimization.`;
  }

  // Calculate confidence score based on data quality
  calculateConfidence(metrics) {
    let score = 0;
    let totalChecks = 0;

    // Check if we have recent data
    if (metrics.lastUpdated) {
      const hoursSinceUpdate = (new Date() - new Date(metrics.lastUpdated)) / (1000 * 60 * 60);
      if (hoursSinceUpdate < 24) score += 25;
      totalChecks += 25;
    }

    // Check data completeness
    const requiredFields = ['totalRevenue', 'activeUsers', 'conversionRate'];
    const presentFields = requiredFields.filter(field => metrics[field] !== undefined);
    score += (presentFields.length / requiredFields.length) * 50;
    totalChecks += 50;

    // Check data consistency
    if (metrics.totalRevenue > 0 && metrics.averageOrderValue > 0) {
      const expectedSales = Math.round(metrics.totalRevenue / metrics.averageOrderValue);
      if (Math.abs(expectedSales - metrics.totalSales) < expectedSales * 0.1) {
        score += 25;
      }
      totalChecks += 25;
    }

    return totalChecks > 0 ? Math.round((score / totalChecks) * 100) : 0;
  }

  // Mock insights for when API is not available
  getMockInsights(metrics) {
    return {
      insights: [
        this.getMockSalesInsight(metrics),
        this.getMockUserInsight(metrics),
        this.getMockPerformanceInsight(metrics),
        this.getMockRecommendation(metrics)
      ],
      generatedAt: new Date(),
      confidence: 75
    };
  }

  getMockSalesInsight(data) {
    const growth = data.revenueGrowth || 0;
    const topProduct = data.topSellingProducts?.[0]?.name || 'your products';
    
    let content = '';
    if (growth > 10) {
      content = `🚀 Sales are up ${growth}% this period! ${topProduct} is driving strong performance. Consider increasing inventory and marketing for this category.`;
    } else if (growth > 0) {
      content = `📈 Steady growth of ${growth}% in revenue. ${topProduct} remains your top performer. Focus on expanding successful product lines.`;
    } else {
      content = `📊 Revenue declined ${Math.abs(growth)}%. Consider promotional campaigns or product mix adjustments to boost sales.`;
    }

    return {
      type: 'sales',
      title: 'Sales Performance',
      content,
      priority: 'high',
      actionable: true,
      metrics: data
    };
  }

  getMockUserInsight(data) {
    const conversion = data.conversionRate || 0;
    const bounce = data.bounceRate || 0;
    
    let content = '';
    if (conversion > 3 && bounce < 40) {
      content = `👥 Excellent user engagement! ${conversion}% conversion rate with low bounce rate. Your user experience is optimized.`;
    } else if (bounce > 60) {
      content = `⚠️ High bounce rate of ${bounce}%. Consider improving page load speed and content relevance to retain users.`;
    } else {
      content = `📱 ${data.activeUsers} active users with ${conversion}% conversion. Focus on user retention strategies to improve engagement.`;
    }

    return {
      type: 'users',
      title: 'User Behavior',
      content,
      priority: 'medium',
      actionable: true,
      metrics: data
    };
  }

  getMockPerformanceInsight(data) {
    const pagesPerSession = data.pagesPerSession || 0;
    const returnRate = data.returnVisitorRate || 0;
    
    let content = '';
    if (pagesPerSession > 4 && returnRate > 30) {
      content = `⚡ Strong platform performance! Users are highly engaged with ${pagesPerSession} pages per session and ${returnRate}% return rate.`;
    } else if (pagesPerSession < 2) {
      content = `🔍 Users are viewing only ${pagesPerSession} pages per session. Consider improving navigation and content discovery.`;
    } else {
      content = `📊 Platform is performing well with ${data.pageViews} page views and healthy user engagement metrics.`;
    }

    return {
      type: 'performance',
      title: 'Platform Performance',
      content,
      priority: 'medium',
      actionable: false,
      metrics: data
    };
  }

  getMockRecommendation(data) {
    const recommendations = [
      `💡 Consider launching a flash sale on ${data.topSellingProducts?.[0]?.name || 'your top products'} to boost revenue by 20-30%.`,
      `🎯 Implement email marketing campaigns to re-engage ${data.totalUsers - data.activeUsers} inactive users.`,
      `📱 Optimize mobile experience - ${data.bounceRate}% bounce rate suggests room for improvement.`,
      `🔄 Set up automated follow-up emails for users who added items to cart but didn't complete purchase.`,
      `📊 A/B test your product pages to improve the ${data.conversionRate}% conversion rate.`
    ];

    const randomRecommendation = recommendations[Math.floor(Math.random() * recommendations.length)];

    return {
      type: 'recommendation',
      title: 'AI Recommendation',
      content: randomRecommendation,
      priority: 'high',
      actionable: true,
      category: 'optimization'
    };
  }
}

module.exports = new AIInsightsService();
