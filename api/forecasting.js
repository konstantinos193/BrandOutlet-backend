const express = require('express');
const router = express.Router();
const forecastingService = require('../services/forecastingService');

// GET /api/forecasting/seasonal-trends - Get seasonal trends with forecasting
router.get('/seasonal-trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 365;
    const forecastDays = parseInt(req.query.forecastDays) || 30;
    
    const result = await forecastingService.generateSeasonalTrendsWithForecast(days, forecastDays);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating seasonal trends forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate seasonal trends forecast',
      message: error.message
    });
  }
});

// POST /api/forecasting/forecast - Generate forecast for custom data
router.post('/forecast', async (req, res) => {
  try {
    const { data, forecastPeriod = 30 } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data provided',
        message: 'Data must be an array of objects with date and value properties'
      });
    }
    
    const result = await forecastingService.generateForecastData(data, forecastPeriod);
    
    res.json({
      success: true,
      data: result,
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

// GET /api/forecasting/peak-analysis - Analyze peaks and troughs in data
router.get('/peak-analysis', async (req, res) => {
  try {
    const { data, threshold = 1.5 } = req.query;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data parameter required',
        message: 'Please provide data as query parameter'
      });
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        message: 'Data must be valid JSON'
      });
    }
    
    const peakAlerts = forecastingService.generatePeakAlerts(parsedData, parseFloat(threshold));
    const volatility = forecastingService.calculateVolatility(parsedData.map(item => item.actual || item.value || 0));
    
    res.json({
      success: true,
      data: {
        peakAlerts,
        volatility,
        totalPeaks: peakAlerts.filter(alert => alert.type === 'peak').length,
        totalTroughs: peakAlerts.filter(alert => alert.type === 'trough').length,
        highSeverityAlerts: peakAlerts.filter(alert => alert.severity === 'high').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing peaks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze peaks',
      message: error.message
    });
  }
});

// GET /api/forecasting/seasonal-analysis - Analyze seasonal patterns
router.get('/seasonal-analysis', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 365;
    
    const historicalData = forecastingService.generateSeasonalHistoricalData(days);
    const seasonalAnalysis = forecastingService.analyzeSeasonalPatterns(historicalData);
    
    res.json({
      success: true,
      data: {
        seasonalAnalysis,
        historicalData: historicalData.slice(-90), // Return last 90 days for preview
        summary: {
          peakMonth: new Date(0, seasonalAnalysis.peakMonth).toLocaleDateString('en-US', { month: 'long' }),
          lowMonth: new Date(0, seasonalAnalysis.lowMonth).toLocaleDateString('en-US', { month: 'long' }),
          overallAverage: Math.round(seasonalAnalysis.overallAverage),
          seasonalVariation: Math.round((Math.max(...seasonalAnalysis.seasonalFactors) - Math.min(...seasonalAnalysis.seasonalFactors)) * 100) + '%'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing seasonal patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze seasonal patterns',
      message: error.message
    });
  }
});

module.exports = router;
