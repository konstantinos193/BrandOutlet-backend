const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// Helper function to search data
const searchData = (query, dataArray) => {
  const searchTerm = query.toLowerCase();
  return dataArray.filter(item => 
    item.title?.toLowerCase().includes(searchTerm) ||
    item.subtitle?.toLowerCase().includes(searchTerm) ||
    item.description?.toLowerCase().includes(searchTerm) ||
    item.name?.toLowerCase().includes(searchTerm) ||
    item.email?.toLowerCase().includes(searchTerm)
  );
};

// GET /api/search/global - Global search across all entities
router.get('/global', async (req, res) => {
  try {
    const { q: query, limit = 10, type = 'all' } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          results: [],
          total: 0,
          query: query || '',
          suggestions: []
        }
      });
    }
    
    console.log(`🔍 Global search for: "${query}"`);
    
    const db = await getDB();
    const results = [];
    
    // Search products
    if (type === 'all' || type === 'products') {
      try {
        const productsCollection = db.collection('products');
        const products = await productsCollection.find({
          isActive: true,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { 'brand.name': { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .toArray();
        
        products.forEach(product => {
          results.push({
            id: product._id.toString(),
            type: 'product',
            title: product.name,
            subtitle: `${product.brand?.name || 'Unknown'} • ${product.category || 'Other'} • €${product.price || 0}`,
            description: product.description || '',
            metadata: {
              brand: product.brand?.name || 'Unknown',
              category: product.category || 'Other',
              price: product.price || 0,
              status: product.isActive ? 'active' : 'inactive',
              image: product.images?.[0] || '/products/placeholder.jpg'
            }
          });
        });
      } catch (error) {
        console.error('Error searching products:', error);
      }
    }
    
    // Search users
    if (type === 'all' || type === 'users') {
      try {
        const usersCollection = db.collection('users');
        const users = await usersCollection.find({
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { 'profile.firstName': { $regex: query, $options: 'i' } },
            { 'profile.lastName': { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .toArray();
        
        users.forEach(user => {
          results.push({
            id: user._id.toString(),
            type: 'user',
            title: user.username || 'Unknown User',
            subtitle: `${user.email || 'No email'} • ${user.role || 'buyer'}`,
            description: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'No name provided',
            metadata: {
              email: user.email || '',
              role: user.role || 'buyer',
              status: user.status || 'active',
              avatar: user.profile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
            }
          });
        });
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }
    
    // Search orders
    if (type === 'all' || type === 'orders') {
      try {
        const ordersCollection = db.collection('orders');
        const orders = await ordersCollection.find({
          $or: [
            { orderNumber: { $regex: query, $options: 'i' } },
            { 'customer.name': { $regex: query, $options: 'i' } },
            { 'customer.email': { $regex: query, $options: 'i' } },
            { 'seller.name': { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .toArray();
        
        orders.forEach(order => {
          results.push({
            id: order._id.toString(),
            type: 'order',
            title: order.orderNumber || `Order ${order._id.toString().slice(-6)}`,
            subtitle: `${order.customer?.name || 'Unknown Customer'} • €${order.totalAmount || 0}`,
            description: `Status: ${order.status || 'pending'} • Payment: ${order.paymentStatus || 'pending'}`,
            metadata: {
              status: order.status || 'pending',
              paymentStatus: order.paymentStatus || 'pending',
              totalAmount: order.totalAmount || 0,
              customer: order.customer?.name || 'Unknown',
              createdAt: order.createdAt || new Date()
            }
          });
        });
      } catch (error) {
        console.error('Error searching orders:', error);
      }
    }
    
    // Search payments
    if (type === 'all' || type === 'payments') {
      try {
        const paymentsCollection = db.collection('payments');
        const payments = await paymentsCollection.find({
          $or: [
            { transactionId: { $regex: query, $options: 'i' } },
            { 'customer.name': { $regex: query, $options: 'i' } },
            { 'customer.email': { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .toArray();
        
        payments.forEach(payment => {
          results.push({
            id: payment._id.toString(),
            type: 'payment',
            title: payment.transactionId || `Payment ${payment._id.toString().slice(-6)}`,
            subtitle: `${payment.customer?.name || 'Unknown Customer'} • €${payment.amount || 0}`,
            description: `Status: ${payment.status || 'pending'} • Method: ${payment.method || 'unknown'}`,
            metadata: {
              status: payment.status || 'pending',
              amount: payment.amount || 0,
              method: payment.method || 'unknown',
              customer: payment.customer?.name || 'Unknown',
              createdAt: payment.createdAt || new Date()
            }
          });
        });
      } catch (error) {
        console.error('Error searching payments:', error);
      }
    }
    
    // Search refunds
    if (type === 'all' || type === 'refunds') {
      try {
        const refundsCollection = db.collection('refunds');
        const refunds = await refundsCollection.find({
          $or: [
            { refundId: { $regex: query, $options: 'i' } },
            { 'customer.name': { $regex: query, $options: 'i' } },
            { 'customer.email': { $regex: query, $options: 'i' } },
            { reason: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(5)
        .toArray();
        
        refunds.forEach(refund => {
          results.push({
            id: refund._id.toString(),
            type: 'refund',
            title: refund.refundId || `Refund ${refund._id.toString().slice(-6)}`,
            subtitle: `${refund.customer?.name || 'Unknown Customer'} • €${refund.amount || 0}`,
            description: `Status: ${refund.status || 'pending'} • Reason: ${refund.reason || 'No reason provided'}`,
            metadata: {
              status: refund.status || 'pending',
              amount: refund.amount || 0,
              reason: refund.reason || 'No reason provided',
              customer: refund.customer?.name || 'Unknown',
              createdAt: refund.createdAt || new Date()
            }
          });
        });
      } catch (error) {
        console.error('Error searching refunds:', error);
      }
    }
    
    // Limit results
    const limitedResults = results.slice(0, parseInt(limit));
    
    // Generate suggestions based on results
    const suggestions = limitedResults.map(result => ({
      text: result.title,
      type: result.type,
      count: 1
    }));
    
    res.json({
      success: true,
      data: {
        results: limitedResults,
        total: limitedResults.length,
        query: query,
        suggestions: suggestions.slice(0, 5)
      }
    });
    
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message
    });
  }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 5 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: []
        }
      });
    }
    
    console.log(`💡 Getting search suggestions for: "${query}"`);
    
    const db = await getDB();
    const suggestions = [];
    
    try {
      // Get product suggestions
      const productsCollection = db.collection('products');
      const products = await productsCollection.find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { 'brand.name': { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(3)
      .toArray();
      
      products.forEach(product => {
        suggestions.push({
          text: product.name,
          type: 'product',
          category: product.category || 'Other',
          brand: product.brand?.name || 'Unknown'
        });
      });
      
      // Get category suggestions
      const categories = await productsCollection.distinct('category', {
        isActive: true,
        category: { $regex: query, $options: 'i' }
      });
      
      categories.slice(0, 2).forEach(category => {
        suggestions.push({
          text: category,
          type: 'category',
          category: category
        });
      });
      
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
    
    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
      message: error.message
    });
  }
});

// GET /api/search/analytics - Get search analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    console.log(`📊 Getting search analytics for timeframe: ${timeframe}`);
    
    const db = await getDB();
    const searchesCollection = db.collection('search_queries');
    
    // Calculate date range
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 1;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // Get search statistics
    const totalSearches = await searchesCollection.countDocuments({
      timestamp: { $gte: startDate }
    });
    
    const popularQueries = await searchesCollection.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    const searchTrends = await searchesCollection.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]).toArray();
    
    res.json({
      success: true,
      data: {
        totalSearches,
        popularQueries: popularQueries.map(item => ({
          query: item._id,
          count: item.count
        })),
        searchTrends: searchTrends.map(item => ({
          date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
          count: item.count
        })),
        timeframe
      }
    });
    
  } catch (error) {
    console.error('Error getting search analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get search analytics',
      message: error.message
    });
  }
});

module.exports = router;