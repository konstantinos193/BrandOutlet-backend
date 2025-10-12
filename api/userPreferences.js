const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { connectDB } = require('../config/database');
const router = express.Router();

// Import size conversion logic
const { convertSizeToEU } = require('./sizeConversion');

let db = null;

// Initialize database connection
const initializeDB = async () => {
  if (!db) {
    db = await connectDB();
  }
  return db;
};

// Validation schemas
const userPreferencesSchema = Joi.object({
  gender: Joi.string().valid('male', 'female').required(),
  clothingSize: Joi.string().min(1).required(),
  shoeSize: Joi.string().min(1).required(),
  region: Joi.string().optional().default('US'),
  sessionId: Joi.string().optional(),
  userAgent: Joi.string().optional(),
  timestamp: Joi.date().default(Date.now)
});

// POST /api/user-preferences - Save user preferences
router.post('/', async (req, res) => {
  try {
    console.log('User preferences request body:', JSON.stringify(req.body, null, 2));
    
    const { error, value } = userPreferencesSchema.validate(req.body);
    if (error) {
      console.error('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    // Convert sizes to EU standard automatically
    const euClothingSize = convertSizeToEU(value.gender, value.clothingSize, value.region, 'clothing');
    const euShoeSize = convertSizeToEU(value.gender, value.shoeSize, value.region, 'shoe');

    // Add unique ID, timestamp, and converted sizes
    const preferenceData = {
      id: uuidv4(),
      ...value,
      euClothingSize,
      euShoeSize,
      sizeConversion: {
        clothing: {
          original: value.clothingSize,
          region: value.region,
          eu: euClothingSize
        },
        shoe: {
          original: value.shoeSize,
          region: value.region,
          eu: euShoeSize
        }
      },
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };

    // Store the preference in MongoDB
    const database = await initializeDB();
    const preferencesCollection = database.collection('userPreferences');
    await preferencesCollection.insertOne(preferenceData);

    // Analytics will be calculated on-demand from database
    console.log('User preferences stored in database, analytics calculated on-demand');

    res.status(201).json({
      success: true,
      message: 'User preferences saved successfully',
      data: {
        id: preferenceData.id,
        timestamp: preferenceData.timestamp
      }
    });

  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({
      error: 'Failed to save user preferences',
      message: error.message
    });
  }
});

// GET /api/user-preferences - Get user preferences (for admin)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, gender, clothingSize, shoeSize } = req.query;
    
    let filteredData = [...userPreferences];

    // Apply filters
    if (gender) {
      filteredData = filteredData.filter(p => p.gender === gender);
    }
    if (clothingSize) {
      filteredData = filteredData.filter(p => p.clothingSize === clothingSize);
    }
    if (shoeSize) {
      filteredData = filteredData.filter(p => p.shoeSize === shoeSize);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedData = filteredData.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredData.length,
        pages: Math.ceil(filteredData.length / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch user preferences',
      message: error.message
    });
  }
});

// GET /api/user-preferences/analytics - Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const database = await initializeDB();
    const preferencesCollection = database.collection('userPreferences');
    
    // Calculate analytics from database
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
    
    const analyticsData = {
      genderDistribution,
      clothingSizeDistribution,
      shoeSizeDistribution,
      completionRate: 100, // All saved preferences are complete
      totalUsers,
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      data: analyticsData,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

// Helper function to update analytics data
function updateAnalyticsData(preferenceData) {
  // Update gender distribution
  analyticsData.genderDistribution[preferenceData.gender]++;

  // Update clothing size distribution
  if (!analyticsData.clothingSizeDistribution[preferenceData.clothingSize]) {
    analyticsData.clothingSizeDistribution[preferenceData.clothingSize] = 0;
  }
  analyticsData.clothingSizeDistribution[preferenceData.clothingSize]++;

  // Update shoe size distribution
  if (!analyticsData.shoeSizeDistribution[preferenceData.shoeSize]) {
    analyticsData.shoeSizeDistribution[preferenceData.shoeSize] = 0;
  }
  analyticsData.shoeSizeDistribution[preferenceData.shoeSize]++;

  // Update total users and completion rate
  analyticsData.totalUsers++;
  analyticsData.completionRate = (userPreferences.length / analyticsData.totalUsers) * 100;
  analyticsData.lastUpdated = new Date();
}

// GET /api/user-preferences/export - Export data as CSV
router.get('/export', async (req, res) => {
  try {
    const csvHeader = 'ID,Gender,Clothing Size,Shoe Size,Timestamp,IP Address\n';
    const csvData = userPreferences.map(pref => 
      `${pref.id},${pref.gender},${pref.clothingSize},${pref.shoeSize},${pref.timestamp},${pref.ipAddress}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=user-preferences.csv');
    res.send(csvHeader + csvData);

  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      error: 'Failed to export data',
      message: error.message
    });
  }
});

module.exports = router;
