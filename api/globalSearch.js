const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// Mock search data - replace with actual database queries
const mockSearchData = {
  products: [
    {
      id: '1',
      type: 'product',
      title: 'Nike Air Jordan 1 Retro High',
      subtitle: 'Nike • Sneakers • $150',
      description: 'Classic basketball sneaker in black and white colorway',
      metadata: { brand: 'Nike', category: 'Sneakers', price: 150, status: 'approved' }
    },
    {
      id: '2',
      type: 'product',
      title: 'Adidas Ultraboost 22',
      subtitle: 'Adidas • Running Shoes • $180',
      description: 'Premium running shoe with Boost technology',
      metadata: { brand: 'Adidas', category: 'Running', price: 180, status: 'pending' }
    },
    {
      id: '3',
      type: 'product',
      title: 'Supreme Box Logo Hoodie',
      subtitle: 'Supreme • Streetwear • $400',
      description: 'Iconic streetwear hoodie with box logo',
      metadata: { brand: 'Supreme', category: 'Streetwear', price: 400, status: 'approved' }
    }
  ],
  users: [
    {
      id: '1',
      type: 'user',
      title: 'John Doe',
      subtitle: 'john.doe@example.com • Seller',
      description: 'Active seller with 25 products',
      metadata: { email: 'john.doe@example.com', role: 'seller', status: 'active', productCount: 25 }
    },
    {
      id: '2',
      type: 'user',
      title: 'Alice Johnson',
      subtitle: 'alice.johnson@example.com • Buyer',
      description: 'Premium buyer with 12 orders',
      metadata: { email: 'alice.johnson@example.com', role: 'buyer', status: 'active', orderCount: 12 }
    },
    {
      id: '3',
      type: 'user',
      title: 'Bob Wilson',
      subtitle: 'bob.wilson@example.com • Admin',
      description: 'System administrator',
      metadata: { email: 'bob.wilson@example.com', role: 'admin', status: 'active' }
    }
  ],
  orders: [
    {
      id: '1',
      type: 'order',
      title: 'Order #ORD-2024-001',
      subtitle: 'John Doe • $172.00 • Pending',
      description: 'Nike Air Jordan 1 - Payment pending',
      metadata: { customer: 'John Doe', amount: 172.00, status: 'pending', items: 1 }
    },
    {
      id: '2',
      type: 'order',
      title: 'Order #ORD-2024-002',
      subtitle: 'Alice Johnson • $206.40 • Shipped',
      description: 'Adidas Ultraboost 22 - Shipped via UPS',
      metadata: { customer: 'Alice Johnson', amount: 206.40, status: 'shipped', items: 1 }
    },
    {
      id: '3',
      type: 'order',
      title: 'Order #ORD-2024-003',
      subtitle: 'Mike Brown • $447.00 • Delivered',
      description: 'Supreme Box Logo Hoodie - Delivered',
      metadata: { customer: 'Mike Brown', amount: 447.00, status: 'delivered', items: 1 }
    }
  ],
  payments: [
    {
      id: '1',
      type: 'payment',
      title: 'Payment #pi_1234567890abcdef',
      subtitle: 'Order #ORD-2024-001 • $172.00 • Completed',
      description: 'Stripe payment processed successfully',
      metadata: { orderId: 'ORD-2024-001', amount: 172.00, status: 'completed', method: 'stripe' }
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment #pi_0987654321fedcba',
      subtitle: 'Order #ORD-2024-003 • $447.00 • Completed',
      description: 'Stripe payment processed successfully',
      metadata: { orderId: 'ORD-2024-003', amount: 447.00, status: 'completed', method: 'stripe' }
    }
  ],
  refunds: [
    {
      id: '1',
      type: 'refund',
      title: 'Refund #ref_1234567890',
      subtitle: 'Order #ORD-2024-001 • $172.00 • Pending',
      description: 'Customer changed mind - awaiting approval',
      metadata: { orderId: 'ORD-2024-001', amount: 172.00, status: 'pending', reason: 'Customer changed mind' }
    },
    {
      id: '2',
      type: 'refund',
      title: 'Refund #ref_0987654321',
      subtitle: 'Order #ORD-2024-002 • $100.00 • Approved',
      description: 'Partial refund for size issue - approved',
      metadata: { orderId: 'ORD-2024-002', amount: 100.00, status: 'approved', reason: 'Size issue' }
    }
  ]
};

// Search function
const searchData = (query, data) => {
  const searchTerm = query.toLowerCase();
  
  return data.filter(item => 
    item.title.toLowerCase().includes(searchTerm) ||
    item.subtitle.toLowerCase().includes(searchTerm) ||
    (item.description && item.description.toLowerCase().includes(searchTerm)) ||
    Object.values(item.metadata || {}).some(value => 
      String(value).toLowerCase().includes(searchTerm)
    )
  );
};

// Global search endpoint
router.get('/', async (req, res) => {
  try {
    const { q: query, type, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.json({ results: [] });
    }

    let allResults = [];

    // Search across all data types
    if (!type || type === 'all' || type === 'products') {
      const productResults = searchData(query, mockSearchData.products);
      allResults = [...allResults, ...productResults];
    }

    if (!type || type === 'all' || type === 'users') {
      const userResults = searchData(query, mockSearchData.users);
      allResults = [...allResults, ...userResults];
    }

    if (!type || type === 'all' || type === 'orders') {
      const orderResults = searchData(query, mockSearchData.orders);
      allResults = [...allResults, ...orderResults];
    }

    if (!type || type === 'all' || type === 'payments') {
      const paymentResults = searchData(query, mockSearchData.payments);
      allResults = [...allResults, ...paymentResults];
    }

    if (!type || type === 'all' || type === 'refunds') {
      const refundResults = searchData(query, mockSearchData.refunds);
      allResults = [...allResults, ...refundResults];
    }

    // Sort by relevance (exact matches first, then partial matches)
    allResults.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      const searchTerm = query.toLowerCase();
      
      const aExactMatch = aTitle.startsWith(searchTerm);
      const bExactMatch = bTitle.startsWith(searchTerm);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      return aTitle.localeCompare(bTitle);
    });

    // Limit results
    const limitedResults = allResults.slice(0, parseInt(limit));

    res.json({ 
      results: limitedResults,
      total: allResults.length,
      query: query
    });
  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search suggestions endpoint
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.trim().length < 1) {
      // Return popular searches
      const popularSearches = [
        'Nike Air Jordan',
        'pending orders',
        'new users',
        'revenue analytics',
        'Adidas Ultraboost',
        'Supreme hoodie',
        'payment issues',
        'refund requests'
      ];
      
      return res.json({ suggestions: popularSearches });
    }

    // Generate suggestions based on query
    const suggestions = [];
    const searchTerm = query.toLowerCase();
    
    // Add exact matches from data
    Object.values(mockSearchData).forEach(dataArray => {
      dataArray.forEach(item => {
        if (item.title.toLowerCase().includes(searchTerm)) {
          suggestions.push(item.title);
        }
      });
    });

    // Add common search patterns
    const commonPatterns = [
      `${query} products`,
      `${query} orders`,
      `${query} users`,
      `pending ${query}`,
      `new ${query}`,
      `${query} analytics`
    ];
    
    suggestions.push(...commonPatterns);

    // Remove duplicates and limit
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 8);

    res.json({ suggestions: uniqueSuggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Search analytics endpoint
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Mock analytics data
    const analytics = {
      totalSearches: 1250,
      uniqueQueries: 890,
      topQueries: [
        { query: 'Nike Air Jordan', count: 45 },
        { query: 'pending orders', count: 32 },
        { query: 'new users', count: 28 },
        { query: 'revenue analytics', count: 25 },
        { query: 'Adidas Ultraboost', count: 22 }
      ],
      searchTypes: {
        products: 45,
        users: 30,
        orders: 20,
        payments: 3,
        refunds: 2
      },
      period: period
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({ error: 'Failed to get search analytics' });
  }
});

module.exports = router;
