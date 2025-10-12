const express = require('express');
const router = express.Router();
const insightsService = require('../services/insightsService');
const realDataInsightsService = require('../services/realDataInsightsService');
const comprehensiveDataService = require('../services/comprehensiveDataService');
const aiInsightsGenerator = require('../services/aiInsightsGenerator');

// GET /api/insights - Get comprehensive AI-powered insights
router.get('/', async (req, res) => {
  try {
    const { focus = 'all', useRealData = 'true', useAI = 'true' } = req.query;
    
    console.log(`🤖 Comprehensive AI insights requested with focus: ${focus}, real data: ${useRealData}, AI: ${useAI}`);
    
    let insights;
    if (useRealData === 'true') {
      if (useAI === 'true') {
        // Use comprehensive data with AI enhancement
        console.log('📊 Gathering comprehensive data for AI insights...');
        const comprehensiveData = await comprehensiveDataService.getComprehensiveData();
        insights = await aiInsightsGenerator.generateAIInsights(comprehensiveData, focus);
      } else {
        // Use real data insights service with rule-based generation
        insights = await realDataInsightsService.generateInsights(focus, false);
      }
    } else {
      // Fallback to mock data service
      insights = await insightsService.generateInsights(focus);
    }
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString(),
      dataSource: useRealData === 'true' ? (useAI === 'true' ? 'comprehensive-ai-enhanced' : 'real-rule-based') : 'mock'
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      message: error.message
    });
  }
});

// GET /api/insights/comprehensive - Get comprehensive data for analysis
router.get('/comprehensive', async (req, res) => {
  try {
    console.log('📊 Comprehensive data requested');
    
    const comprehensiveData = await comprehensiveDataService.getComprehensiveData();
    
    res.json({
      success: true,
      data: comprehensiveData,
      timestamp: new Date().toISOString(),
      dataSource: 'comprehensive'
    });
  } catch (error) {
    console.error('Error getting comprehensive data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comprehensive data',
      message: error.message
    });
  }
});

// GET /api/insights/sales - Get sales-focused insights
router.get('/sales', async (req, res) => {
  try {
    const insights = await insightsService.generateInsights('sales');
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating sales insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sales insights',
      message: error.message
    });
  }
});

// GET /api/insights/users - Get user-focused insights
router.get('/users', async (req, res) => {
  try {
    const insights = await insightsService.generateInsights('users');
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating user insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate user insights',
      message: error.message
    });
  }
});

// GET /api/insights/performance - Get performance-focused insights
router.get('/performance', async (req, res) => {
  try {
    const insights = await insightsService.generateInsights('performance');
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating performance insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance insights',
      message: error.message
    });
  }
});

// GET /api/insights/inventory - Get inventory-focused insights
router.get('/inventory', async (req, res) => {
  try {
    const insights = await insightsService.generateInsights('inventory');
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating inventory insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate inventory insights',
      message: error.message
    });
  }
});

// GET /api/insights/marketing - Get marketing-focused insights
router.get('/marketing', async (req, res) => {
  try {
    const insights = await insightsService.generateInsights('marketing');
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating marketing insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate marketing insights',
      message: error.message
    });
  }
});

// GET /api/insights/strategic-recommendations - Get strategic recommendations
router.get('/strategic-recommendations', async (req, res) => {
  try {
    const recommendations = await insightsService.generateStrategicRecommendations();
    
    res.json({
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating strategic recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate strategic recommendations',
      message: error.message
    });
  }
});

// POST /api/insights/clear-cache - Clear insights cache
router.post('/clear-cache', async (req, res) => {
  try {
    insightsService.clearCache();
    
    res.json({
      success: true,
      message: 'Insights cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing insights cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear insights cache',
      message: error.message
    });
  }
});

// POST /api/insights/analyze-sentiment - Test enhanced AI sentiment analysis
router.post('/analyze-sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for sentiment analysis'
      });
    }

    const aiInsightsGenerator = require('../services/aiInsightsGenerator');
    
    const sentimentResult = await aiInsightsGenerator.analyzeCustomerSentiment(text);
    const emotionResult = await aiInsightsGenerator.analyzeCustomerEmotions(text);
    
    res.json({
      success: true,
      data: {
        text: text,
        sentiment: sentimentResult,
        emotion: emotionResult,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
});

// POST /api/insights/generate-summary - Test text summarization
router.post('/generate-summary', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for summarization'
      });
    }

    const aiInsightsGenerator = require('../services/aiInsightsGenerator');
    const summary = await aiInsightsGenerator.generateInsightSummary(text);
    
    res.json({
      success: true,
      data: {
        original: text,
        summary: summary,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary',
      message: error.message
    });
  }
});

module.exports = router;
