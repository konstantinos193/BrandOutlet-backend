const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/stats - Get general stats
router.get('/', async (req, res) => {
  try {
    // Get total products count
    const totalProducts = await Product.count();
    
    // Get unique brands count
    const uniqueBrands = await Product.getUniqueBrandsCount();
    
    // Get active products count
    const activeProducts = await Product.count({ isActive: true });
    
    // Get total variants count
    const totalVariants = await Product.getTotalVariantsCount();

    res.json({
      success: true,
      data: {
        totalProducts,
        totalBrands: uniqueBrands,
        activeProducts,
        totalVariants,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

// GET /api/stats/dashboard - Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await Product.getDashboardStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error.message
    });
  }
});

module.exports = router;
