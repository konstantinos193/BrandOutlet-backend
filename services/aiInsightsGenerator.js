const axios = require('axios');

class AIInsightsGenerator {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.useOpenAI = !!this.openaiApiKey;
    this.useHuggingFace = !!this.huggingFaceApiKey;
    
    if (!this.openaiApiKey && !this.huggingFaceApiKey) {
      console.warn('⚠️ No AI API keys found. AI insights will use rule-based generation.');
    }
  }

  // Generate AI-powered insights from real data
  async generateAIInsights(realData, focus = 'all') {
    try {
      if (this.useOpenAI) {
        return await this.generateWithOpenAI(realData, focus);
      } else if (this.useHuggingFace) {
        return await this.generateWithHuggingFace(realData, focus);
      } else {
        return await this.generateRuleBasedInsights(realData, focus);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
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
    
    // Try multiple working models in order of preference
    const models = [
      'microsoft/DialoGPT-medium',
      'facebook/blenderbot-400M-distill',
      'gpt2',
      'distilgpt2'
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

  // Build comprehensive prompt for OpenAI
  buildOpenAIPrompt(realData, focus) {
    const { products, variants, pageTracking, seo, userPreferences } = realData;
    
    let prompt = `Analyze this e-commerce data and provide 3-5 actionable business insights:\n\n`;
    
    // Product data
    prompt += `PRODUCT DATA:\n`;
    prompt += `- Total Products: ${products.totalProducts}\n`;
    prompt += `- Active Products: ${products.activeProducts}\n`;
    prompt += `- Verified Products: ${products.verifiedProducts} (${products.verificationRate}%)\n`;
    prompt += `- Recent Products (7 days): ${products.recentProducts}\n`;
    prompt += `- Average Price: $${products.priceStats.avgPrice?.toFixed(2) || 'N/A'}\n`;
    prompt += `- Price Range: $${products.priceStats.minPrice || 'N/A'} - $${products.priceStats.maxPrice || 'N/A'}\n\n`;
    
    // Variant data
    prompt += `INVENTORY DATA:\n`;
    prompt += `- Total Variants: ${variants.totalVariants}\n`;
    prompt += `- Active Variants: ${variants.activeVariants}\n`;
    prompt += `- Out of Stock: ${variants.stockDistribution.outOfStock || 0}\n`;
    prompt += `- Low Stock (≤5): ${variants.stockDistribution.lowStock || 0}\n`;
    prompt += `- Total Stock Value: $${variants.priceAnalysis.totalValue?.toLocaleString() || 'N/A'}\n\n`;
    
    // Traffic data
    prompt += `TRAFFIC DATA:\n`;
    prompt += `- Today's Page Views: ${pageTracking.today.pageViews}\n`;
    prompt += `- Today's Unique Sessions: ${pageTracking.today.uniqueSessions}\n`;
    prompt += `- Growth Rate: ${pageTracking.growthRate}%\n`;
    prompt += `- Top Page: ${pageTracking.topPages[0]?._id || 'N/A'} (${pageTracking.topPages[0]?.views || 0} views)\n`;
    prompt += `- Top Country: ${pageTracking.topCountries[0]?._id || 'N/A'} (${pageTracking.topCountries[0]?.views || 0} views)\n\n`;
    
    // User preferences
    if (userPreferences.totalUsers > 0) {
      prompt += `USER PREFERENCES:\n`;
      prompt += `- Total Users: ${userPreferences.totalUsers}\n`;
      prompt += `- Top Gender: ${userPreferences.genderDistribution[0]?._id || 'N/A'} (${userPreferences.genderDistribution[0]?.count || 0})\n`;
      prompt += `- Top Size: ${userPreferences.sizeDistribution[0]?._id || 'N/A'} (${userPreferences.sizeDistribution[0]?.count || 0})\n`;
      prompt += `- Top Region: ${userPreferences.regionDistribution[0]?._id || 'N/A'} (${userPreferences.regionDistribution[0]?.count || 0})\n\n`;
    }
    
    // SEO data
    if (seo.totalMetrics > 0) {
      prompt += `SEO PERFORMANCE:\n`;
      prompt += `- Total Metrics Tracked: ${seo.totalMetrics}\n`;
      if (seo.coreWebVitals.LCP) {
        prompt += `- Average LCP: ${seo.coreWebVitals.LCP.avg?.toFixed(2) || 'N/A'}s\n`;
      }
      if (seo.pagePerformance.page_load_time) {
        prompt += `- Average Load Time: ${seo.pagePerformance.page_load_time.avg?.toFixed(2) || 'N/A'}s\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `Focus Area: ${focus}\n\n`;
    prompt += `Provide 3-5 specific, actionable insights with priority levels (high/medium/low) and confidence scores (0-100). Format as JSON with this structure:
    {
      "insights": [
        {
          "title": "Insight Title",
          "content": "Detailed insight description with specific data points",
          "priority": "high|medium|low",
          "confidence": 85,
          "category": "sales|users|performance|inventory|marketing",
          "actionable": true,
          "metrics": {
            "key": "value"
          }
        }
      ],
      "overallConfidence": 80
    }`;

    return prompt;
  }

  // Build prompt for Hugging Face
  buildHuggingFacePrompt(realData, focus) {
    const { products, variants, pageTracking, seo, userPreferences } = realData;
    
    let prompt = `E-commerce Business Analysis Report\n\n`;
    
    // Product metrics
    prompt += `PRODUCT METRICS:\n`;
    prompt += `- Total Products: ${products.totalProducts}\n`;
    prompt += `- Active Products: ${products.activeProducts}\n`;
    prompt += `- Verification Rate: ${products.verificationRate}%\n`;
    prompt += `- Recent Products (7 days): ${products.recentProducts}\n`;
    prompt += `- Average Price: $${products.priceStats.avgPrice?.toFixed(2) || 'N/A'}\n\n`;
    
    // Inventory metrics
    prompt += `INVENTORY STATUS:\n`;
    prompt += `- Total Variants: ${variants.totalVariants}\n`;
    prompt += `- Active Variants: ${variants.activeVariants}\n`;
    prompt += `- Out of Stock: ${variants.stockDistribution.outOfStock || 0}\n`;
    prompt += `- Low Stock (≤5): ${variants.stockDistribution.lowStock || 0}\n`;
    prompt += `- Total Stock Value: $${variants.priceAnalysis.totalValue?.toLocaleString() || 'N/A'}\n\n`;
    
    // Traffic metrics
    prompt += `TRAFFIC ANALYTICS:\n`;
    prompt += `- Today's Page Views: ${pageTracking.today.pageViews}\n`;
    prompt += `- Today's Unique Sessions: ${pageTracking.today.uniqueSessions}\n`;
    prompt += `- Growth Rate: ${pageTracking.growthRate}%\n`;
    prompt += `- Top Page: ${pageTracking.topPages[0]?._id || 'N/A'} (${pageTracking.topPages[0]?.views || 0} views)\n`;
    prompt += `- Top Country: ${pageTracking.topCountries[0]?._id || 'N/A'} (${pageTracking.topCountries[0]?.views || 0} views)\n\n`;
    
    // User preferences if available
    if (userPreferences.totalUsers > 0) {
      prompt += `USER INSIGHTS:\n`;
      prompt += `- Total Users: ${userPreferences.totalUsers}\n`;
      prompt += `- Top Gender: ${userPreferences.genderDistribution[0]?._id || 'N/A'}\n`;
      prompt += `- Top Size: ${userPreferences.sizeDistribution[0]?._id || 'N/A'}\n`;
      prompt += `- Top Region: ${userPreferences.regionDistribution[0]?._id || 'N/A'}\n\n`;
    }
    
    // SEO metrics if available
    if (seo.totalMetrics > 0) {
      prompt += `PERFORMANCE METRICS:\n`;
      prompt += `- Total SEO Metrics: ${seo.totalMetrics}\n`;
      if (seo.coreWebVitals.LCP) {
        prompt += `- Average LCP: ${seo.coreWebVitals.LCP.avg?.toFixed(2) || 'N/A'}s\n`;
      }
      if (seo.pagePerformance.page_load_time) {
        prompt += `- Average Load Time: ${seo.pagePerformance.page_load_time.avg?.toFixed(2) || 'N/A'}s\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `FOCUS AREA: ${focus}\n\n`;
    prompt += `Based on this data, provide 3-5 specific, actionable business insights. Each insight should include:\n`;
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
    const { products, variants, pageTracking } = realData;

    // High-priority insights based on data patterns
    if (products.verificationRate < 30) {
      insights.push({
        id: `rule-${Date.now()}-1`,
        title: 'Low Product Verification Rate',
        content: `Only ${products.verificationRate}% of products are verified. This significantly impacts customer trust and conversion rates.`,
        priority: 'high',
        confidence: 95,
        actionable: true,
        category: 'verification',
        type: 'sales',
        metrics: {
          currentRate: products.verificationRate + '%',
          target: '80%',
          impact: 'High'
        }
      });
    }

    if (variants.stockDistribution.outOfStock > variants.totalVariants * 0.1) {
      insights.push({
        id: `rule-${Date.now()}-2`,
        title: 'High Out-of-Stock Rate',
        content: `${variants.stockDistribution.outOfStock} variants (${((variants.stockDistribution.outOfStock / variants.totalVariants) * 100).toFixed(1)}%) are out of stock. This represents significant lost revenue potential.`,
        priority: 'high',
        confidence: 90,
        actionable: true,
        category: 'inventory',
        type: 'sales',
        metrics: {
          outOfStock: variants.stockDistribution.outOfStock,
          percentage: ((variants.stockDistribution.outOfStock / variants.totalVariants) * 100).toFixed(1) + '%',
          totalVariants: variants.totalVariants
        }
      });
    }

    if (pageTracking.growthRate < -20) {
      insights.push({
        id: `rule-${Date.now()}-3`,
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
