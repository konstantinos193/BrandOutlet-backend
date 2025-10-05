const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

// POST /api/advanced-search/products - Advanced product search with faceting
router.post('/products', async (req, res) => {
  try {
    const filters = req.body;
    
    const result = await searchService.searchProducts(filters);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform advanced search',
      message: error.message
    });
  }
});

// GET /api/advanced-search/suggestions - Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    const suggestions = await searchService.getSuggestions(query, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        suggestions,
        query,
        total: suggestions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search suggestions',
      message: error.message
    });
  }
});

// GET /api/advanced-search/popular - Get popular searches
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularSearches = await searchService.getPopularSearches(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        searches: popularSearches,
        total: popularSearches.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular searches',
      message: error.message
    });
  }
});

// GET /api/advanced-search/facets - Get search facets
router.get('/facets', async (req, res) => {
  try {
    const filters = req.query;
    
    const facets = await searchService.generateFacets(
      searchService.generateMockProducts(), 
      filters
    );
    
    res.json({
      success: true,
      data: {
        facets,
        appliedFilters: searchService.getAppliedFilters(filters)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching search facets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search facets',
      message: error.message
    });
  }
});

// POST /api/advanced-search/export - Export search results
router.post('/export', async (req, res) => {
  try {
    const { filters, format = 'csv', limit = 10000 } = req.body;
    
    const exportData = await searchService.exportResults(filters, format, limit);
    
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="search-results.${format}"`);
    res.send(exportData);
  } catch (error) {
    console.error('Error exporting search results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export search results',
      message: error.message
    });
  }
});

// POST /api/advanced-search/presets - Save search preset
router.post('/presets', async (req, res) => {
  try {
    const { name, filters, userId } = req.body;
    
    if (!name || !filters) {
      return res.status(400).json({
        success: false,
        error: 'Name and filters are required'
      });
    }
    
    const preset = await searchService.saveSearchPreset(name, filters, userId);
    
    res.status(201).json({
      success: true,
      data: preset,
      message: 'Search preset saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving search preset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save search preset',
      message: error.message
    });
  }
});

// GET /api/advanced-search/presets - Get search presets
router.get('/presets', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const presets = await searchService.getSearchPresets(userId);
    
    res.json({
      success: true,
      data: {
        presets,
        total: presets.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching search presets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search presets',
      message: error.message
    });
  }
});

// GET /api/advanced-search/analytics - Get search analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    const analytics = await searchService.getSearchAnalytics(timeframe);
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching search analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search analytics',
      message: error.message
    });
  }
});

// Helper function to get content type for export
function getContentType(format) {
  switch (format.toLowerCase()) {
    case 'csv':
      return 'text/csv';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'json':
      return 'application/json';
    default:
      return 'text/plain';
  }
}

module.exports = router;