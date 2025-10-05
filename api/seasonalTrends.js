const express = require('express');
const router = express.Router();
const seasonalAnalysisService = require('../services/seasonalAnalysisService');

// GET /api/seasonal-trends - Get seasonal trends analysis with forecasting
router.get('/', async (req, res) => {
  try {
    const {
      period = '12m',
      forecastPeriod = 30,
      showConfidence = 'true',
      category = 'all'
    } = req.query;

    const options = {
      period,
      forecastPeriod: parseInt(forecastPeriod),
      showConfidence: showConfidence === 'true',
      category
    };

    const result = await seasonalAnalysisService.generateSeasonalTrends(options);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating seasonal trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate seasonal trends',
      message: error.message
    });
  }
});

// GET /api/seasonal-trends/insights - Get seasonal insights only
router.get('/insights', async (req, res) => {
  try {
    const {
      period = '12m',
      category = 'all'
    } = req.query;

    const options = {
      period,
      forecastPeriod: 30,
      showConfidence: false,
      category
    };

    const result = await seasonalAnalysisService.generateSeasonalTrends(options);

    res.json({
      success: true,
      data: {
        insights: result.insights,
        seasonalAnalysis: result.seasonalAnalysis,
        volatility: result.volatility
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating seasonal insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate seasonal insights',
      message: error.message
    });
  }
});

// GET /api/seasonal-trends/forecast - Get forecast data only
router.get('/forecast', async (req, res) => {
  try {
    const {
      period = '12m',
      forecastPeriod = 30,
      category = 'all'
    } = req.query;

    const options = {
      period,
      forecastPeriod: parseInt(forecastPeriod),
      showConfidence: true,
      category
    };

    const result = await seasonalAnalysisService.generateSeasonalTrends(options);

    res.json({
      success: true,
      data: {
        forecast: result.forecast,
        confidence: result.confidence,
        metadata: result.metadata
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast',
      message: error.message
    });
  }
});

// POST /api/seasonal-trends/clear-cache - Clear seasonal trends cache
router.post('/clear-cache', async (req, res) => {
  try {
    seasonalAnalysisService.clearCache();
    
    res.json({
      success: true,
      message: 'Seasonal trends cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing seasonal trends cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear seasonal trends cache',
      message: error.message
    });
  }
});

module.exports = router;
