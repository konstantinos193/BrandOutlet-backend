const express = require('express');
const router = express.Router();

// Mock data for top-selling products and brands
const mockTopProducts = [
  {
    id: '1',
    name: 'Air Jordan 1 Retro High OG',
    brand: { name: 'Nike', logo: '/brands/nike.png' },
    image: '/products/jordan1.jpg',
    salesVolume: 45,
    revenue: 8100,
    margin: 1620,
    marginPercentage: 20,
    price: 180,
    category: 'Sneakers',
    condition: 'New',
    trend: 'up',
    trendPercentage: 15.2,
    rank: 1
  },
  {
    id: '2',
    name: 'Supreme Box Logo Hoodie',
    brand: { name: 'Supreme', logo: '/brands/supreme.png' },
    image: '/products/supreme-hoodie.jpg',
    salesVolume: 32,
    revenue: 14400,
    margin: 2880,
    marginPercentage: 20,
    price: 450,
    category: 'Clothing',
    condition: 'New',
    trend: 'up',
    trendPercentage: 8.7,
    rank: 2
  },
  {
    id: '3',
    name: 'Louis Vuitton Neverfull MM',
    brand: { name: 'Louis Vuitton', logo: '/brands/lv.png' },
    image: '/products/lv-neverfull.jpg',
    salesVolume: 18,
    revenue: 21600,
    margin: 4320,
    marginPercentage: 20,
    price: 1200,
    category: 'Bags',
    condition: 'Excellent',
    trend: 'stable',
    trendPercentage: 2.1,
    rank: 3
  },
  {
    id: '4',
    name: 'Off-White x Nike Air Presto',
    brand: { name: 'Off-White', logo: '/brands/offwhite.png' },
    image: '/products/offwhite-presto.jpg',
    salesVolume: 28,
    revenue: 11200,
    margin: 2240,
    marginPercentage: 20,
    price: 400,
    category: 'Sneakers',
    condition: 'New',
    trend: 'down',
    trendPercentage: -5.3,
    rank: 4
  },
  {
    id: '5',
    name: 'Gucci GG Marmont Shoulder Bag',
    brand: { name: 'Gucci', logo: '/brands/gucci.png' },
    image: '/products/gucci-marmont.jpg',
    salesVolume: 22,
    revenue: 19800,
    margin: 3960,
    marginPercentage: 20,
    price: 900,
    category: 'Bags',
    condition: 'Excellent',
    trend: 'up',
    trendPercentage: 12.4,
    rank: 5
  },
  {
    id: '6',
    name: 'Yeezy Boost 350 V2',
    brand: { name: 'Adidas', logo: '/brands/adidas.png' },
    image: '/products/yeezy-350.jpg',
    salesVolume: 38,
    revenue: 15200,
    margin: 3040,
    marginPercentage: 20,
    price: 400,
    category: 'Sneakers',
    condition: 'New',
    trend: 'up',
    trendPercentage: 6.8,
    rank: 6
  },
  {
    id: '7',
    name: 'Chanel Classic Flap Bag',
    brand: { name: 'Chanel', logo: '/brands/chanel.png' },
    image: '/products/chanel-flap.jpg',
    salesVolume: 12,
    revenue: 36000,
    margin: 7200,
    marginPercentage: 20,
    price: 3000,
    category: 'Bags',
    condition: 'Excellent',
    trend: 'stable',
    trendPercentage: 1.5,
    rank: 7
  },
  {
    id: '8',
    name: 'Balenciaga Triple S',
    brand: { name: 'Balenciaga', logo: '/brands/balenciaga.png' },
    image: '/products/balenciaga-triple-s.jpg',
    salesVolume: 25,
    revenue: 12500,
    margin: 2500,
    marginPercentage: 20,
    price: 500,
    category: 'Sneakers',
    condition: 'New',
    trend: 'down',
    trendPercentage: -2.1,
    rank: 8
  }
];

const mockTopBrands = [
  {
    name: 'Nike',
    logo: '/brands/nike.png',
    totalSales: 156,
    totalRevenue: 45600,
    averageMargin: 18.5,
    productCount: 23,
    topProduct: 'Air Jordan 1 Retro High OG',
    trend: 'up',
    trendPercentage: 12.3,
    rank: 1
  },
  {
    name: 'Supreme',
    logo: '/brands/supreme.png',
    totalSales: 89,
    totalRevenue: 38900,
    averageMargin: 22.1,
    productCount: 15,
    topProduct: 'Supreme Box Logo Hoodie',
    trend: 'up',
    trendPercentage: 8.7,
    rank: 2
  },
  {
    name: 'Louis Vuitton',
    logo: '/brands/lv.png',
    totalSales: 45,
    totalRevenue: 67800,
    averageMargin: 25.8,
    productCount: 8,
    topProduct: 'Louis Vuitton Neverfull MM',
    trend: 'stable',
    trendPercentage: 1.2,
    rank: 3
  },
  {
    name: 'Off-White',
    logo: '/brands/offwhite.png',
    totalSales: 67,
    totalRevenue: 28900,
    averageMargin: 19.7,
    productCount: 12,
    topProduct: 'Off-White x Nike Air Presto',
    trend: 'down',
    trendPercentage: -3.4,
    rank: 4
  },
  {
    name: 'Gucci',
    logo: '/brands/gucci.png',
    totalSales: 34,
    totalRevenue: 45600,
    averageMargin: 24.2,
    productCount: 6,
    topProduct: 'Gucci GG Marmont Shoulder Bag',
    trend: 'up',
    trendPercentage: 15.6,
    rank: 5
  },
  {
    name: 'Adidas',
    logo: '/brands/adidas.png',
    totalSales: 78,
    totalRevenue: 31200,
    averageMargin: 16.8,
    productCount: 18,
    topProduct: 'Yeezy Boost 350 V2',
    trend: 'up',
    trendPercentage: 6.8,
    rank: 6
  },
  {
    name: 'Chanel',
    logo: '/brands/chanel.png',
    totalSales: 28,
    totalRevenue: 84000,
    averageMargin: 28.5,
    productCount: 4,
    topProduct: 'Chanel Classic Flap Bag',
    trend: 'stable',
    trendPercentage: 1.5,
    rank: 7
  },
  {
    name: 'Balenciaga',
    logo: '/brands/balenciaga.png',
    totalSales: 42,
    totalRevenue: 21000,
    averageMargin: 20.0,
    productCount: 9,
    topProduct: 'Balenciaga Triple S',
    trend: 'down',
    trendPercentage: -2.1,
    rank: 8
  }
];

// GET /api/top-selling - Get top-selling products and brands
router.get('/', async (req, res) => {
  try {
    const { limit = 10, category, brand, timeframe = '30d' } = req.query;
    
    // Filter products based on query parameters
    let filteredProducts = [...mockTopProducts];
    let filteredBrands = [...mockTopBrands];
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (brand) {
      filteredProducts = filteredProducts.filter(p => 
        p.brand.name.toLowerCase() === brand.toLowerCase()
      );
      filteredBrands = filteredBrands.filter(b => 
        b.name.toLowerCase() === brand.toLowerCase()
      );
    }
    
    // Apply limit
    const limitedProducts = filteredProducts.slice(0, parseInt(limit));
    const limitedBrands = filteredBrands.slice(0, parseInt(limit));
    
    // Calculate summary statistics
    const totalProductSales = limitedProducts.reduce((sum, p) => sum + p.salesVolume, 0);
    const totalProductRevenue = limitedProducts.reduce((sum, p) => sum + p.revenue, 0);
    const totalBrandSales = limitedBrands.reduce((sum, b) => sum + b.totalSales, 0);
    const totalBrandRevenue = limitedBrands.reduce((sum, b) => sum + b.totalRevenue, 0);
    
    res.json({
      success: true,
      data: {
        products: limitedProducts,
        brands: limitedBrands,
        summary: {
          totalProductSales,
          totalProductRevenue,
          totalBrandSales,
          totalBrandRevenue,
          averageProductMargin: limitedProducts.length > 0 
            ? (limitedProducts.reduce((sum, p) => sum + p.marginPercentage, 0) / limitedProducts.length).toFixed(1)
            : 0,
          averageBrandMargin: limitedBrands.length > 0
            ? (limitedBrands.reduce((sum, b) => sum + b.averageMargin, 0) / limitedBrands.length).toFixed(1)
            : 0
        },
        filters: {
          category,
          brand,
          timeframe,
          limit: parseInt(limit)
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching top-selling data:', error);
    res.status(500).json({
      error: 'Failed to fetch top-selling data',
      message: error.message
    });
  }
});

// GET /api/top-selling/products - Get only top-selling products
router.get('/products', async (req, res) => {
  try {
    const { limit = 10, category, brand, sortBy = 'salesVolume' } = req.query;
    
    let filteredProducts = [...mockTopProducts];
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (brand) {
      filteredProducts = filteredProducts.filter(p => 
        p.brand.name.toLowerCase() === brand.toLowerCase()
      );
    }
    
    // Sort by specified field
    filteredProducts.sort((a, b) => {
      if (sortBy === 'revenue') {
        return b.revenue - a.revenue;
      } else if (sortBy === 'margin') {
        return b.margin - a.margin;
      } else if (sortBy === 'marginPercentage') {
        return b.marginPercentage - a.marginPercentage;
      } else {
        return b.salesVolume - a.salesVolume;
      }
    });
    
    const limitedProducts = filteredProducts.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        products: limitedProducts,
        total: limitedProducts.length,
        filters: { category, brand, sortBy, limit: parseInt(limit) }
      }
    });

  } catch (error) {
    console.error('Error fetching top-selling products:', error);
    res.status(500).json({
      error: 'Failed to fetch top-selling products',
      message: error.message
    });
  }
});

// GET /api/top-selling/brands - Get only top-selling brands
router.get('/brands', async (req, res) => {
  try {
    const { limit = 10, sortBy = 'totalSales' } = req.query;
    
    let filteredBrands = [...mockTopBrands];
    
    // Sort by specified field
    filteredBrands.sort((a, b) => {
      if (sortBy === 'revenue') {
        return b.totalRevenue - a.totalRevenue;
      } else if (sortBy === 'margin') {
        return b.averageMargin - a.averageMargin;
      } else {
        return b.totalSales - a.totalSales;
      }
    });
    
    const limitedBrands = filteredBrands.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        brands: limitedBrands,
        total: limitedBrands.length,
        filters: { sortBy, limit: parseInt(limit) }
      }
    });

  } catch (error) {
    console.error('Error fetching top-selling brands:', error);
    res.status(500).json({
      error: 'Failed to fetch top-selling brands',
      message: error.message
    });
  }
});

// GET /api/top-selling/categories - Get sales by category
router.get('/categories', async (req, res) => {
  try {
    const categories = {};
    
    mockTopProducts.forEach(product => {
      if (!categories[product.category]) {
        categories[product.category] = {
          name: product.category,
          totalSales: 0,
          totalRevenue: 0,
          productCount: 0,
          averageMargin: 0
        };
      }
      
      categories[product.category].totalSales += product.salesVolume;
      categories[product.category].totalRevenue += product.revenue;
      categories[product.category].productCount += 1;
    });
    
    // Calculate average margins
    Object.values(categories).forEach(category => {
      const categoryProducts = mockTopProducts.filter(p => p.category === category.name);
      category.averageMargin = categoryProducts.length > 0
        ? (categoryProducts.reduce((sum, p) => sum + p.marginPercentage, 0) / categoryProducts.length).toFixed(1)
        : 0;
    });
    
    const categoryArray = Object.values(categories).sort((a, b) => b.totalSales - a.totalSales);
    
    res.json({
      success: true,
      data: {
        categories: categoryArray,
        total: categoryArray.length
      }
    });

  } catch (error) {
    console.error('Error fetching category data:', error);
    res.status(500).json({
      error: 'Failed to fetch category data',
      message: error.message
    });
  }
});

module.exports = router;
