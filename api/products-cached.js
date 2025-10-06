const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const cacheService = require('../services/cacheService');

// GET /api/products - Get products with caching
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

    console.log('🛍️ Fetching products with caching');

    // Create cache parameters
    const cacheParams = {
      search,
      brands,
      categories,
      minPrice,
      maxPrice,
      condition,
      size,
      color,
      inStock,
      sortBy,
      sortOrder,
      page,
      limit
    };

    // Use cache service to get products
    const result = await cacheService.cacheProducts(cacheParams, async () => {
      console.log('📦 Cache MISS - Fetching from database');

      // Build query filters
      let query = { isActive: true };

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'brand.name': { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      // Brand filter
      if (brands) {
        const brandArray = brands.split(',');
        query['brand.name'] = { $in: brandArray };
      }

      // Category filter
      if (categories) {
        const categoryArray = categories.split(',');
        query.category = { $in: categoryArray };
      }

      // Price range filter
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      // Condition filter
      if (condition) {
        query.condition = condition;
      }

      // Size filter
      if (size) {
        query.sizes = { $in: [size] };
      }

      // Color filter
      if (color) {
        query.colors = { $in: [color] };
      }

      // Stock filter
      if (inStock === 'true') {
        query.stock = { $gt: 0 };
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get products from database
      const products = await Product.find(query)
        .populate('brand', 'name logo')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Product.countDocuments(query);

      // Transform products to match expected format
      const transformedProducts = products.map(product => ({
        id: product._id.toString(),
        name: product.name,
        brand: {
          name: product.brand?.name || 'Unknown',
          logo: product.brand?.logo || '/brands/default.png'
        },
        category: product.category,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        condition: product.condition,
        color: product.color,
        sizes: product.sizes,
        stock: product.stock,
        images: product.images,
        tags: product.tags,
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }));

      return {
        products: transformedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          search,
          brands: brands ? brands.split(',') : [],
          categories: categories ? categories.split(',') : [],
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          condition,
          size,
          color,
          inStock: inStock === 'true'
        }
      };
    });

    res.json({
      success: true,
      data: result
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

// GET /api/products/facets - Get facets with caching
router.get('/facets', async (req, res) => {
  try {
    console.log('📊 Fetching product facets with caching');

    const result = await cacheService.cacheFacets({}, async () => {
      console.log('📦 Cache MISS - Fetching facets from database');

      const [brands, categories, conditions] = await Promise.all([
        Product.distinct('brand.name', { isActive: true }),
        Product.distinct('category', { isActive: true }),
        Product.distinct('condition', { isActive: true })
      ]);

      return {
        brands: brands.filter(Boolean).map(brand => ({ value: brand, count: 0 })),
        categories: categories.filter(Boolean).map(category => ({ value: category, count: 0 })),
        conditions: conditions.filter(Boolean).map(condition => ({ value: condition, count: 0 }))
      };
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching facets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch facets',
      message: error.message
    });
  }
});

// GET /api/products/featured - Get featured products with caching
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    console.log('⭐ Fetching featured products with caching');

    const result = await cacheService.cacheWithTTL(
      `featured-products:${limit}`,
      async () => {
        console.log('📦 Cache MISS - Fetching featured products from database');

        const products = await Product.find({ 
          isActive: true, 
          featured: true 
        })
        .populate('brand', 'name logo')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

        return products.map(product => ({
          id: product._id.toString(),
          name: product.name,
          brand: {
            name: product.brand?.name || 'Unknown',
            logo: product.brand?.logo || '/brands/default.png'
          },
          category: product.category,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          condition: product.condition,
          images: product.images,
          rating: product.rating || 0,
          reviewCount: product.reviewCount || 0
        }));
      },
      300 // 5 minutes cache
    );

    res.json({
      success: true,
      data: {
        products: result,
        total: result.length
      }
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

// Cache invalidation endpoints
router.post('/invalidate-cache', async (req, res) => {
  try {
    console.log('🗑️ Invalidating products cache');
    
    await cacheService.invalidateProducts();
    
    res.json({
      success: true,
      message: 'Products cache invalidated successfully'
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
      message: error.message
    });
  }
});

module.exports = router;
