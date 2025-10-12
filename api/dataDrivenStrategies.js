const express = require('express');
const { connectDB } = require('../config/database');
const dataDrivenStrategiesService = require('../services/dataDrivenStrategiesService');
const router = express.Router();

let db = null;

// Initialize database connection
const initializeDB = async () => {
  if (!db) {
    db = await connectDB();
  }
};

// Initialize sample data in database
const initializeSampleData = async () => {
  try {
    await initializeDB();
    
    const insightsCollection = db.collection('dataDrivenInsights');
    const marketingCollection = db.collection('marketingStrategies');
    const inventoryCollection = db.collection('inventoryStrategies');
    
    // Check if data already exists
    const [insightsCount, marketingCount, inventoryCount] = await Promise.all([
      insightsCollection.countDocuments(),
      marketingCollection.countDocuments(),
      inventoryCollection.countDocuments()
    ]);
    
    if (insightsCount === 0) {
      const sampleInsights = [
        {
          id: '1',
          type: 'marketing',
          category: 'Audience Targeting',
          title: 'High-Value Sneaker Enthusiasts Opportunity',
          description: 'Sneaker category shows 25% higher conversion rate among 18-25 age group with premium brands',
          impact: 'high',
          priority: 'high',
          confidence: 87,
          dataPoints: [
            { metric: 'Conversion Rate', value: '12.5%', change: 25, trend: 'up' },
            { metric: 'Average Order Value', value: '$450', change: 18, trend: 'up' },
            { metric: 'Target Audience Size', value: '2,340', change: 12, trend: 'up' }
          ],
          recommendations: [
            'Increase sneaker inventory by 30%',
            'Launch targeted Instagram ads for 18-25 demographic',
            'Create limited edition drops for premium brands'
          ],
          expectedROI: 340,
          timeframe: '2-4 weeks',
          effort: 'medium',
          status: 'pending',
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'inventory',
          category: 'Stock Optimization',
          title: 'Supreme Brand Stock Shortage Risk',
          description: 'Supreme items showing 85% sell-through rate with only 2 weeks of stock remaining',
          impact: 'high',
          priority: 'urgent',
          confidence: 92,
          dataPoints: [
            { metric: 'Sell-through Rate', value: '85%', change: 15, trend: 'up' },
            { metric: 'Days of Stock', value: '14', change: -40, trend: 'down' },
            { metric: 'Lost Sales', value: '$12,500', change: 25, trend: 'up' }
          ],
          recommendations: [
            'Place urgent reorder for Supreme items',
            'Implement dynamic pricing for remaining stock',
            'Set up automated reorder alerts'
          ],
          expectedROI: 280,
          timeframe: '1-2 weeks',
          effort: 'high',
          status: 'pending',
          createdAt: new Date()
        }
      ];
      
      await insightsCollection.insertMany(sampleInsights);
      console.log('✅ Sample data-driven insights initialized in database');
    }
    
    if (marketingCount === 0) {
      const sampleMarketingStrategies = [
        {
          id: '1',
          title: 'Sneaker Drop Campaign',
          description: 'Targeted campaign for upcoming Air Jordan releases',
          targetAudience: 'Sneaker enthusiasts, 18-35, high income',
          channels: ['Instagram', 'TikTok', 'Email'],
          budget: 15000,
          expectedROI: 340,
          timeframe: '4 weeks',
          status: 'active',
          createdAt: new Date()
        }
      ];
      
      await marketingCollection.insertMany(sampleMarketingStrategies);
      console.log('✅ Sample marketing strategies initialized in database');
    }
    
    if (inventoryCount === 0) {
      const sampleInventoryStrategies = [
        {
          id: '1',
          title: 'Supreme Stock Increase',
          description: 'Increase Supreme inventory allocation due to high demand',
          category: 'Clothing',
          action: 'increase',
          quantity: 75,
          reasoning: 'Historical Q4 demand increase of 40%',
          expectedImpact: 'Capture seasonal demand spike',
          timeframe: '3 weeks',
          status: 'pending',
          createdAt: new Date()
        }
      ];
      
      await inventoryCollection.insertMany(sampleInventoryStrategies);
      console.log('✅ Sample inventory strategies initialized in database');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

// Initialize sample data on startup
initializeSampleData();

// GET /api/data-driven-strategies - Get all strategy data
router.get('/', async (req, res) => {
  try {
    const { useRealData = 'true', type, priority, impact, limit = 10 } = req.query;
    
    if (useRealData === 'true') {
      // Use real data from the service
      console.log('📊 Fetching real data-driven strategies...');
      const realData = await dataDrivenStrategiesService.getAllRealStrategies();
      
      // Apply filters if provided
      let filteredInsights = realData.insights;
      if (type) {
        filteredInsights = filteredInsights.filter(insight => 
          insight.type === type.toLowerCase()
        );
      }
      if (priority) {
        filteredInsights = filteredInsights.filter(insight => 
          insight.priority === priority.toLowerCase()
        );
      }
      if (impact) {
        filteredInsights = filteredInsights.filter(insight => 
          insight.impact === impact.toLowerCase()
        );
      }
      
      // Apply limit
      filteredInsights = filteredInsights.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          insights: filteredInsights,
          marketingStrategies: realData.marketingStrategies.slice(0, parseInt(limit)),
          inventoryStrategies: realData.inventoryStrategies.slice(0, parseInt(limit)),
          total: filteredInsights.length + realData.marketingStrategies.length + realData.inventoryStrategies.length,
          dataSource: 'real-database-data',
          lastUpdated: realData.lastUpdated
        }
      });
    } else {
      // Fallback to sample data
      await initializeDB();
      const insightsCollection = db.collection('dataDrivenInsights');
      const marketingCollection = db.collection('marketingStrategies');
      const inventoryCollection = db.collection('inventoryStrategies');
      
      // Build query for insights
      const insightsQuery = {};
      if (type) insightsQuery.type = type.toLowerCase();
      if (priority) insightsQuery.priority = priority.toLowerCase();
      if (impact) insightsQuery.impact = impact.toLowerCase();
      
      const [insights, marketingStrategies, inventoryStrategies] = await Promise.all([
        insightsCollection.find(insightsQuery).limit(parseInt(limit)).toArray(),
        marketingCollection.find({}).limit(parseInt(limit)).toArray(),
        inventoryCollection.find({}).limit(parseInt(limit)).toArray()
      ]);
      
      res.json({
        success: true,
        data: {
          insights: insights,
          marketingStrategies: marketingStrategies,
          inventoryStrategies: inventoryStrategies,
          total: insights.length + marketingStrategies.length + inventoryStrategies.length,
          dataSource: 'sample-data'
        }
      });
    }

  } catch (error) {
    console.error('Error fetching data-driven strategies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data-driven strategies',
      message: error.message
    });
  }
});

// GET /api/data-driven-strategies/insights - Get insights only
router.get('/insights', async (req, res) => {
  try {
    const { useRealData = 'true', type, priority, impact, limit = 10 } = req.query;
    
    if (useRealData === 'true') {
      // Use real data from the service
      const insights = await dataDrivenStrategiesService.generateRealInsights();
      
      // Apply filters
      let filteredInsights = insights;
      if (type) {
        filteredInsights = filteredInsights.filter(insight => 
          insight.type === type.toLowerCase()
        );
      }
      if (priority) {
        filteredInsights = filteredInsights.filter(insight => 
          insight.priority === priority.toLowerCase()
        );
      }
      if (impact) {
        filteredInsights = filteredInsights.filter(insight => 
          insight.impact === impact.toLowerCase()
        );
      }
      
      // Apply limit
      filteredInsights = filteredInsights.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          insights: filteredInsights,
          total: filteredInsights.length,
          dataSource: 'real-database-data'
        }
      });
    } else {
      // Fallback to sample data
      await initializeDB();
      const insightsCollection = db.collection('dataDrivenInsights');
      
      // Build query
      const query = {};
      if (type) query.type = type.toLowerCase();
      if (priority) query.priority = priority.toLowerCase();
      if (impact) query.impact = impact.toLowerCase();
      
      const insights = await insightsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .toArray();
      
      res.json({
        success: true,
        data: {
          insights: insights,
          total: insights.length,
          dataSource: 'sample-data'
        }
      });
    }

  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insights',
      message: error.message
    });
  }
});

// GET /api/data-driven-strategies/marketing - Get marketing strategies
router.get('/marketing', async (req, res) => {
  try {
    const { useRealData = 'true', status, limit = 10 } = req.query;
    
    if (useRealData === 'true') {
      // Use real data from the service
      const strategies = await dataDrivenStrategiesService.generateRealMarketingStrategies();
      
      // Apply filters
      let filteredStrategies = strategies;
      if (status) {
        filteredStrategies = filteredStrategies.filter(strategy => 
          strategy.status === status.toLowerCase()
        );
      }
      
      // Apply limit
      filteredStrategies = filteredStrategies.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          strategies: filteredStrategies,
          total: filteredStrategies.length,
          dataSource: 'real-database-data'
        }
      });
    } else {
      // Fallback to sample data
      await initializeDB();
      const marketingCollection = db.collection('marketingStrategies');
      
      // Build query
      const query = {};
      if (status) query.status = status.toLowerCase();
      
      const strategies = await marketingCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .toArray();
      
      res.json({
        success: true,
        data: {
          strategies: strategies,
          total: strategies.length,
          dataSource: 'sample-data'
        }
      });
    }

  } catch (error) {
    console.error('Error fetching marketing strategies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketing strategies',
      message: error.message
    });
  }
});

// GET /api/data-driven-strategies/inventory - Get inventory strategies
router.get('/inventory', async (req, res) => {
  try {
    const { useRealData = 'true', action, status, limit = 10 } = req.query;
    
    if (useRealData === 'true') {
      // Use real data from the service
      const strategies = await dataDrivenStrategiesService.generateRealInventoryStrategies();
      
      // Apply filters
      let filteredStrategies = strategies;
      if (action) {
        filteredStrategies = filteredStrategies.filter(strategy => 
          strategy.action === action.toLowerCase()
        );
      }
      if (status) {
        filteredStrategies = filteredStrategies.filter(strategy => 
          strategy.status === status.toLowerCase()
        );
      }
      
      // Apply limit
      filteredStrategies = filteredStrategies.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          strategies: filteredStrategies,
          total: filteredStrategies.length,
          dataSource: 'real-database-data'
        }
      });
    } else {
      // Fallback to sample data
      await initializeDB();
      const inventoryCollection = db.collection('inventoryStrategies');
      
      // Build query
      const query = {};
      if (action) query.action = action.toLowerCase();
      if (status) query.status = status.toLowerCase();
      
      const strategies = await inventoryCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .toArray();
      
      res.json({
        success: true,
        data: {
          strategies: strategies,
          total: strategies.length,
          dataSource: 'sample-data'
        }
      });
    }

  } catch (error) {
    console.error('Error fetching inventory strategies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory strategies',
      message: error.message
    });
  }
});

// POST /api/data-driven-strategies/insights/:id/execute - Execute insight
router.post('/insights/:id/execute', async (req, res) => {
  try {
    await initializeDB();
    const { id } = req.params;
    const { action, notes } = req.body;
    
    const insightsCollection = db.collection('dataDrivenInsights');
    
    const result = await insightsCollection.updateOne(
      { id: id },
      { 
        $set: { 
          status: action === 'execute' ? 'executed' : 'rejected',
          executedAt: new Date(),
          executionNotes: notes
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found'
      });
    }

    res.json({
      success: true,
      message: `Insight ${action === 'execute' ? 'executed' : 'rejected'} successfully`
    });

  } catch (error) {
    console.error('Error executing insight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute insight',
      message: error.message
    });
  }
});

// POST /api/data-driven-strategies/marketing - Create marketing strategy
router.post('/marketing', async (req, res) => {
  try {
    await initializeDB();
    const { title, description, targetAudience, channels, budget, expectedROI, timeframe } = req.body;
    
    const marketingCollection = db.collection('marketingStrategies');
    
    const strategy = {
      id: `mkt_${Date.now()}`,
      title,
      description,
      targetAudience,
      channels,
      budget,
      expectedROI,
      timeframe,
      status: 'draft',
      createdAt: new Date()
    };
    
    await marketingCollection.insertOne(strategy);

    res.status(201).json({
      success: true,
      message: 'Marketing strategy created successfully',
      data: strategy
    });

  } catch (error) {
    console.error('Error creating marketing strategy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create marketing strategy',
      message: error.message
    });
  }
});

// POST /api/data-driven-strategies/inventory - Create inventory strategy
router.post('/inventory', async (req, res) => {
  try {
    await initializeDB();
    const { title, description, category, action, quantity, reasoning, expectedImpact, timeframe } = req.body;
    
    const inventoryCollection = db.collection('inventoryStrategies');
    
    const strategy = {
      id: `inv_${Date.now()}`,
      title,
      description,
      category,
      action,
      quantity,
      reasoning,
      expectedImpact,
      timeframe,
      status: 'pending',
      createdAt: new Date()
    };
    
    await inventoryCollection.insertOne(strategy);

    res.status(201).json({
      success: true,
      message: 'Inventory strategy created successfully',
      data: strategy
    });

  } catch (error) {
    console.error('Error creating inventory strategy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory strategy',
      message: error.message
    });
  }
});

module.exports = router;