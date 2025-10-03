const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getDB } = require('../config/database');

// Helper function to get real dashboard data
const getDashboardData = async () => {
  try {
    const db = getDB();
    
    // Get product stats
    const productStats = await Product.getDashboardStats();
    
    // Get recent products
    const recentProducts = await Product.getRecentProducts(5);
    
    // Get pending verifications (products that need verification)
    const pendingVerifications = await Product.findAll({
      'authenticity.isVerified': false,
      isActive: true
    });

    // Mock user and sales data (replace with real data when you have user/sales collections)
    const mockUserStats = {
      totalUsers: 3421,
      totalSales: 892,
      totalRevenue: 156789.50
    };

    return {
      stats: {
        totalProducts: productStats.totalProducts,
        totalUsers: mockUserStats.totalUsers,
        totalSales: mockUserStats.totalSales,
        totalRevenue: mockUserStats.totalRevenue,
        pendingVerifications: pendingVerifications.length
      },
      recentActivity: {
        products: recentProducts.map(product => ({
          id: product.id,
          brand: product.brand.name,
          name: product.name,
          seller: { username: 'admin' }, // Replace with real seller data when available
          createdAt: product.createdAt.toISOString()
        })),
        sales: [], // TODO: Add real sales data when you have sales collection
        users: []  // TODO: Add real user data when you have users collection
      },
      pendingVerifications: pendingVerifications.map(product => ({
        id: product.id,
        productId: product.id,
        productName: product.name,
        brand: product.brand.name,
        price: product.price,
        seller: { username: 'admin' }, // Replace with real seller data
        images: product.images,
        submittedAt: product.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
};

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Admin dashboard data requested');
    
    const dashboardData = await getDashboardData();
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// PUT /api/admin/products/:id/verify
router.put('/products/:id/verify', (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    console.log(`🔍 Product verification request: ${action} for product ${id}`);
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "approve" or "reject"'
      });
    }
    
    // Simulate verification processing
    setTimeout(() => {
      res.json({
        success: true,
        message: `Product ${id} ${action}d successfully`,
        data: {
          productId: id,
          action,
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'admin'
        }
      });
    }, 200);
  } catch (error) {
    console.error('Error updating product verification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product verification',
      message: error.message
    });
  }
});

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    console.log('📈 Admin stats requested');
    
    res.json({
      success: true,
      data: mockDashboardData.stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

// GET /api/admin/verifications
router.get('/verifications', (req, res) => {
  try {
    console.log('🔍 Pending verifications requested');
    
    res.json({
      success: true,
      data: mockDashboardData.pendingVerifications,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch verifications',
      message: error.message
    });
  }
});

module.exports = router;
