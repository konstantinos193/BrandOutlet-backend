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
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required',
        message: 'Please provide a search query'
      });
    }
    
    const suggestions = await searchService.getSuggestions(query, parseInt(limit));
    
    res.json({
      success: true,
      data: suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
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
      data: popularSearches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting popular searches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular searches',
      message: error.message
    });
  }
});

// GET /api/advanced-search/facets - Get available facets for filtering
router.get('/facets', async (req, res) => {
  try {
    const { category } = req.query;
    
    // Generate facets based on category if provided
    const mockProducts = searchService.generateMockProducts();
    let filteredProducts = mockProducts;
    
    if (category) {
      filteredProducts = mockProducts.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    const facets = searchService.generateFacets(filteredProducts, {});
    
    res.json({
      success: true,
      data: facets,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting facets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get facets',
      message: error.message
    });
  }
});

// GET /api/advanced-search/autocomplete - Get autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const { q: query, type = 'all', limit = 5 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString()
      });
    }
    
    const suggestions = await searchService.getSuggestions(query, parseInt(limit));
    
    // Filter by type if specified
    let filteredSuggestions = suggestions;
    if (type !== 'all') {
      filteredSuggestions = suggestions.filter(suggestion => suggestion.type === type);
    }
    
    res.json({
      success: true,
      data: filteredSuggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting autocomplete:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get autocomplete suggestions',
      message: error.message
    });
  }
});

// POST /api/advanced-search/save-search - Save search query for analytics
router.post('/save-search', async (req, res) => {
  try {
    const { query, filters, resultsCount, userId } = req.body;
    
    // In a real implementation, you would save this to a database
    // For now, we'll just log it
    console.log('Search saved:', {
      query,
      filters,
      resultsCount,
      userId,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Search saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save search',
      message: error.message
    });
  }
});

// GET /api/advanced-search/trending - Get trending search terms
router.get('/trending', async (req, res) => {
  try {
    const { period = '7d', limit = 20 } = req.query;
    
    // Mock trending searches based on period
    const trendingSearches = {
      '1d': [
        { term: 'Nike Air Jordan 1', count: 1250, change: '+15%' },
        { term: 'Supreme Box Logo', count: 980, change: '+8%' },
        { term: 'Yeezy 350 V2', count: 850, change: '+12%' },
        { term: 'Off-White Nike', count: 720, change: '+5%' },
        { term: 'Travis Scott Jordan', count: 680, change: '+20%' }
      ],
      '7d': [
        { term: 'Nike Air Jordan', count: 8500, change: '+25%' },
        { term: 'Supreme', count: 7200, change: '+18%' },
        { term: 'Yeezy', count: 6800, change: '+22%' },
        { term: 'Off-White', count: 5600, change: '+15%' },
        { term: 'Travis Scott', count: 4800, change: '+30%' },
        { term: 'Dior Jordan', count: 4200, change: '+35%' },
        { term: 'Gucci Sneakers', count: 3800, change: '+12%' },
        { term: 'Louis Vuitton', count: 3200, change: '+8%' }
      ],
      '30d': [
        { term: 'Nike', count: 45000, change: '+40%' },
        { term: 'Jordan', count: 38000, change: '+35%' },
        { term: 'Supreme', count: 32000, change: '+28%' },
        { term: 'Yeezy', count: 28000, change: '+45%' },
        { term: 'Off-White', count: 22000, change: '+20%' },
        { term: 'Travis Scott', count: 18000, change: '+50%' },
        { term: 'Dior', count: 15000, change: '+60%' },
        { term: 'Gucci', count: 12000, change: '+15%' },
        { term: 'Louis Vuitton', count: 10000, change: '+10%' },
        { term: 'Adidas', count: 8000, change: '+5%' }
      ]
    };
    
    const data = trendingSearches[period] || trendingSearches['7d'];
    const limitedData = data.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedData,
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting trending searches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trending searches',
      message: error.message
    });
  }
});

module.exports = router;