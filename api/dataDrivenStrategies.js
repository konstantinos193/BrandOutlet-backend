const express = require('express');
const router = express.Router();

// Mock data for data-driven strategy insights
const mockInsights = [
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
      'Launch targeted Instagram ads for sneaker releases',
      'Create exclusive early access for high-value customers',
      'Develop sneaker-focused email campaigns'
    ],
    expectedOutcome: 'Increase sneaker sales by 30% and AOV by 20%',
    timeframe: '2-4 weeks',
    effort: 'medium'
  },
  {
    id: '2',
    type: 'inventory',
    category: 'Stock Management',
    title: 'Supreme Brand Stock Shortage Risk',
    description: 'Supreme products showing 40% faster sell-through rate than forecasted',
    impact: 'high',
    priority: 'urgent',
    confidence: 92,
    dataPoints: [
      { metric: 'Sell-through Rate', value: '85%', change: 40, trend: 'up' },
      { metric: 'Days in Stock', value: '3.2', change: -60, trend: 'down' },
      { metric: 'Lost Sales', value: '23', change: 150, trend: 'up' }
    ],
    recommendations: [
      'Increase Supreme inventory allocation by 50%',
      'Implement dynamic pricing for high-demand items',
      'Set up automated reorder alerts'
    ],
    expectedOutcome: 'Prevent stockouts and capture additional $15K revenue',
    timeframe: '1-2 weeks',
    effort: 'high'
  },
  {
    id: '3',
    type: 'pricing',
    category: 'Revenue Optimization',
    title: 'Luxury Handbags Pricing Opportunity',
    description: 'Louis Vuitton and Gucci bags showing price elasticity - 15% price increase could increase revenue by 8%',
    impact: 'medium',
    priority: 'medium',
    confidence: 78,
    dataPoints: [
      { metric: 'Price Elasticity', value: '-0.53', change: -12, trend: 'down' },
      { metric: 'Current Margin', value: '22%', change: 5, trend: 'up' },
      { metric: 'Competitor Pricing', value: '+18%', change: 8, trend: 'up' }
    ],
    recommendations: [
      'Test 10% price increase on select luxury bags',
      'Implement premium positioning strategy',
      'Monitor conversion rate impact closely'
    ],
    expectedOutcome: 'Increase luxury bag revenue by 8% with minimal volume impact',
    timeframe: '3-4 weeks',
    effort: 'low'
  },
  {
    id: '4',
    type: 'trend',
    category: 'Market Trends',
    title: 'Y2K Fashion Resurgence',
    description: 'Early indicators show growing interest in Y2K fashion items, particularly in clothing category',
    impact: 'medium',
    priority: 'medium',
    confidence: 65,
    dataPoints: [
      { metric: 'Search Volume', value: '+340%', change: 340, trend: 'up' },
      { metric: 'Social Mentions', value: '2.1K', change: 180, trend: 'up' },
      { metric: 'Early Adopters', value: '156', change: 45, trend: 'up' }
    ],
    recommendations: [
      'Curate Y2K fashion collection',
      'Partner with micro-influencers in fashion space',
      'Create nostalgic marketing campaigns'
    ],
    expectedOutcome: 'Capture early market share in emerging trend',
    timeframe: '4-6 weeks',
    effort: 'medium'
  },
  {
    id: '5',
    type: 'marketing',
    category: 'Customer Retention',
    title: 'High-Value Customer Churn Risk',
    description: 'Top 10% of customers showing 15% decrease in purchase frequency over last 30 days',
    impact: 'high',
    priority: 'urgent',
    confidence: 89,
    dataPoints: [
      { metric: 'Purchase Frequency', value: '-15%', change: -15, trend: 'down' },
      { metric: 'Customer Lifetime Value', value: '$2,340', change: -8, trend: 'down' },
      { metric: 'At-Risk Customers', value: '127', change: 45, trend: 'up' }
    ],
    recommendations: [
      'Launch VIP customer retention campaign',
      'Offer exclusive early access to new products',
      'Implement personalized discount strategy'
    ],
    expectedOutcome: 'Reduce churn by 25% and increase CLV by 15%',
    timeframe: '1-2 weeks',
    effort: 'high'
  }
];

const mockMarketingStrategies = [
  {
    id: '1',
    title: 'Sneaker Drop Campaign',
    description: 'Targeted campaign for upcoming Air Jordan releases',
    targetAudience: 'Sneaker enthusiasts, 18-35, high income',
    channels: ['Instagram', 'TikTok', 'Email', 'Influencer'],
    budget: '$15,000',
    expectedROI: 320,
    timeframe: '4 weeks',
    status: 'active'
  },
  {
    id: '2',
    title: 'Luxury Brand Awareness',
    description: 'Premium positioning for high-end handbags and accessories',
    targetAudience: 'Luxury shoppers, 25-45, high income',
    channels: ['Google Ads', 'Facebook', 'Email', 'Partnerships'],
    budget: '$25,000',
    expectedROI: 280,
    timeframe: '8 weeks',
    status: 'draft'
  },
  {
    id: '3',
    title: 'Retargeting Campaign',
    description: 'Re-engage users who viewed but didn\'t purchase',
    targetAudience: 'Previous visitors, cart abandoners',
    channels: ['Facebook', 'Google', 'Email'],
    budget: '$8,000',
    expectedROI: 450,
    timeframe: '2 weeks',
    status: 'active'
  },
  {
    id: '4',
    title: 'Influencer Partnership Program',
    description: 'Collaborate with fashion influencers for brand awareness',
    targetAudience: 'Fashion-conscious millennials and Gen Z',
    channels: ['Instagram', 'TikTok', 'YouTube'],
    budget: '$20,000',
    expectedROI: 380,
    timeframe: '6 weeks',
    status: 'draft'
  }
];

const mockInventoryStrategies = [
  {
    id: '1',
    title: 'Supreme Stock Increase',
    description: 'Increase Supreme inventory allocation due to high demand',
    category: 'Clothing',
    action: 'increase',
    quantity: 150,
    reasoning: '40% faster sell-through rate than forecasted',
    expectedImpact: 'Prevent stockouts, capture additional revenue',
    timeframe: '2 weeks',
    status: 'in_progress'
  },
  {
    id: '2',
    title: 'Nike Sneaker Restock',
    description: 'Restock popular Nike models based on sales data',
    category: 'Sneakers',
    action: 'increase',
    quantity: 200,
    reasoning: 'Consistently high demand, low stock levels',
    expectedImpact: 'Maintain market share in sneaker category',
    timeframe: '1 week',
    status: 'pending'
  },
  {
    id: '3',
    title: 'Discontinue Slow Movers',
    description: 'Remove underperforming items to free up capital',
    category: 'Accessories',
    action: 'discontinue',
    quantity: 45,
    reasoning: 'Below 5% sell-through rate for 3+ months',
    expectedImpact: 'Free up $12K in working capital',
    timeframe: '1 week',
    status: 'completed'
  },
  {
    id: '4',
    title: 'Luxury Handbag Allocation',
    description: 'Increase luxury handbag inventory for Q4 season',
    category: 'Bags',
    action: 'increase',
    quantity: 75,
    reasoning: 'Historical Q4 demand increase of 40%',
    expectedImpact: 'Capture seasonal demand spike',
    timeframe: '3 weeks',
    status: 'pending'
  }
];

// GET /api/data-driven-strategies - Get all strategy data
router.get('/', async (req, res) => {
  try {
    const { type, priority, impact, limit = 10 } = req.query;
    
    let filteredInsights = [...mockInsights];
    let filteredMarketing = [...mockMarketingStrategies];
    let filteredInventory = [...mockInventoryStrategies];
    
    // Filter insights based on query parameters
    if (type) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.type.toLowerCase() === type.toLowerCase()
      );
    }
    
    if (priority) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.priority.toLowerCase() === priority.toLowerCase()
      );
    }
    
    if (impact) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.impact.toLowerCase() === impact.toLowerCase()
      );
    }
    
    // Apply limit
    const limitedInsights = filteredInsights.slice(0, parseInt(limit));
    
    // Calculate summary statistics
    const highImpactInsights = limitedInsights.filter(i => i.impact === 'high').length;
    const urgentInsights = limitedInsights.filter(i => i.priority === 'urgent').length;
    const avgConfidence = limitedInsights.length > 0 
      ? (limitedInsights.reduce((sum, i) => sum + i.confidence, 0) / limitedInsights.length).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: {
        insights: limitedInsights,
        marketingStrategies: filteredMarketing,
        inventoryStrategies: filteredInventory,
        summary: {
          totalInsights: limitedInsights.length,
          highImpactInsights,
          urgentInsights,
          averageConfidence: avgConfidence,
          activeMarketingCampaigns: filteredMarketing.filter(s => s.status === 'active').length,
          pendingInventoryActions: filteredInventory.filter(s => s.status === 'pending').length
        },
        filters: { type, priority, impact, limit: parseInt(limit) },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching data-driven strategies:', error);
    res.status(500).json({
      error: 'Failed to fetch data-driven strategies',
      message: error.message
    });
  }
});

// GET /api/data-driven-strategies/insights - Get only insights
router.get('/insights', async (req, res) => {
  try {
    const { type, priority, impact, limit = 10 } = req.query;
    
    let filteredInsights = [...mockInsights];
    
    if (type) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.type.toLowerCase() === type.toLowerCase()
      );
    }
    
    if (priority) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.priority.toLowerCase() === priority.toLowerCase()
      );
    }
    
    if (impact) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.impact.toLowerCase() === impact.toLowerCase()
      );
    }
    
    const limitedInsights = filteredInsights.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        insights: limitedInsights,
        total: limitedInsights.length,
        filters: { type, priority, impact, limit: parseInt(limit) }
      }
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      error: 'Failed to fetch insights',
      message: error.message
    });
  }
});

// GET /api/data-driven-strategies/marketing - Get marketing strategies
router.get('/marketing', async (req, res) => {
  try {
    const { status, limit = 10 } = req.query;
    
    let filteredStrategies = [...mockMarketingStrategies];
    
    if (status) {
      filteredStrategies = filteredStrategies.filter(strategy => 
        strategy.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    const limitedStrategies = filteredStrategies.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        strategies: limitedStrategies,
        total: limitedStrategies.length,
        filters: { status, limit: parseInt(limit) }
      }
    });

  } catch (error) {
    console.error('Error fetching marketing strategies:', error);
    res.status(500).json({
      error: 'Failed to fetch marketing strategies',
      message: error.message
    });
  }
});

// GET /api/data-driven-strategies/inventory - Get inventory strategies
router.get('/inventory', async (req, res) => {
  try {
    const { action, status, limit = 10 } = req.query;
    
    let filteredStrategies = [...mockInventoryStrategies];
    
    if (action) {
      filteredStrategies = filteredStrategies.filter(strategy => 
        strategy.action.toLowerCase() === action.toLowerCase()
      );
    }
    
    if (status) {
      filteredStrategies = filteredStrategies.filter(strategy => 
        strategy.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    const limitedStrategies = filteredStrategies.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        strategies: limitedStrategies,
        total: limitedStrategies.length,
        filters: { action, status, limit: parseInt(limit) }
      }
    });

  } catch (error) {
    console.error('Error fetching inventory strategies:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory strategies',
      message: error.message
    });
  }
});

// POST /api/data-driven-strategies/insights/:id/execute - Execute an insight
router.post('/insights/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    
    const insight = mockInsights.find(i => i.id === id);
    if (!insight) {
      return res.status(404).json({
        error: 'Insight not found'
      });
    }
    
    // Mock execution logic
    const execution = {
      id: `exec_${Date.now()}`,
      insightId: id,
      action,
      notes,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      expectedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    res.json({
      success: true,
      message: 'Insight execution started',
      data: execution
    });

  } catch (error) {
    console.error('Error executing insight:', error);
    res.status(500).json({
      error: 'Failed to execute insight',
      message: error.message
    });
  }
});

// POST /api/data-driven-strategies/marketing - Create marketing strategy
router.post('/marketing', async (req, res) => {
  try {
    const { title, description, targetAudience, channels, budget, expectedROI, timeframe } = req.body;
    
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
      createdAt: new Date().toISOString()
    };
    
    mockMarketingStrategies.push(strategy);
    
    res.status(201).json({
      success: true,
      message: 'Marketing strategy created',
      data: strategy
    });

  } catch (error) {
    console.error('Error creating marketing strategy:', error);
    res.status(500).json({
      error: 'Failed to create marketing strategy',
      message: error.message
    });
  }
});

// POST /api/data-driven-strategies/inventory - Create inventory strategy
router.post('/inventory', async (req, res) => {
  try {
    const { title, description, category, action, quantity, reasoning, expectedImpact, timeframe } = req.body;
    
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
      createdAt: new Date().toISOString()
    };
    
    mockInventoryStrategies.push(strategy);
    
    res.status(201).json({
      success: true,
      message: 'Inventory strategy created',
      data: strategy
    });

  } catch (error) {
    console.error('Error creating inventory strategy:', error);
    res.status(500).json({
      error: 'Failed to create inventory strategy',
      message: error.message
    });
  }
});

module.exports = router;
