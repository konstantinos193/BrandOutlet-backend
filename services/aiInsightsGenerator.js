const axios = require('axios');
const comprehensiveDataService = require('./comprehensiveDataService');

class AIInsightsGenerator {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.useOpenAI = !!this.openaiApiKey;
    this.useHuggingFace = !!this.huggingFaceApiKey;
    
    // Enhanced Hugging Face models for better insights
    this.models = {
      sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      summarization: 'facebook/bart-large-cnn',
      emotion: 'cardiffnlp/twitter-roberta-base-emotion',
      classification: 'distilbert-base-uncased-finetuned-sst-2-english',
      multilingual: 'nlptown/bert-base-multilingual-uncased-sentiment'
    };
    
    if (!this.openaiApiKey && !this.huggingFaceApiKey) {
      console.warn('⚠️ No AI API keys found. AI insights will use rule-based generation.');
    }
  }

  // Generate AI-powered insights from comprehensive data
  async generateAIInsights(realData = null, focus = 'all') {
    try {
      // Get comprehensive data if not provided
      if (!realData) {
        console.log('📊 Gathering comprehensive data for AI insights...');
        realData = await comprehensiveDataService.getComprehensiveData();
      }

      if (this.useOpenAI) {
        console.log('Using OpenAI for AI insights generation');
        return await this.generateWithOpenAI(realData, focus);
      } else if (this.useHuggingFace) {
        console.log('Using Hugging Face for AI insights generation');
        return await this.generateWithHuggingFace(realData, focus);
      } else {
        console.log('No AI API keys available, using rule-based insights');
        return await this.generateRuleBasedInsights(realData, focus);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      console.log('Falling back to rule-based insights due to error');
      return await this.generateRuleBasedInsights(realData, focus);
    }
  }

  // Generate insights using OpenAI API
  async generateWithOpenAI(realData, focus) {
    const prompt = this.buildOpenAIPrompt(realData, focus);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce analyst. Analyze the provided data and generate actionable business insights. Be specific, data-driven, and provide clear recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    return this.parseAIResponse(aiResponse, realData, focus);
  }

  // Generate insights using Hugging Face API
  async generateWithHuggingFace(realData, focus) {
    const prompt = this.buildHuggingFacePrompt(realData, focus);
    
    // Try multiple working models in order of preference (updated for 2024)
    const models = [
      'gpt2',                       // Most reliable and widely available
      'distilgpt2',                 // Smaller, faster GPT-2 variant
      'microsoft/DialoGPT-medium',  // Keep as fallback
      'facebook/blenderbot-400M-distill'  // Last resort
    ];
    
    let lastError = null;
    
    for (const model of models) {
      try {
        console.log(`Trying Hugging Face model: ${model}`);
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            inputs: prompt,
            parameters: {
              max_length: 500,
              temperature: 0.7,
              do_sample: true,
              top_p: 0.9,
              repetition_penalty: 1.1,
              return_full_text: false
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.huggingFaceApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        const aiResponse = response.data[0]?.generated_text || response.data[0]?.text || response.data || 'Unable to generate insight.';
        console.log(`Successfully generated response with model ${model}`);
        return this.parseAIResponse(aiResponse, realData, focus);
      } catch (error) {
        console.warn(`Failed to use model ${model}:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // If all models fail, fall back to rule-based insights
    console.warn('All Hugging Face models failed, falling back to rule-based insights');
    return await this.generateRuleBasedInsights(realData, focus);
  }

  // Enhanced sentiment analysis for customer feedback
  async analyzeCustomerSentiment(feedbackText) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.models.sentiment}`,
        {
          inputs: feedbackText,
          parameters: {
            return_all_scores: true
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

      const scores = response.data[0];
      const topSentiment = scores.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );

      return {
        sentiment: topSentiment.label,
        confidence: topSentiment.score,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate text summaries for insights
  async generateInsightSummary(insightData) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.models.summarization}`,
        {
          inputs: insightData,
          parameters: {
            max_length: 150,
            min_length: 30,
            do_sample: false
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

      return response.data[0]?.summary_text || insightData;
    } catch (error) {
      console.error('Error generating summary:', error);
      return insightData; // Return original data if summarization fails
    }
  }

  // Analyze customer emotions from feedback
  async analyzeCustomerEmotions(feedbackText) {
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${this.models.emotion}`,
        {
          inputs: feedbackText,
          parameters: {
            return_all_scores: true
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

      const scores = response.data[0];
      const topEmotion = scores.reduce((prev, current) => 
        (prev.score > current.score) ? prev : current
      );

      return {
        emotion: topEmotion.label,
        confidence: topEmotion.score,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing emotions:', error);
      return {
        emotion: 'neutral',
        confidence: 0.5,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Build comprehensive prompt for OpenAI with all data sources
  buildOpenAIPrompt(realData, focus) {
    const { 
      products, users, sales, seo, geolocation, performance, 
      inventory, search, pageTracking, userPreferences, 
      realTime, financial 
    } = realData;
    
    let prompt = `Analyze this comprehensive e-commerce data and provide 5-7 actionable business insights:\n\n`;
    
    // Product data
    prompt += `PRODUCT DATA:\n`;
    prompt += `- Total Products: ${products.totalProducts || 0}\n`;
    prompt += `- Active Products: ${products.activeProducts || 0} (${products.activeProductRate || 0}%)\n`;
    prompt += `- Recent Products (7 days): ${products.recentProducts || 0}\n`;
    prompt += `- Average Price: $${products.priceStats?.avgPrice?.toFixed(2) || 'N/A'}\n`;
    prompt += `- Price Range: $${products.priceStats?.minPrice || 'N/A'} - $${products.priceStats?.maxPrice || 'N/A'}\n`;
    prompt += `- Total Stock Value: $${products.stockStats?.totalValue?.toLocaleString() || 'N/A'}\n`;
    prompt += `- Out of Stock: ${products.stockStats?.outOfStock || 0}\n`;
    prompt += `- Low Stock: ${products.stockStats?.lowStock || 0}\n\n`;
    
    // User data
    prompt += `USER DATA:\n`;
    prompt += `- Total Users: ${users.totalUsers || 0}\n`;
    prompt += `- Active Users: ${users.activeUsers || 0}\n`;
    prompt += `- New Users Today: ${users.newUsersToday || 0}\n`;
    prompt += `- New Users This Week: ${users.newUsersThisWeek || 0}\n`;
    prompt += `- New Users This Month: ${users.newUsersThisMonth || 0}\n`;
    prompt += `- User Growth Rate: ${users.userGrowthRate || 0}%\n`;
    if (users.demographics && users.demographics.length > 0) {
      prompt += `- Top Gender: ${users.demographics[0]?._id || 'N/A'} (${users.demographics[0]?.count || 0})\n`;
    }
    if (users.behavior && users.behavior.length > 0) {
      prompt += `- Avg Session Duration: ${users.behavior[0]?.averageSessionDuration?.toFixed(1) || 'N/A'}s\n`;
      prompt += `- Avg Pages per Session: ${users.behavior[0]?.averagePagesPerSession?.toFixed(1) || 'N/A'}\n`;
    }
    prompt += `\n`;
    
    // Sales data
    prompt += `SALES DATA:\n`;
    prompt += `- Total Sales: ${sales.totalSales || 0}\n`;
    prompt += `- Total Revenue: $${sales.totalRevenue?.toLocaleString() || 'N/A'}\n`;
    prompt += `- Average Order Value: $${sales.averageOrderValue?.toFixed(2) || 'N/A'}\n`;
    prompt += `- Revenue This Month: $${sales.revenueThisMonth?.toLocaleString() || 'N/A'}\n`;
    prompt += `- Revenue Last Month: $${sales.revenueLastMonth?.toLocaleString() || 'N/A'}\n`;
    prompt += `- Revenue Growth: ${sales.revenueGrowth || 0}%\n`;
    if (sales.conversionFunnel) {
      prompt += `- Conversion Rate: ${sales.conversionFunnel.conversionRate || 0}%\n`;
      prompt += `- Visitors: ${sales.conversionFunnel.visitors || 0}\n`;
      prompt += `- Add to Cart: ${sales.conversionFunnel.addToCart || 0}\n`;
      prompt += `- Checkout: ${sales.conversionFunnel.checkout || 0}\n`;
      prompt += `- Completed: ${sales.conversionFunnel.completed || 0}\n`;
    }
    prompt += `\n`;
    
    // SEO data
    if (seo.metrics && Object.keys(seo.metrics).length > 0) {
      prompt += `SEO PERFORMANCE:\n`;
      prompt += `- Total Metrics Tracked: ${Object.keys(seo.metrics).length}\n`;
      if (seo.coreWebVitals) {
        prompt += `- Core Web Vitals: Available\n`;
      }
      if (seo.keywordRankings && seo.keywordRankings.length > 0) {
        prompt += `- Top Keyword: ${seo.keywordRankings[0]?.keyword || 'N/A'} (Position: ${seo.keywordRankings[0]?.position || 'N/A'})\n`;
      }
      if (seo.pagePerformance && seo.pagePerformance.length > 0) {
        prompt += `- Top Performing Page: ${seo.pagePerformance[0]?._id || 'N/A'} (${seo.pagePerformance[0]?.views || 0} views)\n`;
      }
      prompt += `\n`;
    }
    
    // Geolocation data
    if (geolocation.trafficByCountry && geolocation.trafficByCountry.length > 0) {
      prompt += `GEOGRAPHIC DATA:\n`;
      prompt += `- Top Country: ${geolocation.trafficByCountry[0]?.country || 'N/A'} (${geolocation.trafficByCountry[0]?.count || 0} visits)\n`;
      if (geolocation.trafficByCity && geolocation.trafficByCity.length > 0) {
        prompt += `- Top City: ${geolocation.trafficByCity[0]?.city || 'N/A'} (${geolocation.trafficByCity[0]?.count || 0} visits)\n`;
      }
      if (geolocation.timezoneDistribution && geolocation.timezoneDistribution.length > 0) {
        prompt += `- Top Timezone: ${geolocation.timezoneDistribution[0]?.timezone || 'N/A'} (${geolocation.timezoneDistribution[0]?.count || 0} users)\n`;
      }
      prompt += `\n`;
    }
    
    // Performance data
    if (performance.pageLoadTimes && performance.pageLoadTimes.length > 0) {
      prompt += `PERFORMANCE DATA:\n`;
      prompt += `- Avg Page Load Time: ${performance.pageLoadTimes[0]?.avgLoadTime?.toFixed(2) || 'N/A'}s\n`;
      if (performance.coreWebVitals) {
        prompt += `- Core Web Vitals: Available\n`;
      }
      if (performance.server) {
        prompt += `- Server Performance: Available\n`;
      }
      prompt += `\n`;
    }
    
    // Inventory data
    if (inventory.metrics && inventory.metrics.length > 0) {
      prompt += `INVENTORY DATA:\n`;
      prompt += `- Total Inventory Items: ${inventory.metrics[0]?.totalProducts || 0}\n`;
      prompt += `- Total Inventory Value: $${inventory.metrics[0]?.totalValue?.toLocaleString() || 'N/A'}\n`;
      prompt += `- Low Stock Items: ${inventory.metrics[0]?.lowStockCount || 0}\n`;
      prompt += `- Out of Stock Items: ${inventory.metrics[0]?.outOfStockCount || 0}\n`;
      if (inventory.supplierPerformance && inventory.supplierPerformance.length > 0) {
        prompt += `- Top Supplier: ${inventory.supplierPerformance[0]?.name || 'N/A'} (Rating: ${inventory.supplierPerformance[0]?.rating || 'N/A'})\n`;
      }
      prompt += `\n`;
    }
    
    // Search data
    if (search.queries && search.queries.length > 0) {
      prompt += `SEARCH DATA:\n`;
      prompt += `- Top Search Query: "${search.queries[0]?._id || 'N/A'}" (${search.queries[0]?.count || 0} searches)\n`;
      if (search.performance && search.performance.length > 0) {
        prompt += `- Total Searches: ${search.performance[0]?.totalSearches || 0}\n`;
        prompt += `- Avg Search Time: ${search.performance[0]?.avgSearchTime?.toFixed(2) || 'N/A'}s\n`;
        prompt += `- No Results Rate: ${search.performance[0]?.noResultsCount || 0}\n`;
      }
      prompt += `\n`;
    }
    
    // Page tracking data
    if (pageTracking.popularPages && pageTracking.popularPages.length > 0) {
      prompt += `PAGE TRACKING:\n`;
      prompt += `- Total Page Views: ${pageTracking.pageViews || 0}\n`;
      prompt += `- Most Popular Page: ${pageTracking.popularPages[0]?._id || 'N/A'} (${pageTracking.popularPages[0]?.views || 0} views)\n`;
      if (pageTracking.performance && pageTracking.performance.length > 0) {
        prompt += `- Avg Time on Page: ${pageTracking.performance[0]?.avgTimeOnPage?.toFixed(1) || 'N/A'}s\n`;
        prompt += `- Avg Bounce Rate: ${pageTracking.performance[0]?.bounceRate?.toFixed(1) || 'N/A'}%\n`;
      }
      prompt += `\n`;
    }
    
    // User preferences
    if (userPreferences.genderDistribution && userPreferences.genderDistribution.length > 0) {
      prompt += `USER PREFERENCES:\n`;
      prompt += `- Top Gender: ${userPreferences.genderDistribution[0]?._id || 'N/A'} (${userPreferences.genderDistribution[0]?.count || 0})\n`;
      if (userPreferences.sizeDistribution && userPreferences.sizeDistribution.length > 0) {
        prompt += `- Top Size: ${userPreferences.sizeDistribution[0]?._id || 'N/A'} (${userPreferences.sizeDistribution[0]?.count || 0})\n`;
      }
      if (userPreferences.personalization && userPreferences.personalization.length > 0) {
        prompt += `- Total Users with Preferences: ${userPreferences.personalization[0]?.totalUsers || 0}\n`;
        prompt += `- Completion Rate: ${userPreferences.personalization[0]?.completionRate?.toFixed(1) || 'N/A'}%\n`;
      }
      prompt += `\n`;
    }
    
    // Real-time data
    if (realTime.currentUsers !== undefined) {
      prompt += `REAL-TIME DATA:\n`;
      prompt += `- Current Online Users: ${realTime.currentUsers || 0}\n`;
      prompt += `- Current Sessions: ${realTime.currentSessions || 0}\n`;
      if (realTime.sales) {
        prompt += `- Sales Last Hour: ${realTime.sales.totalSales || 0}\n`;
        prompt += `- Revenue Last Hour: $${realTime.sales.totalRevenue?.toLocaleString() || 'N/A'}\n`;
      }
      prompt += `\n`;
    }
    
    // Financial data
    if (financial.revenue) {
      prompt += `FINANCIAL DATA:\n`;
      prompt += `- Total Revenue: $${financial.revenue.total?.toLocaleString() || 'N/A'}\n`;
      prompt += `- This Month Revenue: $${financial.revenue.thisMonth?.toLocaleString() || 'N/A'}\n`;
      prompt += `- Revenue Growth: ${financial.revenue.growth || 0}%\n`;
      if (financial.margins) {
        prompt += `- Profit Margin: ${financial.margins.margin || 0}%\n`;
        prompt += `- Total Profit: $${financial.margins.profit?.toLocaleString() || 'N/A'}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `Focus Area: ${focus}\n\n`;
    prompt += `Provide 5-7 specific, actionable insights with priority levels (high/medium/low) and confidence scores (0-100). Consider all data sources including SEO, geolocation, performance, inventory, search, and financial metrics. Format as JSON with this structure:
    {
      "insights": [
        {
          "title": "Insight Title",
          "content": "Detailed insight description with specific data points and recommendations",
          "priority": "high|medium|low",
          "confidence": 85,
          "category": "sales|users|performance|inventory|marketing|seo|geographic|financial",
          "actionable": true,
          "metrics": {
            "key": "value"
          },
          "recommendations": ["action1", "action2"]
        }
      ],
      "overallConfidence": 80,
      "dataQuality": "comprehensive",
      "sources": ["products", "users", "sales", "seo", "geolocation", "performance", "inventory", "search", "financial"]
    }`;

    return prompt;
  }

  // Build prompt for Hugging Face (using comprehensive data structure)
  buildHuggingFacePrompt(realData, focus) {
    const { 
      products, users, sales, seo, geolocation, performance, 
      inventory, search, pageTracking, userPreferences, 
      realTime, financial 
    } = realData;
    
    let prompt = `E-commerce Business Analysis Report\n\n`;
    
    // Product metrics
    prompt += `PRODUCT METRICS:\n`;
    prompt += `- Total Products: ${products.totalProducts || 0}\n`;
    prompt += `- Active Products: ${products.activeProducts || 0}\n`;
    prompt += `- Active Product Rate: ${products.activeProductRate || 0}%\n`;
    prompt += `- Recent Products (7 days): ${products.recentProducts || 0}\n`;
    prompt += `- Average Price: $${products.priceStats?.avgPrice?.toFixed(2) || 'N/A'}\n`;
    prompt += `- Total Stock Value: $${products.stockStats?.totalValue?.toLocaleString() || 'N/A'}\n`;
    prompt += `- Out of Stock: ${products.stockStats?.outOfStock || 0}\n`;
    prompt += `- Low Stock: ${products.stockStats?.lowStock || 0}\n\n`;
    
    // User metrics
    prompt += `USER METRICS:\n`;
    prompt += `- Total Users: ${users.totalUsers || 0}\n`;
    prompt += `- Active Users: ${users.activeUsers || 0}\n`;
    prompt += `- New Users Today: ${users.newUsersToday || 0}\n`;
    prompt += `- User Growth Rate: ${users.userGrowthRate || 0}%\n`;
    if (users.demographics && users.demographics.length > 0) {
      prompt += `- Top Gender: ${users.demographics[0]?._id || 'N/A'} (${users.demographics[0]?.count || 0})\n`;
    }
    prompt += `\n`;
    
    // Sales metrics
    prompt += `SALES METRICS:\n`;
    prompt += `- Total Sales: ${sales.totalSales || 0}\n`;
    prompt += `- Total Revenue: $${sales.totalRevenue?.toLocaleString() || 'N/A'}\n`;
    prompt += `- Average Order Value: $${sales.averageOrderValue?.toFixed(2) || 'N/A'}\n`;
    prompt += `- Revenue Growth: ${sales.revenueGrowth || 0}%\n`;
    if (sales.conversionFunnel) {
      prompt += `- Conversion Rate: ${sales.conversionFunnel.conversionRate || 0}%\n`;
    }
    prompt += `\n`;
    
    // SEO metrics if available
    if (seo.metrics && Object.keys(seo.metrics).length > 0) {
      prompt += `SEO PERFORMANCE:\n`;
      prompt += `- Total Metrics Tracked: ${Object.keys(seo.metrics).length}\n`;
      if (seo.coreWebVitals) {
        prompt += `- Core Web Vitals: Available\n`;
      }
      prompt += `\n`;
    }
    
    // Geolocation data
    if (geolocation.trafficByCountry && geolocation.trafficByCountry.length > 0) {
      prompt += `GEOGRAPHIC DATA:\n`;
      prompt += `- Top Country: ${geolocation.trafficByCountry[0]?.country || 'N/A'} (${geolocation.trafficByCountry[0]?.count || 0} visits)\n`;
      if (geolocation.trafficByCity && geolocation.trafficByCity.length > 0) {
        prompt += `- Top City: ${geolocation.trafficByCity[0]?.city || 'N/A'} (${geolocation.trafficByCity[0]?.count || 0} visits)\n`;
      }
      prompt += `\n`;
    }
    
    // Performance data
    if (performance.pageLoadTimes && performance.pageLoadTimes.length > 0) {
      prompt += `PERFORMANCE DATA:\n`;
      prompt += `- Avg Page Load Time: ${performance.pageLoadTimes[0]?.avgLoadTime?.toFixed(2) || 'N/A'}s\n`;
      prompt += `\n`;
    }
    
    // Inventory data
    if (inventory.metrics && inventory.metrics.length > 0) {
      prompt += `INVENTORY DATA:\n`;
      prompt += `- Total Inventory Items: ${inventory.metrics[0]?.totalProducts || 0}\n`;
      prompt += `- Total Inventory Value: $${inventory.metrics[0]?.totalValue?.toLocaleString() || 'N/A'}\n`;
      prompt += `- Low Stock Items: ${inventory.metrics[0]?.lowStockCount || 0}\n`;
      prompt += `- Out of Stock Items: ${inventory.metrics[0]?.outOfStockCount || 0}\n`;
      prompt += `\n`;
    }
    
    // Search data
    if (search.queries && search.queries.length > 0) {
      prompt += `SEARCH DATA:\n`;
      prompt += `- Top Search Query: "${search.queries[0]?._id || 'N/A'}" (${search.queries[0]?.count || 0} searches)\n`;
      prompt += `\n`;
    }
    
    // Page tracking data
    if (pageTracking.popularPages && pageTracking.popularPages.length > 0) {
      prompt += `PAGE TRACKING:\n`;
      prompt += `- Total Page Views: ${pageTracking.pageViews || 0}\n`;
      prompt += `- Most Popular Page: ${pageTracking.popularPages[0]?._id || 'N/A'} (${pageTracking.popularPages[0]?.views || 0} views)\n`;
      prompt += `\n`;
    }
    
    // User preferences
    if (userPreferences.genderDistribution && userPreferences.genderDistribution.length > 0) {
      prompt += `USER PREFERENCES:\n`;
      prompt += `- Top Gender: ${userPreferences.genderDistribution[0]?._id || 'N/A'} (${userPreferences.genderDistribution[0]?.count || 0})\n`;
      if (userPreferences.sizeDistribution && userPreferences.sizeDistribution.length > 0) {
        prompt += `- Top Size: ${userPreferences.sizeDistribution[0]?._id || 'N/A'} (${userPreferences.sizeDistribution[0]?.count || 0})\n`;
      }
      prompt += `\n`;
    }
    
    // Real-time data
    if (realTime.currentUsers !== undefined) {
      prompt += `REAL-TIME DATA:\n`;
      prompt += `- Current Online Users: ${realTime.currentUsers || 0}\n`;
      prompt += `- Current Sessions: ${realTime.currentSessions || 0}\n`;
      prompt += `\n`;
    }
    
    // Financial data
    if (financial.revenue) {
      prompt += `FINANCIAL DATA:\n`;
      prompt += `- Total Revenue: $${financial.revenue.total?.toLocaleString() || 'N/A'}\n`;
      prompt += `- Revenue Growth: ${financial.revenue.growth || 0}%\n`;
      if (financial.margins) {
        prompt += `- Profit Margin: ${financial.margins.margin || 0}%\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `FOCUS AREA: ${focus}\n\n`;
    prompt += `Based on this comprehensive data, provide 3-5 specific, actionable business insights. Each insight should include:\n`;
    prompt += `1. A clear title\n`;
    prompt += `2. Specific data points and analysis\n`;
    prompt += `3. Actionable recommendations\n`;
    prompt += `4. Priority level (High/Medium/Low)\n\n`;
    prompt += `Format your response as numbered insights with clear structure.`;
    
    return prompt;
  }

  // Parse AI response into structured format
  parseAIResponse(aiResponse, realData, focus) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);
      if (parsed.insights && Array.isArray(parsed.insights)) {
        return {
          insights: parsed.insights.map(insight => ({
            ...insight,
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: this.mapCategoryToType(insight.category),
            generatedAt: new Date().toISOString()
          })),
          generatedAt: new Date().toISOString(),
          confidence: parsed.overallConfidence || 75,
          totalInsights: parsed.insights.length,
          focus,
          categories: this.getInsightCategories(parsed.insights),
          dataSource: 'ai'
        };
      }
    } catch (error) {
      console.log('Failed to parse AI response as JSON, using text parsing');
    }

    // Fallback: parse as text
    return this.parseTextResponse(aiResponse, realData, focus);
  }

  // Parse text response into structured format
  parseTextResponse(text, realData, focus) {
    const insights = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentInsight = null;
    let insightCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for insight titles (numbers, bullets, or capitalized phrases)
      if (trimmed.length > 10 && trimmed.length < 150 && 
          (trimmed.match(/^\d+\./) || trimmed.match(/^[-*•]/) || 
           trimmed.match(/^[A-Z][^.!?]*$/) || trimmed.match(/^Insight/))) {
        
        if (currentInsight) {
          insights.push(currentInsight);
        }
        
        // Extract title and determine priority
        let title = trimmed.replace(/^\d+\.\s*/, '').replace(/^[-*•]\s*/, '');
        let priority = 'medium';
        
        // Determine priority from title content
        if (title.toLowerCase().includes('urgent') || title.toLowerCase().includes('critical') || 
            title.toLowerCase().includes('immediate') || title.toLowerCase().includes('high')) {
          priority = 'high';
        } else if (title.toLowerCase().includes('low') || title.toLowerCase().includes('minor')) {
          priority = 'low';
        }
        
        // Determine category from title content
        let category = 'general';
        if (title.toLowerCase().includes('stock') || title.toLowerCase().includes('inventory')) {
          category = 'inventory';
        } else if (title.toLowerCase().includes('traffic') || title.toLowerCase().includes('visitor')) {
          category = 'performance';
        } else if (title.toLowerCase().includes('product') || title.toLowerCase().includes('sales')) {
          category = 'sales';
        } else if (title.toLowerCase().includes('user') || title.toLowerCase().includes('customer')) {
          category = 'users';
        } else if (title.toLowerCase().includes('seo') || title.toLowerCase().includes('performance')) {
          category = 'marketing';
        }
        
        currentInsight = {
          id: `ai-${Date.now()}-${insightCount++}`,
          title: title,
          content: '',
          priority: priority,
          confidence: 75,
          actionable: true,
          category: category,
          type: this.mapCategoryToType(category),
          generatedAt: new Date().toISOString()
        };
      } else if (currentInsight && trimmed.length > 15) {
        // This is likely content for the current insight
        currentInsight.content += (currentInsight.content ? ' ' : '') + trimmed;
      }
    }

    if (currentInsight) {
      insights.push(currentInsight);
    }

    // If no structured insights found, create a general insight from the text
    if (insights.length === 0 && text.length > 50) {
      insights.push({
        id: `ai-${Date.now()}-0`,
        title: 'AI Generated Business Insight',
        content: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        priority: 'medium',
        confidence: 65,
        actionable: true,
        category: 'general',
        type: 'recommendation',
        generatedAt: new Date().toISOString()
      });
    }

    return {
      insights: insights.slice(0, 5), // Limit to 5 insights
      generatedAt: new Date().toISOString(),
      confidence: 70,
      totalInsights: insights.length,
      focus,
      categories: this.getInsightCategories(insights),
      dataSource: 'ai'
    };
  }

  // Generate rule-based insights as fallback
  async generateRuleBasedInsights(realData, focus) {
    const insights = [];
    const { 
      products, users, sales, seo, geolocation, performance, 
      inventory, search, pageTracking, userPreferences, 
      realTime, financial 
    } = realData;

    // High-priority insights based on data patterns
    // Removed product verification insight as it doesn't apply to admin-managed products
    
    // Check for low product count instead
    if (products.totalProducts < 10) {
      insights.push({
        id: `rule-${Date.now()}-1`,
        title: 'Low Product Count',
        content: `You currently have ${products.totalProducts} products in your catalog. Consider adding more products to increase variety and attract more customers.`,
        priority: 'medium',
        confidence: 90,
        actionable: true,
        category: 'inventory',
        type: 'sales',
        metrics: {
          currentCount: products.totalProducts,
          recommended: '50+',
          impact: 'Medium'
        }
      });
    }

    if (products.stockStats && products.stockStats.outOfStock > 0) {
      const outOfStockRate = (products.stockStats.outOfStock / products.totalProducts) * 100;
      if (outOfStockRate > 10) {
        insights.push({
          id: `rule-${Date.now()}-2`,
          title: 'High Out-of-Stock Rate',
          content: `${products.stockStats.outOfStock} products (${outOfStockRate.toFixed(1)}%) are out of stock. This represents significant lost revenue potential.`,
          priority: 'high',
          confidence: 90,
          actionable: true,
          category: 'inventory',
          type: 'sales',
          metrics: {
            outOfStock: products.stockStats.outOfStock,
            percentage: outOfStockRate.toFixed(1) + '%',
            totalProducts: products.totalProducts
          }
        });
      }
    }

    // Check for low stock products
    if (products.stockStats && products.stockStats.lowStock > 0) {
      const lowStockRate = (products.stockStats.lowStock / products.totalProducts) * 100;
      if (lowStockRate > 20) {
        insights.push({
          id: `rule-${Date.now()}-3`,
          title: 'High Low-Stock Alert',
          content: `${products.stockStats.lowStock} products are running low on stock. Consider restocking popular items to avoid stockouts.`,
          priority: 'medium',
          confidence: 85,
          actionable: true,
          category: 'inventory',
          type: 'sales',
          metrics: {
            lowStock: products.stockStats.lowStock,
            percentage: lowStockRate.toFixed(1) + '%',
            totalProducts: products.totalProducts
          }
        });
      }
    }

    // Check for pricing opportunities
    if (products.priceStats && products.priceStats.avgPrice > 0) {
      const priceRange = products.priceStats.maxPrice - products.priceStats.minPrice;
      const avgPrice = products.priceStats.avgPrice;
      
      if (priceRange > avgPrice * 2) {
        insights.push({
          id: `rule-${Date.now()}-4`,
          title: 'Wide Price Range Detected',
          content: `Your products have a wide price range (€${products.priceStats.minPrice} - €${products.priceStats.maxPrice}). Consider adding more mid-range products to capture different customer segments.`,
          priority: 'low',
          confidence: 80,
          actionable: true,
          category: 'pricing',
          type: 'sales',
          metrics: {
            minPrice: '€' + products.priceStats.minPrice,
            maxPrice: '€' + products.priceStats.maxPrice,
            avgPrice: '€' + Math.round(avgPrice),
            range: '€' + priceRange
          }
        });
      }
    }

    // User growth insights
    if (users.userGrowthRate < 0) {
      insights.push({
        id: `rule-${Date.now()}-5`,
        title: 'Declining User Growth',
        content: `User growth rate is negative (${users.userGrowthRate}%). Consider implementing user acquisition strategies or improving user retention.`,
        priority: 'high',
        confidence: 85,
        actionable: true,
        category: 'users',
        type: 'users',
        metrics: {
          growthRate: users.userGrowthRate + '%',
          totalUsers: users.totalUsers,
          activeUsers: users.activeUsers
        }
      });
    }

    // Sales performance insights
    if (sales.revenueGrowth < 0) {
      insights.push({
        id: `rule-${Date.now()}-6`,
        title: 'Declining Revenue',
        content: `Revenue growth is negative (${sales.revenueGrowth}%). Review pricing strategy, product mix, or marketing efforts.`,
        priority: 'high',
        confidence: 90,
        actionable: true,
        category: 'sales',
        type: 'sales',
        metrics: {
          revenueGrowth: sales.revenueGrowth + '%',
          totalRevenue: '$' + (sales.totalRevenue || 0).toLocaleString(),
          averageOrderValue: '$' + (sales.averageOrderValue || 0).toFixed(2)
        }
      });
    }

    // SEO performance insights
    if (seo.metrics && Object.keys(seo.metrics).length === 0) {
      insights.push({
        id: `rule-${Date.now()}-7`,
        title: 'No SEO Data Available',
        content: `No SEO metrics are being tracked. Consider implementing SEO monitoring to improve search visibility and organic traffic.`,
        priority: 'medium',
        confidence: 80,
        actionable: true,
        category: 'seo',
        type: 'performance',
        metrics: {
          trackedMetrics: 0,
          recommendation: 'Implement SEO tracking'
        }
      });
    }

    // Performance insights
    if (performance.pageLoadTimes && performance.pageLoadTimes.length > 0) {
      const avgLoadTime = performance.pageLoadTimes[0]?.avgLoadTime || 0;
      if (avgLoadTime > 3) {
        insights.push({
          id: `rule-${Date.now()}-8`,
          title: 'Slow Page Load Times',
          content: `Average page load time is ${avgLoadTime.toFixed(2)}s, which may impact user experience and SEO. Consider optimizing images, code, or server performance.`,
          priority: 'medium',
          confidence: 85,
          actionable: true,
          category: 'performance',
          type: 'performance',
          metrics: {
            avgLoadTime: avgLoadTime.toFixed(2) + 's',
            recommendation: 'Optimize performance'
          }
        });
      }
    }

    // AI-Enhanced Customer Sentiment Insights (if we have feedback data)
    if (realData.customerFeedback && realData.customerFeedback.length > 0) {
      try {
        const recentFeedback = realData.customerFeedback.slice(-10); // Last 10 feedback items
        const feedbackText = recentFeedback.map(f => f.text || f.comment || f.review).join(' ');
        
        if (feedbackText.trim()) {
          const sentimentAnalysis = await this.analyzeCustomerSentiment(feedbackText);
          const emotionAnalysis = await this.analyzeCustomerEmotions(feedbackText);
          
          if (sentimentAnalysis.sentiment === 'negative' && sentimentAnalysis.confidence > 0.7) {
            insights.push({
              id: `ai-${Date.now()}-1`,
              title: 'Negative Customer Sentiment Detected',
              content: `Recent customer feedback shows negative sentiment (${sentimentAnalysis.confidence.toFixed(2)} confidence). Primary emotion: ${emotionAnalysis.emotion}. Consider addressing customer concerns promptly.`,
              priority: 'high',
              confidence: Math.round(sentimentAnalysis.confidence * 100),
              actionable: true,
              category: 'customer',
              type: 'users',
              metrics: {
                sentiment: sentimentAnalysis.sentiment,
                confidence: Math.round(sentimentAnalysis.confidence * 100) + '%',
                emotion: emotionAnalysis.emotion,
                feedbackCount: recentFeedback.length
              }
            });
          } else if (sentimentAnalysis.sentiment === 'positive' && sentimentAnalysis.confidence > 0.8) {
            insights.push({
              id: `ai-${Date.now()}-2`,
              title: 'Positive Customer Sentiment',
              content: `Recent customer feedback shows positive sentiment (${sentimentAnalysis.confidence.toFixed(2)} confidence). Primary emotion: ${emotionAnalysis.emotion}. Great job maintaining customer satisfaction!`,
              priority: 'low',
              confidence: Math.round(sentimentAnalysis.confidence * 100),
              actionable: false,
              category: 'customer',
              type: 'users',
              metrics: {
                sentiment: sentimentAnalysis.sentiment,
                confidence: Math.round(sentimentAnalysis.confidence * 100) + '%',
                emotion: emotionAnalysis.emotion,
                feedbackCount: recentFeedback.length
              }
            });
          }
        }
      } catch (error) {
        console.error('Error processing customer sentiment:', error);
      }
    }

    if (pageTracking.growthRate < -20) {
      insights.push({
        id: `rule-${Date.now()}-5`,
        title: 'Significant Traffic Decline',
        content: `Page views decreased by ${Math.abs(pageTracking.growthRate)}% compared to yesterday. This requires immediate attention to identify and resolve the issue.`,
        priority: 'high',
        confidence: 85,
        actionable: true,
        category: 'performance',
        type: 'users',
        metrics: {
          declineRate: Math.abs(pageTracking.growthRate) + '%',
          todayViews: pageTracking.today.pageViews,
          yesterdayViews: pageTracking.yesterday.pageViews
        }
      });
    }

    return {
      insights,
      generatedAt: new Date().toISOString(),
      confidence: 80,
      totalInsights: insights.length,
      focus,
      categories: this.getInsightCategories(insights),
      dataSource: 'rule-based'
    };
  }

  // Helper methods
  mapCategoryToType(category) {
    const mapping = {
      'sales': 'sales',
      'users': 'users',
      'performance': 'performance',
      'inventory': 'inventory',
      'marketing': 'marketing',
      'verification': 'sales',
      'general': 'recommendation'
    };
    return mapping[category] || 'recommendation';
  }

  getInsightCategories(insights) {
    const categories = {};
    insights.forEach(insight => {
      if (!categories[insight.category]) {
        categories[insight.category] = 0;
      }
      categories[insight.category]++;
    });
    return categories;
  }
}

module.exports = new AIInsightsGenerator();
