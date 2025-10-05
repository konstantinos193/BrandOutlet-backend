const express = require('express');
const router = express.Router();

// Mock analytics data (replace with database queries in production)
let analyticsData = {
  genderDistribution: { male: 0, female: 0 },
  clothingSizeDistribution: {},
  shoeSizeDistribution: {},
  completionRate: 0,
  totalUsers: 0,
  lastUpdated: new Date(),
  trends: {
    popularSizes: [],
    genderTrends: [],
    completionTrends: []
  },
  marketingInsights: {
    targetAudience: '',
    recommendedSizes: [],
    conversionOpportunities: []
  }
};

// GET /api/analytics/overview - Get analytics overview
router.get('/overview', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate insights based on data
    const insights = calculateMarketingInsights();
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: analyticsData.totalUsers,
          completionRate: analyticsData.completionRate,
          lastUpdated: analyticsData.lastUpdated
        },
        genderDistribution: analyticsData.genderDistribution,
        clothingSizeDistribution: analyticsData.clothingSizeDistribution,
        shoeSizeDistribution: analyticsData.shoeSizeDistribution,
        insights: insights
      }
    });

  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics overview',
      message: error.message
    });
  }
});

// GET /api/analytics/marketing-insights - Get marketing insights
router.get('/marketing-insights', async (req, res) => {
  try {
    const insights = calculateMarketingInsights();
    
    res.json({
      success: true,
      data: {
        targetAudience: insights.targetAudience,
        recommendedSizes: insights.recommendedSizes,
        conversionOpportunities: insights.conversionOpportunities,
        sizeRecommendations: insights.sizeRecommendations,
        genderInsights: insights.genderInsights,
        trends: insights.trends
      }
    });

  } catch (error) {
    console.error('Error fetching marketing insights:', error);
    res.status(500).json({
      error: 'Failed to fetch marketing insights',
      message: error.message
    });
  }
});

// GET /api/analytics/size-recommendations - Get size recommendations for inventory
router.get('/size-recommendations', async (req, res) => {
  try {
    const { gender, category } = req.query;
    
    const recommendations = generateSizeRecommendations(gender, category);
    
    res.json({
      success: true,
      data: {
        gender: gender || 'all',
        category: category || 'all',
        recommendations: recommendations,
        confidence: calculateConfidenceScore(recommendations)
      }
    });

  } catch (error) {
    console.error('Error generating size recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate size recommendations',
      message: error.message
    });
  }
});

// GET /api/analytics/trends - Get trend analysis
router.get('/trends', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const trends = analyzeTrends(period);
    
    res.json({
      success: true,
      data: {
        period: period,
        trends: trends,
        recommendations: generateTrendRecommendations(trends)
      }
    });

  } catch (error) {
    console.error('Error analyzing trends:', error);
    res.status(500).json({
      error: 'Failed to analyze trends',
      message: error.message
    });
  }
});

// Helper function to calculate marketing insights
function calculateMarketingInsights() {
  const totalUsers = analyticsData.totalUsers;
  const maleCount = analyticsData.genderDistribution.male;
  const femaleCount = analyticsData.genderDistribution.female;
  
  // Determine target audience
  let targetAudience = 'Mixed';
  if (maleCount > femaleCount * 1.5) {
    targetAudience = 'Male-dominated';
  } else if (femaleCount > maleCount * 1.5) {
    targetAudience = 'Female-dominated';
  }

  // Get most popular sizes
  const popularClothingSizes = Object.entries(analyticsData.clothingSizeDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([size, count]) => ({ size, count, percentage: (count / totalUsers * 100).toFixed(1) }));

  const popularShoeSizes = Object.entries(analyticsData.shoeSizeDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([size, count]) => ({ size, count, percentage: (count / totalUsers * 100).toFixed(1) }));

  // Generate conversion opportunities
  const conversionOpportunities = [];
  if (analyticsData.completionRate < 80) {
    conversionOpportunities.push({
      type: 'completion_rate',
      message: 'Low completion rate detected. Consider simplifying the modal flow.',
      priority: 'high'
    });
  }

  if (popularClothingSizes.length > 0) {
    conversionOpportunities.push({
      type: 'inventory_optimization',
      message: `Focus inventory on sizes: ${popularClothingSizes.map(s => s.size).join(', ')}`,
      priority: 'medium'
    });
  }

  return {
    targetAudience,
    recommendedSizes: {
      clothing: popularClothingSizes,
      shoes: popularShoeSizes
    },
    conversionOpportunities,
    sizeRecommendations: generateInventoryRecommendations(),
    genderInsights: {
      malePercentage: ((maleCount / totalUsers) * 100).toFixed(1),
      femalePercentage: ((femaleCount / totalUsers) * 100).toFixed(1)
    },
    trends: {
      completionRate: analyticsData.completionRate,
      totalUsers: totalUsers
    }
  };
}

// Helper function to generate size recommendations
function generateSizeRecommendations(gender, category) {
  let data = analyticsData;
  
  if (gender) {
    // Filter data by gender (in real implementation, query database)
    data = filterDataByGender(gender);
  }

  const recommendations = {
    clothing: Object.entries(data.clothingSizeDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([size, count]) => ({ size, count })),
    shoes: Object.entries(data.shoeSizeDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([size, count]) => ({ size, count }))
  };

  return recommendations;
}

// Helper function to analyze trends
function analyzeTrends(period) {
  // Mock trend analysis (in production, analyze historical data)
  return {
    genderTrend: {
      male: '+12%',
      female: '+8%'
    },
    sizeTrend: {
      clothing: 'M and L sizes trending up',
      shoes: 'Size 9-10 most popular'
    },
    completionTrend: {
      rate: analyticsData.completionRate + '%',
      change: '+5%'
    }
  };
}

// Helper function to generate trend recommendations
function generateTrendRecommendations(trends) {
  const recommendations = [];
  
  if (trends.genderTrend.male.includes('+')) {
    recommendations.push('Consider increasing male-targeted marketing');
  }
  
  if (trends.completionTrend.change.includes('+')) {
    recommendations.push('Modal completion rate is improving - keep current strategy');
  }
  
  return recommendations;
}

// Helper function to generate inventory recommendations
function generateInventoryRecommendations() {
  const clothingSizes = Object.entries(analyticsData.clothingSizeDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
    
  const shoeSizes = Object.entries(analyticsData.shoeSizeDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return {
    clothing: {
      highPriority: clothingSizes.slice(0, 3).map(([size]) => size),
      mediumPriority: clothingSizes.slice(3, 5).map(([size]) => size)
    },
    shoes: {
      highPriority: shoeSizes.slice(0, 3).map(([size]) => size),
      mediumPriority: shoeSizes.slice(3, 5).map(([size]) => size)
    }
  };
}

// Helper function to calculate confidence score
function calculateConfidenceScore(recommendations) {
  const totalDataPoints = Object.values(recommendations).reduce((sum, category) => 
    sum + Object.values(category).reduce((catSum, sizes) => 
      catSum + sizes.reduce((sizeSum, item) => sizeSum + item.count, 0), 0), 0);
  
  if (totalDataPoints > 100) return 'High';
  if (totalDataPoints > 50) return 'Medium';
  return 'Low';
}

// Helper function to filter data by gender (mock implementation)
function filterDataByGender(gender) {
  // In real implementation, this would query the database
  return analyticsData;
}

module.exports = router;
