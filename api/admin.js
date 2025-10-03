const express = require('express');
const router = express.Router();

// Mock data for admin dashboard
const mockDashboardData = {
  stats: {
    totalProducts: 1247,
    totalUsers: 3421,
    totalSales: 892,
    totalRevenue: 156789.50,
    pendingVerifications: 23
  },
  recentActivity: {
    products: [
      {
        id: 'prod_001',
        brand: 'Nike',
        name: 'Air Jordan 1 Retro High OG',
        seller: { username: 'sneakerhead_pro' },
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'prod_002',
        brand: 'Supreme',
        name: 'Box Logo Hoodie',
        seller: { username: 'streetwear_king' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 'prod_003',
        brand: 'Louis Vuitton',
        name: 'Neverfull MM',
        seller: { username: 'luxury_finds' },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      }
    ],
    sales: [
      {
        id: 'sale_001',
        product: {
          brand: 'Nike',
          name: 'Air Jordan 1 Retro High OG'
        },
        buyer: 'john_doe',
        price: 180.00,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'sale_002',
        product: {
          brand: 'Supreme',
          name: 'Box Logo Hoodie'
        },
        buyer: 'jane_smith',
        price: 450.00,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: 'sale_003',
        product: {
          brand: 'Louis Vuitton',
          name: 'Neverfull MM'
        },
        buyer: 'luxury_lover',
        price: 1200.00,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ],
    users: [
      {
        id: 'user_001',
        username: 'new_user_123',
        email: 'newuser@example.com',
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
      }
    ]
  },
  pendingVerifications: [
    {
      id: 'verify_001',
      productId: 'prod_004',
      productName: 'Gucci Ace Sneakers',
      brand: 'Gucci',
      price: 650.00,
      seller: { username: 'luxury_seller' },
      images: ['/api/placeholder/200/200', '/api/placeholder/200/200'],
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
    },
    {
      id: 'verify_002',
      productId: 'prod_005',
      productName: 'Off-White Air Max 90',
      brand: 'Nike',
      price: 320.00,
      seller: { username: 'sneaker_expert' },
      images: ['/api/placeholder/200/200'],
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
    },
    {
      id: 'verify_003',
      productId: 'prod_006',
      productName: 'Chanel Classic Flap Bag',
      brand: 'Chanel',
      price: 2800.00,
      seller: { username: 'luxury_collector' },
      images: ['/api/placeholder/200/200', '/api/placeholder/200/200', '/api/placeholder/200/200'],
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    }
  ]
};

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
  try {
    console.log('📊 Admin dashboard data requested');
    
    // Simulate some processing time
    setTimeout(() => {
      res.json({
        success: true,
        data: mockDashboardData,
        timestamp: new Date().toISOString()
      });
    }, 100);
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
