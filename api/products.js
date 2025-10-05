const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

// GET /api/products - Get products with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      brands,
      categories,
      minPrice,
      maxPrice,
      condition,
      size,
      color,
      inStock,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    // Convert query parameters to search filters
    const filters = {
      searchTerm: search,
      brands: brands ? brands.split(',') : undefined,
      categories: categories ? categories.split(',') : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      conditions: condition ? condition.split(',') : undefined,
      sizes: size ? size.split(',') : undefined,
      colors: color ? color.split(',') : undefined,
      availability: inStock === 'true' ? 'in_stock' : inStock === 'false' ? 'out_of_stock' : undefined,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await searchService.searchProducts(filters);

    res.json({
      success: true,
      data: {
        products: result.products,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        facets: result.facets,
        appliedFilters: result.appliedFilters
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// GET /api/products/facets - Get available facets for filtering
router.get('/facets', async (req, res) => {
  try {
    const { category } = req.query;
    
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
    console.error('Error getting product facets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product facets',
      message: error.message
    });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const mockProducts = searchService.generateMockProducts();
    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product with ID ${id} does not exist`
      });
    }
    
    res.json({
      success: true,
      data: product,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const mockProducts = searchService.generateMockProducts();
    const featuredProducts = mockProducts
      .filter(product => product.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: featuredProducts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured products',
      message: error.message
    });
  }
});

// GET /api/products/trending - Get trending products
router.get('/trending', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const mockProducts = searchService.generateMockProducts();
    const trendingProducts = mockProducts
      .filter(product => product.reviewCount >= 50)
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: trendingProducts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending products',
      message: error.message
    });
  }
});

module.exports = router;