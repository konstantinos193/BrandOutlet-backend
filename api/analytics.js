const express = require('express');
const { connectDB } = require('../config/database');
const router = express.Router();

let db = null;

// Initialize database connection
const initializeDB = async () => {
  if (!db) {
    db = await connectDB();
  }
};

// GET /api/analytics/overview - Get analytics overview
router.get('/overview', async (req, res) => {
  try {
    await initializeDB();
    const { timeframe = '7d' } = req.query;
    
    // Get data from userPreferences collection
    const preferencesCollection = db.collection('userPreferences');
    
    const [totalUsers, genderStats, clothingSizeStats, shoeSizeStats] = await Promise.all([
      preferencesCollection.countDocuments(),
      preferencesCollection.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]).toArray(),
      preferencesCollection.aggregate([
        { $group: { _id: '$clothingSize', count: { $sum: 1 } } }
      ]).toArray(),
      preferencesCollection.aggregate([
        { $group: { _id: '$shoeSize', count: { $sum: 1 } } }
      ]).toArray()
    ]);
    
    // Process gender distribution
    const genderDistribution = { male: 0, female: 0 };
    genderStats.forEach(stat => {
      genderDistribution[stat._id] = stat.count;
    });
    
    // Process clothing size distribution
    const clothingSizeDistribution = {};
    clothingSizeStats.forEach(stat => {
      clothingSizeDistribution[stat._id] = stat.count;
    });
    
    // Process shoe size distribution
    const shoeSizeDistribution = {};
    shoeSizeStats.forEach(stat => {
      shoeSizeDistribution[stat._id] = stat.count;
    });
    
    // Calculate insights
    const insights = calculateMarketingInsights(genderDistribution, clothingSizeDistribution, shoeSizeDistribution);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: totalUsers,
          completionRate: 100, // All saved preferences are complete
          lastUpdated: new Date()
        },
        genderDistribution: genderDistribution,
        clothingSizeDistribution: clothingSizeDistribution,
        shoeSizeDistribution: shoeSizeDistribution,
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

// GET /api/analytics/trends - Get analytics trends
router.get('/trends', async (req, res) => {
  try {
    await initializeDB();
    const { timeframe = '7d' } = req.query;
    
    // Get trends data from userPreferences collection
    const preferencesCollection = db.collection('userPreferences');
    
    // Get recent preferences for trend analysis
    const recentPreferences = await preferencesCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    const trends = calculateTrends(recentPreferences);
    
    res.json({
      success: true,
      data: {
        trends: trends,
        timeframe: timeframe,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching analytics trends:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics trends',
      message: error.message
    });
  }
});

// GET /api/analytics/insights - Get marketing insights
router.get('/insights', async (req, res) => {
  try {
    await initializeDB();
    
    // Get data from userPreferences collection
    const preferencesCollection = db.collection('userPreferences');
    
    const [genderStats, clothingSizeStats, shoeSizeStats] = await Promise.all([
      preferencesCollection.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]).toArray(),
      preferencesCollection.aggregate([
        { $group: { _id: '$clothingSize', count: { $sum: 1 } } }
      ]).toArray(),
      preferencesCollection.aggregate([
        { $group: { _id: '$shoeSize', count: { $sum: 1 } } }
      ]).toArray()
    ]);
    
    // Process distributions
    const genderDistribution = { male: 0, female: 0 };
    genderStats.forEach(stat => {
      genderDistribution[stat._id] = stat.count;
    });
    
    const clothingSizeDistribution = {};
    clothingSizeStats.forEach(stat => {
      clothingSizeDistribution[stat._id] = stat.count;
    });
    
    const shoeSizeDistribution = {};
    shoeSizeStats.forEach(stat => {
      shoeSizeDistribution[stat._id] = stat.count;
    });
    
    const insights = calculateMarketingInsights(genderDistribution, clothingSizeDistribution, shoeSizeDistribution);
    
    res.json({
      success: true,
      data: {
        insights: insights,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching analytics insights:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics insights',
      message: error.message
    });
  }
});

// Helper function to calculate marketing insights
function calculateMarketingInsights(genderDistribution, clothingSizeDistribution, shoeSizeDistribution) {
  const totalUsers = Object.values(genderDistribution).reduce((sum, count) => sum + count, 0);
  
  if (totalUsers === 0) {
    return {
      targetAudience: 'No data available',
      recommendedSizes: [],
      conversionOpportunities: []
    };
  }
  
  // Determine target audience
  const maleCount = genderDistribution.male || 0;
  const femaleCount = genderDistribution.female || 0;
  const targetAudience = maleCount > femaleCount ? 'Male' : femaleCount > maleCount ? 'Female' : 'Mixed';
  
  // Find most popular sizes
  const popularClothingSizes = Object.entries(clothingSizeDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([size, count]) => ({ size, count }));
  
  const popularShoeSizes = Object.entries(shoeSizeDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([size, count]) => ({ size, count }));
  
  // Generate conversion opportunities
  const conversionOpportunities = [];
  
  if (maleCount > femaleCount) {
    conversionOpportunities.push('Focus marketing efforts on male demographic');
  } else if (femaleCount > maleCount) {
    conversionOpportunities.push('Focus marketing efforts on female demographic');
  }
  
  if (popularClothingSizes.length > 0) {
    conversionOpportunities.push(`Stock more ${popularClothingSizes[0].size} clothing sizes`);
  }
  
  if (popularShoeSizes.length > 0) {
    conversionOpportunities.push(`Stock more ${popularShoeSizes[0].size} shoe sizes`);
  }
  
  return {
    targetAudience: targetAudience,
    recommendedSizes: {
      clothing: popularClothingSizes,
      shoes: popularShoeSizes
    },
    conversionOpportunities: conversionOpportunities
  };
}

// Helper function to calculate trends
function calculateTrends(recentPreferences) {
  if (recentPreferences.length === 0) {
    return {
      popularSizes: [],
      genderTrends: [],
      completionTrends: []
    };
  }
  
  // Calculate popular sizes
  const clothingSizeCounts = {};
  const shoeSizeCounts = {};
  const genderCounts = { male: 0, female: 0 };
  
  recentPreferences.forEach(pref => {
    clothingSizeCounts[pref.clothingSize] = (clothingSizeCounts[pref.clothingSize] || 0) + 1;
    shoeSizeCounts[pref.shoeSize] = (shoeSizeCounts[pref.shoeSize] || 0) + 1;
    genderCounts[pref.gender] = (genderCounts[pref.gender] || 0) + 1;
  });
  
  const popularSizes = Object.entries(clothingSizeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([size, count]) => ({ size, count }));
  
  const genderTrends = Object.entries(genderCounts)
    .map(([gender, count]) => ({ gender, count }));
  
  return {
    popularSizes: popularSizes,
    genderTrends: genderTrends,
    completionTrends: [{ period: 'Current', rate: 100 }] // All saved preferences are complete
  };
}

module.exports = router;