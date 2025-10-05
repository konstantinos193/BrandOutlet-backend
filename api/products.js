const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getDB } = require('../config/database');

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

    console.log('🛍️ Fetching products from database');

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
      price: product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      images: product.images || ['/products/placeholder.jpg'],
      category: product.category || 'Other',
      condition: product.condition || 'New',
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock || 0,
      description: product.description || '',
      features: product.features || [],
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured || false,
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      salesCount: product.salesCount || 0,
      createdAt: product.createdAt || new Date(),
      updatedAt: product.updatedAt || new Date()
    }));

    res.json({
      success: true,
      data: {
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
      }
    });

  } catch (error) {
    console.error('Error fetching products from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🛍️ Fetching product ${id} from database`);

    const product = await Product.findById(id).populate('brand', 'name logo');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const transformedProduct = {
      id: product._id.toString(),
      name: product.name,
      brand: {
        name: product.brand?.name || 'Unknown',
        logo: product.brand?.logo || '/brands/default.png'
      },
      price: product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      images: product.images || ['/products/placeholder.jpg'],
      category: product.category || 'Other',
      condition: product.condition || 'New',
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock || 0,
      description: product.description || '',
      features: product.features || [],
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured || false,
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      salesCount: product.salesCount || 0,
      createdAt: product.createdAt || new Date(),
      updatedAt: product.updatedAt || new Date()
    };

    res.json({
      success: true,
      data: transformedProduct
    });

  } catch (error) {
    console.error('Error fetching product from database:', error);
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

    console.log('⭐ Fetching featured products from database');

    const products = await Product.find({ 
      isActive: true, 
      isFeatured: true 
    })
      .populate('brand', 'name logo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const transformedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      brand: {
        name: product.brand?.name || 'Unknown',
        logo: product.brand?.logo || '/brands/default.png'
      },
      price: product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      images: product.images || ['/products/placeholder.jpg'],
      category: product.category || 'Other',
      condition: product.condition || 'New',
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      salesCount: product.salesCount || 0
    }));

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        total: transformedProducts.length
      }
    });

  } catch (error) {
    console.error('Error fetching featured products from database:', error);
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

    console.log('🔥 Fetching trending products from database');

    const products = await Product.find({ 
      isActive: true 
    })
      .populate('brand', 'name logo')
      .sort({ salesCount: -1, rating: -1 })
      .limit(parseInt(limit));

    const transformedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      brand: {
        name: product.brand?.name || 'Unknown',
        logo: product.brand?.logo || '/brands/default.png'
      },
      price: product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      images: product.images || ['/products/placeholder.jpg'],
      category: product.category || 'Other',
      condition: product.condition || 'New',
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      salesCount: product.salesCount || 0
    }));

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        total: transformedProducts.length
      }
    });

  } catch (error) {
    console.error('Error fetching trending products from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending products',
      message: error.message
    });
  }
});

// GET /api/products/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 Fetching product categories from database');

    const categories = await Product.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: {
        categories: categories.filter(cat => cat).map(category => ({
          name: category,
          count: 0 // Would need to calculate this separately
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching categories from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// GET /api/products/brands - Get all brands
router.get('/brands', async (req, res) => {
  try {
    console.log('🏷️ Fetching product brands from database');

    const brands = await Product.distinct('brand.name', { isActive: true });

    res.json({
      success: true,
      data: {
        brands: brands.filter(brand => brand).map(brand => ({
          name: brand,
          count: 0 // Would need to calculate this separately
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching brands from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands',
      message: error.message
    });
  }
});

module.exports = router;