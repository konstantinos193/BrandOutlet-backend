/**
 * Machine Learning API Endpoints
 * 
 * Backend API for predictive analytics, demand forecasting,
 * seasonal analysis, and A/B testing
 */

const express = require('express');
const router = express.Router();

// ML Models storage (in production, use proper ML model storage)
const models = new Map();
const forecasts = new Map();
const abTests = new Map();
const modelCache = new Map();
const trainingJobs = new Map();

// Initialize ML models
const initializeMLModels = () => {
  // Demand forecasting model
  models.set('demand_forecast', {
    type: 'demand_forecast',
    algorithm: 'linear_regression',
    features: ['historical_sales', 'seasonal_factor', 'price', 'brand_popularity'],
    trained: true,
    accuracy: 0.85,
    lastTrained: new Date().toISOString()
  });

  // Seasonal analysis model
  models.set('seasonal_analysis', {
    type: 'seasonal_analysis',
    algorithm: 'time_series',
    features: ['sales', 'price', 'inventory', 'user_behavior'],
    trained: true,
    accuracy: 0.82,
    lastTrained: new Date().toISOString()
  });

  // Recommendation model
  models.set('recommendation', {
    type: 'recommendation',
    algorithm: 'neural_network',
    features: ['user_preferences', 'purchase_history', 'browsing_behavior'],
    trained: true,
    accuracy: 0.78,
    lastTrained: new Date().toISOString()
  });

  // A/B testing model
  models.set('ab_test', {
    type: 'ab_test',
    algorithm: 'statistical_analysis',
    features: ['conversion_rate', 'click_through_rate', 'engagement'],
    trained: true,
    accuracy: 0.90,
    lastTrained: new Date().toISOString()
  });
};

// Initialize models on startup
initializeMLModels();

// Get ML model
router.get('/models/:modelType', (req, res) => {
  try {
    const { modelType } = req.params;
    const model = models.get(modelType);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: `Model ${modelType} not found`
      });
    }

    res.json({
      success: true,
      model
    });
  } catch (error) {
    console.error('Error getting ML model:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Train ML model
router.post('/train', async (req, res) => {
  try {
    const { modelType, trainingData, config } = req.body;
    
    if (!modelType || !trainingData) {
      return res.status(400).json({
        success: false,
        message: 'Model type and training data are required'
      });
    }

    // Simulate model training
    const trainingResult = await simulateModelTraining(modelType, trainingData, config);
    
    // Update model
    const model = models.get(modelType);
    if (model) {
      model.trained = true;
      model.accuracy = trainingResult.accuracy;
      model.lastTrained = new Date().toISOString();
      models.set(modelType, model);
    }

    res.json({
      success: true,
      message: 'Model trained successfully',
      result: trainingResult
    });
  } catch (error) {
    console.error('Error training model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to train model',
      error: error.message
    });
  }
});

// Predict demand
router.post('/forecast/demand', async (req, res) => {
  try {
    const { productIds, features } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    // Generate demand forecasts
    const forecasts = await generateDemandForecasts(productIds, features);
    
    res.json({
      success: true,
      forecasts
    });
  } catch (error) {
    console.error('Error generating demand forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate demand forecast',
      error: error.message
    });
  }
});

// Analyze seasonal trends
router.post('/analysis/seasonal', async (req, res) => {
  try {
    const { category, timeRange, features } = req.body;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Generate seasonal analysis
    const trends = await generateSeasonalTrends(category, timeRange, features);
    
    res.json({
      success: true,
      trends
    });
  } catch (error) {
    console.error('Error analyzing seasonal trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze seasonal trends',
      error: error.message
    });
  }
});

// Get product recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { userId, limit, features } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Generate recommendations
    const recommendations = await generateRecommendations(userId, limit, features);
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
});

// Run A/B test
router.post('/ab-test', async (req, res) => {
  try {
    const { testName, variants, trafficSplit, metrics, duration } = req.body;
    
    if (!testName || !variants || !Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: 'Test name and variants are required'
      });
    }

    // Create A/B test
    const testId = `test_${Date.now()}`;
    const abTest = {
      testId,
      testName,
      variants,
      trafficSplit: trafficSplit || variants.map(() => 1 / variants.length),
      metrics: metrics || ['conversion_rate', 'click_through_rate'],
      duration: duration || 7, // days
      status: 'running',
      startDate: new Date().toISOString(),
      results: {}
    };

    abTests.set(testId, abTest);

    res.json({
      success: true,
      testId,
      message: 'A/B test created successfully'
    });
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create A/B test',
      error: error.message
    });
  }
});

// Get A/B test results
router.get('/ab-test/:testId/results', (req, res) => {
  try {
    const { testId } = req.params;
    const abTest = abTests.get(testId);
    
    if (!abTest) {
      return res.status(404).json({
        success: false,
        message: 'A/B test not found'
      });
    }

    // Generate results if not exists
    if (!abTest.results || Object.keys(abTest.results).length === 0) {
      abTest.results = generateABTestResults(abTest);
      abTests.set(testId, abTest);
    }

    res.json({
      success: true,
      results: abTest.results
    });
  } catch (error) {
    console.error('Error getting A/B test results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get A/B test results',
      error: error.message
    });
  }
});

// Get model performance
router.get('/performance/:modelType', (req, res) => {
  try {
    const { modelType } = req.params;
    const model = models.get(modelType);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: `Model ${modelType} not found`
      });
    }

    res.json({
      success: true,
      performance: {
        accuracy: model.accuracy,
        precision: model.accuracy * 0.95,
        recall: model.accuracy * 0.98,
        f1Score: model.accuracy * 0.96,
        lastTrained: model.lastTrained
      }
    });
  } catch (error) {
    console.error('Error getting model performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get model performance',
      error: error.message
    });
  }
});

// Helper functions

// Simulate model training
async function simulateModelTraining(modelType, trainingData, config) {
  // Simulate training time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    accuracy: Math.random() * 0.2 + 0.8, // 80-100%
    precision: Math.random() * 0.2 + 0.8,
    recall: Math.random() * 0.2 + 0.8,
    f1Score: Math.random() * 0.2 + 0.8,
    trainingTime: Math.random() * 1000 + 500, // 500-1500ms
    epochs: config?.epochs || 100,
    loss: Math.random() * 0.1 + 0.05 // 5-15%
  };
}

// Generate demand forecasts
async function generateDemandForecasts(productIds, features) {
  const forecasts = [];
  
  for (const productId of productIds) {
    const forecast = {
      productId,
      productName: `Product ${productId}`,
      currentStock: Math.floor(Math.random() * 100) + 10,
      predictedDemand: Math.floor(Math.random() * 50) + 5,
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
      seasonalFactor: Math.random() * 0.4 + 0.8, // 80-120%
      trendDirection: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)],
      recommendedAction: ['restock', 'reduce', 'maintain'][Math.floor(Math.random() * 3)],
      forecastDate: new Date().toISOString(),
      factors: {
        historicalSales: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100)),
        seasonalTrends: generateSeasonalTrendsData(),
        userPreferences: generateUserPreferencesData(),
        marketTrends: generateMarketTrendsData(),
        competitorAnalysis: generateCompetitorData(),
        priceSensitivity: Math.random(),
        brandPopularity: Math.random(),
        categoryGrowth: Math.random() * 0.2 - 0.1 // -10% to +10%
      }
    };
    
    forecasts.push(forecast);
  }
  
  return forecasts;
}

// Generate seasonal trends
async function generateSeasonalTrends(category, timeRange, features) {
  const trends = [];
  
  for (let month = 1; month <= 12; month++) {
    trends.push({
      month,
      factor: Math.random() * 0.4 + 0.8, // 80-120%
      confidence: Math.random() * 0.3 + 0.7,
      historicalData: Array.from({ length: 3 }, () => Math.floor(Math.random() * 100)),
      category,
      timeRange
    });
  }
  
  return trends;
}

// Generate recommendations
async function generateRecommendations(userId, limit, features) {
  const recommendations = [];
  
  for (let i = 0; i < (limit || 10); i++) {
    recommendations.push({
      productId: `product_${i}`,
      productName: `Recommended Product ${i}`,
      score: Math.random(),
      reason: ['Similar to your preferences', 'Trending now', 'Seasonal favorite'][Math.floor(Math.random() * 3)],
      price: Math.floor(Math.random() * 200) + 50,
      image: `/images/product_${i}.jpg`,
      brand: ['Nike', 'Adidas', 'Supreme'][Math.floor(Math.random() * 3)],
      category: ['sneakers', 'clothing', 'accessories'][Math.floor(Math.random() * 3)]
    });
  }
  
  return recommendations;
}

// Generate A/B test results
function generateABTestResults(abTest) {
  const results = {};
  
  for (let i = 0; i < abTest.variants.length; i++) {
    const variant = abTest.variants[i];
    results[variant] = {
      variant,
      conversionRate: Math.random() * 0.1 + 0.05, // 5-15%
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
      sampleSize: Math.floor(Math.random() * 1000) + 100,
      statisticalSignificance: Math.random() > 0.5,
      recommendation: Math.random() > 0.5 ? 'Implement variant' : 'Keep original',
      metrics: {
        clickThroughRate: Math.random() * 0.05 + 0.02, // 2-7%
        conversionRate: Math.random() * 0.1 + 0.05, // 5-15%
        revenue: Math.random() * 1000 + 500,
        engagement: Math.random() * 0.3 + 0.4, // 40-70%
        retention: Math.random() * 0.2 + 0.6 // 60-80%
      }
    };
  }
  
  return results;
}

// Helper data generation functions
function generateSeasonalTrendsData() {
  const trends = [];
  for (let month = 1; month <= 12; month++) {
    trends.push({
      month,
      factor: Math.random() * 0.4 + 0.8,
      confidence: Math.random() * 0.3 + 0.7,
      historicalData: Array.from({ length: 3 }, () => Math.floor(Math.random() * 100))
    });
  }
  return trends;
}

function generateUserPreferencesData() {
  const preferences = [];
  for (let i = 0; i < 10; i++) {
    preferences.push({
      userId: `user_${i}`,
      preferenceScore: Math.random(),
      categoryPreferences: {
        'sneakers': Math.random(),
        'clothing': Math.random(),
        'accessories': Math.random()
      },
      brandPreferences: {
        'Nike': Math.random(),
        'Adidas': Math.random(),
        'Supreme': Math.random()
      },
      priceRange: {
        min: Math.floor(Math.random() * 100),
        max: Math.floor(Math.random() * 500) + 100
      },
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return preferences;
}

function generateMarketTrendsData() {
  return [
    {
      category: 'sneakers',
      trend: 'growing',
      growthRate: Math.random() * 0.2,
      marketShare: Math.random() * 0.3 + 0.1,
      competitorCount: Math.floor(Math.random() * 20) + 5
    },
    {
      category: 'clothing',
      trend: 'stable',
      growthRate: Math.random() * 0.1 - 0.05,
      marketShare: Math.random() * 0.4 + 0.2,
      competitorCount: Math.floor(Math.random() * 30) + 10
    }
  ];
}

function generateCompetitorData() {
  const competitors = [];
  for (let i = 0; i < 5; i++) {
    competitors.push({
      competitorName: `Competitor ${i + 1}`,
      price: Math.floor(Math.random() * 200) + 50,
      stock: Math.floor(Math.random() * 100),
      rating: Math.random() * 2 + 3, // 3-5 stars
      reviews: Math.floor(Math.random() * 1000),
      marketShare: Math.random() * 0.2
    });
  }
  return competitors;
}

// POST /api/ml/initialize - Initialize all ML models (replaces frontend initialization)
router.post('/initialize', async (req, res) => {
  try {
    console.log('🤖 Initializing ML models...');
    
    // Initialize all models
    await initializeMLModels();
    
    // Preload critical models
    await preloadCriticalModels();
    
    // Warm up model cache
    await warmUpModelCache();
    
    res.json({
      success: true,
      message: 'ML models initialized successfully',
      data: {
        models: Array.from(models.keys()),
        cacheStatus: modelCache.size,
        initializedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error initializing ML models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize ML models',
      message: error.message
    });
  }
});

// POST /api/ml/forecast/batch - Batch demand forecasting (replaces frontend batch processing)
router.post('/forecast/batch', async (req, res) => {
  try {
    const { productIds, features, options = {} } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    console.log(`🔮 Processing batch forecast for ${productIds.length} products`);
    
    // Process in batches to avoid overwhelming the system
    const batchSize = options.batchSize || 10;
    const batches = [];
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      batches.push(productIds.slice(i, i + batchSize));
    }
    
    const allForecasts = [];
    
    for (const batch of batches) {
      const batchForecasts = await generateDemandForecasts(batch, features);
      allForecasts.push(...batchForecasts);
      
      // Add small delay between batches to prevent overload
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    res.json({
      success: true,
      data: {
        forecasts: allForecasts,
        totalProducts: productIds.length,
        processedProducts: allForecasts.length,
        batchCount: batches.length
      }
    });
  } catch (error) {
    console.error('Error in batch forecasting:', error);
    res.status(500).json({
      success: false,
      message: 'Batch forecasting failed',
      error: error.message
    });
  }
});

// POST /api/ml/analysis/comprehensive - Comprehensive analysis (replaces frontend analytics)
router.post('/analysis/comprehensive', async (req, res) => {
  try {
    const { 
      category, 
      timeRange, 
      features,
      includeSeasonal = true,
      includeTrends = true,
      includeRecommendations = true
    } = req.body;
    
    console.log(`📊 Running comprehensive analysis for ${category}`);
    
    const analysis = {
      category,
      timeRange,
      timestamp: new Date().toISOString(),
      results: {}
    };
    
    // Seasonal analysis
    if (includeSeasonal) {
      analysis.results.seasonal = await generateSeasonalTrends(category, timeRange, features);
    }
    
    // Market trends
    if (includeTrends) {
      analysis.results.trends = await generateMarketTrendsData();
    }
    
    // Recommendations
    if (includeRecommendations) {
      analysis.results.recommendations = await generateRecommendations('system', 20, features);
    }
    
    // Performance metrics
    analysis.results.performance = {
      processingTime: Date.now() - new Date(analysis.timestamp).getTime(),
      modelAccuracy: models.get('seasonal_analysis')?.accuracy || 0.82,
      confidence: Math.random() * 0.3 + 0.7
    };
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error in comprehensive analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Comprehensive analysis failed',
      error: error.message
    });
  }
});

// POST /api/ml/recommendations/personalized - Personalized recommendations (replaces frontend logic)
router.post('/recommendations/personalized', async (req, res) => {
  try {
    const { 
      userId, 
      limit = 10, 
      features,
      includeSimilarUsers = true,
      includeTrending = true,
      includeSeasonal = true
    } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log(`🎯 Generating personalized recommendations for user ${userId}`);
    
    const recommendations = {
      userId,
      generatedAt: new Date().toISOString(),
      recommendations: [],
      metadata: {}
    };
    
    // Get user preferences (in real app, this would come from database)
    const userPreferences = await getUserPreferences(userId);
    
    // Generate different types of recommendations
    const baseRecommendations = await generateRecommendations(userId, limit, features);
    
    if (includeSimilarUsers) {
      const similarUserRecs = await getSimilarUserRecommendations(userId, limit);
      recommendations.recommendations.push(...similarUserRecs);
    }
    
    if (includeTrending) {
      const trendingRecs = await getTrendingRecommendations(category, limit);
      recommendations.recommendations.push(...trendingRecs);
    }
    
    if (includeSeasonal) {
      const seasonalRecs = await getSeasonalRecommendations(category, limit);
      recommendations.recommendations.push(...seasonalRecs);
    }
    
    // Deduplicate and rank recommendations
    recommendations.recommendations = deduplicateAndRankRecommendations(
      recommendations.recommendations, 
      userPreferences
    ).slice(0, limit);
    
    recommendations.metadata = {
      totalGenerated: recommendations.recommendations.length,
      userPreferences,
      algorithm: 'hybrid_recommendation',
      confidence: Math.random() * 0.3 + 0.7
    };
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Personalized recommendations failed',
      error: error.message
    });
  }
});

// POST /api/ml/ab-test/advanced - Advanced A/B testing (replaces frontend A/B testing)
router.post('/ab-test/advanced', async (req, res) => {
  try {
    const { 
      testName, 
      variants, 
      trafficSplit, 
      metrics, 
      duration,
      targetAudience,
      statisticalSignificance = 0.95,
      minimumSampleSize = 100
    } = req.body;
    
    if (!testName || !variants || !Array.isArray(variants)) {
      return res.status(400).json({
        success: false,
        message: 'Test name and variants are required'
      });
    }

    console.log(`🧪 Creating advanced A/B test: ${testName}`);
    
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const abTest = {
      testId,
      testName,
      variants,
      trafficSplit: trafficSplit || variants.map(() => 1 / variants.length),
      metrics: metrics || ['conversion_rate', 'click_through_rate', 'engagement'],
      duration: duration || 7,
      targetAudience: targetAudience || 'all',
      statisticalSignificance,
      minimumSampleSize,
      status: 'running',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000).toISOString(),
      results: {},
      participants: new Map(),
      conversionEvents: new Map()
    };

    abTests.set(testId, abTest);
    
    // Start background monitoring
    startABTestMonitoring(testId);
    
    res.json({
      success: true,
      data: {
        testId,
        testName,
        status: 'running',
        startDate: abTest.startDate,
        endDate: abTest.endDate,
        message: 'Advanced A/B test created and monitoring started'
      }
    });
  } catch (error) {
    console.error('Error creating advanced A/B test:', error);
    res.status(500).json({
      success: false,
      message: 'Advanced A/B test creation failed',
      error: error.message
    });
  }
});

// GET /api/ml/status - Get ML system status (replaces frontend status checks)
router.get('/status', (req, res) => {
  try {
    const status = {
      system: {
        modelsLoaded: models.size,
        cacheSize: modelCache.size,
        activeTests: abTests.size,
        trainingJobs: trainingJobs.size,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      models: {},
      performance: {
        averageResponseTime: Math.random() * 100 + 50, // Mock data
        cacheHitRate: Math.random() * 0.3 + 0.7,
        errorRate: Math.random() * 0.05
      }
    };
    
    // Get status for each model
    for (const [modelName, model] of models) {
      status.models[modelName] = {
        trained: model.trained,
        accuracy: model.accuracy,
        lastTrained: model.lastTrained,
        algorithm: model.algorithm,
        features: model.features
      };
    }
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting ML status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ML status',
      error: error.message
    });
  }
});

// Helper functions for enhanced ML processing

// Preload critical models
async function preloadCriticalModels() {
  const criticalModels = ['demand_forecast', 'recommendation'];
  
  for (const modelName of criticalModels) {
    if (models.has(modelName)) {
      // Simulate model loading
      await new Promise(resolve => setTimeout(resolve, 100));
      modelCache.set(modelName, { loaded: true, timestamp: Date.now() });
    }
  }
}

// Warm up model cache
async function warmUpModelCache() {
  // Simulate cache warming
  for (const [modelName] of models) {
    modelCache.set(modelName, { 
      loaded: true, 
      timestamp: Date.now(),
      warmUpData: generateMockData()
    });
  }
}

// Get user preferences
async function getUserPreferences(userId) {
  // In real app, this would query the database
  return {
    userId,
    preferences: {
      categories: ['sneakers', 'clothing'],
      brands: ['Nike', 'Adidas'],
      priceRange: { min: 50, max: 500 },
      lastActivity: new Date().toISOString()
    }
  };
}

// Get similar user recommendations
async function getSimilarUserRecommendations(userId, limit) {
  const recommendations = [];
  
  for (let i = 0; i < limit; i++) {
    recommendations.push({
      productId: `similar_${i}`,
      productName: `Similar Product ${i}`,
      score: Math.random() * 0.3 + 0.7,
      reason: 'Similar users also liked',
      price: Math.floor(Math.random() * 200) + 50,
      brand: ['Nike', 'Adidas', 'Supreme'][Math.floor(Math.random() * 3)]
    });
  }
  
  return recommendations;
}

// Get trending recommendations
async function getTrendingRecommendations(category, limit) {
  const recommendations = [];
  
  for (let i = 0; i < limit; i++) {
    recommendations.push({
      productId: `trending_${i}`,
      productName: `Trending Product ${i}`,
      score: Math.random() * 0.2 + 0.8,
      reason: 'Trending now',
      price: Math.floor(Math.random() * 300) + 100,
      brand: ['Nike', 'Adidas', 'Supreme'][Math.floor(Math.random() * 3)]
    });
  }
  
  return recommendations;
}

// Get seasonal recommendations
async function getSeasonalRecommendations(category, limit) {
  const recommendations = [];
  
  for (let i = 0; i < limit; i++) {
    recommendations.push({
      productId: `seasonal_${i}`,
      productName: `Seasonal Product ${i}`,
      score: Math.random() * 0.25 + 0.75,
      reason: 'Perfect for this season',
      price: Math.floor(Math.random() * 250) + 75,
      brand: ['Nike', 'Adidas', 'Supreme'][Math.floor(Math.random() * 3)]
    });
  }
  
  return recommendations;
}

// Deduplicate and rank recommendations
function deduplicateAndRankRecommendations(recommendations, userPreferences) {
  // Remove duplicates based on productId
  const unique = recommendations.filter((rec, index, self) => 
    index === self.findIndex(r => r.productId === rec.productId)
  );
  
  // Sort by score
  return unique.sort((a, b) => b.score - a.score);
}

// Start A/B test monitoring
function startABTestMonitoring(testId) {
  // In real app, this would start background monitoring
  console.log(`🔍 Started monitoring for A/B test ${testId}`);
}

// Generate mock data for cache warming
function generateMockData() {
  return {
    sampleSize: Math.floor(Math.random() * 1000) + 100,
    accuracy: Math.random() * 0.2 + 0.8,
    lastUpdated: new Date().toISOString()
  };
}

module.exports = router;
