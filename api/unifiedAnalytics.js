const express = require('express');
const router = express.Router();
const analyticsDataService = require('../services/analyticsDataService');

// GET /api/unified-analytics - Get comprehensive analytics data
router.get('/', async (req, res) => {
  try {
    const analyticsData = await analyticsDataService.generateUnifiedAnalyticsData();
    
    res.json({
      success: true,
      data: analyticsData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating unified analytics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/revenue - Get revenue data only
router.get('/revenue', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 365;
    const revenueData = analyticsDataService.generateAdvancedRevenueData(null, days);
    
    res.json({
      success: true,
      data: revenueData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating revenue data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate revenue data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/sales-distribution - Get sales distribution data
router.get('/sales-distribution', async (req, res) => {
  try {
    const salesDistributionData = analyticsDataService.generateSalesDistributionData(null);
    
    res.json({
      success: true,
      data: salesDistributionData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating sales distribution data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sales distribution data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/user-growth - Get user growth data
router.get('/user-growth', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const userGrowthData = analyticsDataService.generateUserGrowthData(null, days);
    
    res.json({
      success: true,
      data: userGrowthData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating user growth data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate user growth data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/performance-metrics - Get performance metrics data
router.get('/performance-metrics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const performanceData = analyticsDataService.generatePerformanceMetricsData(null, days);
    
    res.json({
      success: true,
      data: performanceData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating performance metrics data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance metrics data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/user-funnel - Get user funnel data
router.get('/user-funnel', async (req, res) => {
  try {
    const userFunnelData = analyticsDataService.generateUserFunnelData();
    
    res.json({
      success: true,
      data: userFunnelData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating user funnel data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate user funnel data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/cohort-analysis - Get cohort analysis data
router.get('/cohort-analysis', async (req, res) => {
  try {
    const cohortData = analyticsDataService.generateCohortAnalysisData();
    
    res.json({
      success: true,
      data: cohortData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating cohort analysis data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cohort analysis data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/ltv-cac - Get LTV/CAC data
router.get('/ltv-cac', async (req, res) => {
  try {
    const ltvCacData = await analyticsDataService.generateLTVCACData();
    
    // Validate the data before sending
    if (!Array.isArray(ltvCacData) || ltvCacData.length === 0) {
      throw new Error('Invalid LTV/CAC data structure');
    }
    
    // Ensure all data points have valid values
    const validatedData = ltvCacData.map(item => ({
      period: item.period || 'Unknown',
      ltv: isFinite(item.ltv) ? Math.max(0, item.ltv) : 0,
      cac: isFinite(item.cac) ? Math.max(1, item.cac) : 1,
      ltvCacRatio: isFinite(item.ltvCacRatio) ? Math.max(0, item.ltvCacRatio) : 0,
      paybackPeriod: isFinite(item.paybackPeriod) ? Math.max(0, item.paybackPeriod) : 0,
      revenue: isFinite(item.revenue) ? Math.max(0, item.revenue) : 0,
      customers: isFinite(item.customers) ? Math.max(0, item.customers) : 0
    }));
    
    res.json({
      success: true,
      data: validatedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating LTV/CAC data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate LTV/CAC data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/geographic-sales - Get geographic sales data
router.get('/geographic-sales', async (req, res) => {
  try {
    const geographicData = analyticsDataService.generateGeographicSalesData();
    
    res.json({
      success: true,
      data: geographicData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating geographic sales data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate geographic sales data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/seasonal-trends - Get seasonal trends data
router.get('/seasonal-trends', async (req, res) => {
  try {
    const seasonalData = analyticsDataService.generateSeasonalTrendsData();
    
    res.json({
      success: true,
      data: seasonalData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating seasonal trends data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate seasonal trends data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/insights - Get insights data
router.get('/insights', async (req, res) => {
  try {
    const insights = analyticsDataService.generateMockInsights();
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating insights data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights data',
      message: error.message
    });
  }
});

// GET /api/unified-analytics/strategies - Get strategies data
router.get('/strategies', async (req, res) => {
  try {
    const insights = analyticsDataService.generateMockInsights();
    const marketingStrategies = analyticsDataService.generateMockMarketingStrategies();
    const inventoryStrategies = analyticsDataService.generateMockInventoryStrategies();
    
    res.json({
      success: true,
      data: {
        insights,
        marketingStrategies,
        inventoryStrategies
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating strategies data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate strategies data',
      message: error.message
    });
  }
});

module.exports = router;
