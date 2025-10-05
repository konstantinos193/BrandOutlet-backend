const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getDB } = require('../config/database');

// GET /api/top-selling - Get top-selling products and brands from real database
router.get('/', async (req, res) => {
  try {
    const { limit = 10, category, brand, timeframe = '30d' } = req.query;
    
    console.log('📊 Fetching top-selling data from database');
    
    // Build query filters
    let productFilter = { isActive: true };
    
    if (category) {
      productFilter.category = new RegExp(category, 'i');
    }
    
    if (brand) {
      productFilter.brandName = new RegExp(brand, 'i');
    }
    
    // Get products from database using the correct method
    const products = await Product.findAll(productFilter);
    
    // Sort by salesCount and limit results
    const sortedProducts = products
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, parseInt(limit));
    
    // Calculate sales metrics for each product
    const topProducts = sortedProducts.map((product, index) => {
      const salesVolume = product.salesCount || 0;
      const revenue = salesVolume * (product.price || 0);
      const margin = revenue * 0.2; // 20% margin assumption
      const marginPercentage = 20;
      
      // Calculate trend (mock for now - would need historical data)
      const trend = salesVolume > 10 ? 'up' : salesVolume > 5 ? 'stable' : 'down';
      const trendPercentage = trend === 'up' ? Math.random() * 20 : trend === 'down' ? -Math.random() * 10 : Math.random() * 5;
      
      return {
        id: product._id.toString(),
        name: product.name,
        brand: {
          name: product.brand?.name || 'Unknown',
          logo: product.brand?.logo || '/brands/default.png'
        },
        image: product.images?.[0] || '/products/placeholder.jpg',
        salesVolume,
        revenue: Math.round(revenue),
        margin: Math.round(margin),
        marginPercentage,
        price: product.price || 0,
        category: product.category || 'Other',
        condition: product.condition || 'New',
        trend,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        rank: index + 1
      };
    });
    
    // Get top brands by aggregating product data
    const brandStats = {};
    sortedProducts.forEach(product => {
      const brandName = product.brand?.name || 'Unknown';
      if (!brandStats[brandName]) {
        brandStats[brandName] = {
          name: brandName,
          logo: product.brand?.logo || '/brands/default.png',
          totalSales: 0,
          totalRevenue: 0,
          productCount: 0,
          topProduct: product.name,
          averageMargin: 0
        };
      }
      
      const salesVolume = product.salesCount || 0;
      const revenue = salesVolume * (product.price || 0);
      
      brandStats[brandName].totalSales += salesVolume;
      brandStats[brandName].totalRevenue += revenue;
      brandStats[brandName].productCount += 1;
    });
    
    // Convert to array and sort by total sales
    const topBrands = Object.values(brandStats)
      .map((brand, index) => ({
        ...brand,
        totalRevenue: Math.round(brand.totalRevenue),
        averageMargin: 20, // 20% margin assumption
        trend: brand.totalSales > 50 ? 'up' : brand.totalSales > 20 ? 'stable' : 'down',
        trendPercentage: brand.totalSales > 50 ? Math.random() * 15 : brand.totalSales > 20 ? Math.random() * 5 : -Math.random() * 5,
        rank: index + 1
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, parseInt(limit));
    
    // Calculate summary statistics
    const totalProductSales = topProducts.reduce((sum, p) => sum + p.salesVolume, 0);
    const totalProductRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
    const totalBrandSales = topBrands.reduce((sum, b) => sum + b.totalSales, 0);
    const totalBrandRevenue = topBrands.reduce((sum, b) => sum + b.totalRevenue, 0);
    
    res.json({
      success: true,
      data: {
        products: topProducts,
        brands: topBrands,
        summary: {
          totalProductSales,
          totalProductRevenue,
          totalBrandSales,
          totalBrandRevenue,
          averageProductMargin: topProducts.length > 0 
            ? (topProducts.reduce((sum, p) => sum + p.marginPercentage, 0) / topProducts.length).toFixed(1)
            : 0,
          averageBrandMargin: topBrands.length > 0
            ? (topBrands.reduce((sum, b) => sum + b.averageMargin, 0) / topBrands.length).toFixed(1)
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
    console.error('Error fetching top-selling data from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top-selling data',
      message: error.message
    });
  }
});

// GET /api/top-selling/products - Get only top-selling products
router.get('/products', async (req, res) => {
  try {
    const { limit = 10, category, brand, sortBy = 'salesVolume' } = req.query;
    
    console.log('📊 Fetching top-selling products from database');
    
    // Build query filters
    let productFilter = { isActive: true };
    
    if (category) {
      productFilter.category = new RegExp(category, 'i');
    }
    
    if (brand) {
      productFilter.brandName = new RegExp(brand, 'i');
    }
    
    // Get products from database using the correct method
    const products = await Product.findAll(productFilter);
    
    // Sort by salesCount and limit results
    const sortedProducts = products
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, parseInt(limit));
    
    // Calculate sales metrics for each product
    const topProducts = sortedProducts.map((product, index) => {
      const salesVolume = product.salesCount || 0;
      const revenue = salesVolume * (product.price || 0);
      const margin = revenue * 0.2; // 20% margin assumption
      const marginPercentage = 20;
      
      // Calculate trend (mock for now - would need historical data)
      const trend = salesVolume > 10 ? 'up' : salesVolume > 5 ? 'stable' : 'down';
      const trendPercentage = trend === 'up' ? Math.random() * 20 : trend === 'down' ? -Math.random() * 10 : Math.random() * 5;
      
      return {
        id: product._id.toString(),
        name: product.name,
        brand: {
          name: product.brand?.name || 'Unknown',
          logo: product.brand?.logo || '/brands/default.png'
        },
        image: product.images?.[0] || '/products/placeholder.jpg',
        salesVolume,
        revenue: Math.round(revenue),
        margin: Math.round(margin),
        marginPercentage,
        price: product.price || 0,
        category: product.category || 'Other',
        condition: product.condition || 'New',
        trend,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        rank: index + 1
      };
    });
    
    // Sort by specified field
    topProducts.sort((a, b) => {
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
    
    res.json({
      success: true,
      data: {
        products: topProducts,
        total: topProducts.length,
        filters: { category, brand, sortBy, limit: parseInt(limit) }
      }
    });

  } catch (error) {
    console.error('Error fetching top-selling products from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top-selling products',
      message: error.message
    });
  }
});

// GET /api/top-selling/brands - Get only top-selling brands
router.get('/brands', async (req, res) => {
  try {
    const { limit = 10, sortBy = 'totalSales' } = req.query;
    
    console.log('📊 Fetching top-selling brands from database');
    
    // Get all products to calculate brand stats
    const products = await Product.findAll({ isActive: true });
    
    // Calculate brand statistics
    const brandStats = {};
    products.forEach(product => {
      const brandName = product.brand?.name || 'Unknown';
      if (!brandStats[brandName]) {
        brandStats[brandName] = {
          name: brandName,
          logo: product.brand?.logo || '/brands/default.png',
          totalSales: 0,
          totalRevenue: 0,
          productCount: 0,
          topProduct: product.name,
          averageMargin: 0
        };
      }
      
      const salesVolume = product.salesCount || 0;
      const revenue = salesVolume * (product.price || 0);
      
      brandStats[brandName].totalSales += salesVolume;
      brandStats[brandName].totalRevenue += revenue;
      brandStats[brandName].productCount += 1;
    });
    
    // Convert to array and sort
    let topBrands = Object.values(brandStats)
      .map((brand, index) => ({
        ...brand,
        totalRevenue: Math.round(brand.totalRevenue),
        averageMargin: 20, // 20% margin assumption
        trend: brand.totalSales > 50 ? 'up' : brand.totalSales > 20 ? 'stable' : 'down',
        trendPercentage: brand.totalSales > 50 ? Math.random() * 15 : brand.totalSales > 20 ? Math.random() * 5 : -Math.random() * 5,
        rank: index + 1
      }));
    
    // Sort by specified field
    topBrands.sort((a, b) => {
      if (sortBy === 'revenue') {
        return b.totalRevenue - a.totalRevenue;
      } else if (sortBy === 'margin') {
        return b.averageMargin - a.averageMargin;
      } else {
        return b.totalSales - a.totalSales;
      }
    });
    
    // Apply limit
    topBrands = topBrands.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        brands: topBrands,
        total: topBrands.length,
        filters: { sortBy, limit: parseInt(limit) }
      }
    });

  } catch (error) {
    console.error('Error fetching top-selling brands from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top-selling brands',
      message: error.message
    });
  }
});

// GET /api/top-selling/categories - Get sales by category
router.get('/categories', async (req, res) => {
  try {
    console.log('📊 Fetching category sales data from database');
    
    // Get all products to calculate category stats
    const products = await Product.findAll({ isActive: true });
    
    // Calculate category statistics
    const categoryStats = {};
    products.forEach(product => {
      const category = product.category || 'Other';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          totalSales: 0,
          totalRevenue: 0,
          productCount: 0,
          averageMargin: 0
        };
      }
      
      const salesVolume = product.salesCount || 0;
      const revenue = salesVolume * (product.price || 0);
      
      categoryStats[category].totalSales += salesVolume;
      categoryStats[category].totalRevenue += revenue;
      categoryStats[category].productCount += 1;
    });
    
    // Calculate average margins
    Object.values(categoryStats).forEach(category => {
      const categoryProducts = products.filter(p => (p.category || 'Other') === category.name);
      category.averageMargin = categoryProducts.length > 0
        ? (categoryProducts.reduce((sum, p) => sum + 20, 0) / categoryProducts.length).toFixed(1) // 20% margin assumption
        : 0;
    });
    
    // Convert to array and sort by total sales
    const categoryArray = Object.values(categoryStats)
      .map(category => ({
        ...category,
        totalRevenue: Math.round(category.totalRevenue)
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
    
    res.json({
      success: true,
      data: {
        categories: categoryArray,
        total: categoryArray.length
      }
    });

  } catch (error) {
    console.error('Error fetching category data from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category data',
      message: error.message
    });
  }
});

module.exports = router;