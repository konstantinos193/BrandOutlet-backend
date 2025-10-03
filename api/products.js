const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { ObjectId } = require('mongodb');

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const { 
      brand, 
      category, 
      minPrice, 
      maxPrice, 
      isActive, 
      limit = 20, 
      page = 1 
    } = req.query;

    const filters = {};
    if (brand) filters.brandId = brand;
    if (category) filters.category = category;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const products = await Product.findAll(filters);
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = products.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(products.length / limit),
          totalProducts: products.length,
          hasNext: endIndex < products.length,
          hasPrev: startIndex > 0
        }
      }
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

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
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

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    
    // Generate SKU if not provided
    if (!productData.sku) {
      productData.sku = `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error.message
    });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await product.update(updateData);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      message: error.message
    });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await product.delete();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

// GET /api/products/stats/dashboard - Get product stats for dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await Product.getDashboardStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product stats',
      message: error.message
    });
  }
});

module.exports = router;
