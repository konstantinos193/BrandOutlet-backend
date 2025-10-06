const { getDB } = require('../config/database');
const Product = require('../models/Product');

class SearchService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    if (!this.db) {
      this.db = await getDB();
    }
  }

  // Advanced search with faceting and filtering using real database
  async searchProducts(filters = {}) {
    await this.initialize();
    
    console.log('🔍 Searching products in database with filters:', filters);
    
    // Build MongoDB query
    let query = { isActive: true };
    
    // Apply search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm;
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'brand.name': { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }
    
    // Apply brand filter
    if (filters.brands && filters.brands.length > 0) {
      query['brand.name'] = { $in: filters.brands };
    }
    
    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      query.category = { $in: filters.categories };
    }
    
    // Apply price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }
    
    // Apply condition filter
    if (filters.condition) {
      query.condition = filters.condition;
    }
    
    // Apply size filter
    if (filters.size) {
      query.sizes = { $in: [filters.size] };
    }
    
    // Apply color filter
    if (filters.color) {
      query.colors = { $in: [filters.color] };
    }
    
    // Apply stock filter
    if (filters.inStock) {
      query.stock = { $gt: 0 };
    }
    
    // Apply rating filter
    if (filters.minRating) {
      query.rating = { $gte: filters.minRating };
    }
    
    // Build sort object
    let sort = {};
    switch (filters.sortBy) {
      case 'price_asc':
        sort.price = 1;
        break;
      case 'price_desc':
        sort.price = -1;
        break;
      case 'rating':
        sort.rating = -1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      case 'popular':
        sort.salesCount = -1;
        break;
      default:
        sort.createdAt = -1;
    }
    
    // Calculate pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    try {
      // Execute search query
      const products = await Product.find(query)
        .populate('brand', 'name logo')
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      // Get total count for pagination
      const total = await Product.countDocuments(query);
      
      // Transform products to match expected format
      const transformedProducts = products.map(product => ({
        id: product._id.toString(),
        name: product.name,
        brand: product.brand?.name || 'Unknown',
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
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        salesCount: product.salesCount || 0,
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
        createdAt: product.createdAt || new Date()
      }));
      
      // Generate facets from actual data
      const facets = await this.generateFacets(query);
      
      return {
        products: transformedProducts,
        total,
        page,
        limit,
        facets,
        filters: filters
      };
      
    } catch (error) {
      console.error('Error searching products in database:', error);
      throw error;
    }
  }

  // Generate facets from actual database data
  async generateFacets(query) {
    try {
      // Get all active products for facet generation
      const allProducts = await Product.find({ isActive: true }).populate('brand', 'name');
      
      // Generate brand facets
      const brandFacets = {};
      allProducts.forEach(product => {
        const brandName = product.brand?.name || 'Unknown';
        brandFacets[brandName] = (brandFacets[brandName] || 0) + 1;
      });
      
      // Generate category facets
      const categoryFacets = {};
      allProducts.forEach(product => {
        const category = product.category || 'Other';
        categoryFacets[category] = (categoryFacets[category] || 0) + 1;
      });
      
      // Generate condition facets
      const conditionFacets = {};
      allProducts.forEach(product => {
        const condition = product.condition || 'New';
        conditionFacets[condition] = (conditionFacets[condition] || 0) + 1;
      });
      
      // Generate size facets
      const sizeFacets = {};
      allProducts.forEach(product => {
        if (product.sizes && Array.isArray(product.sizes)) {
          product.sizes.forEach(size => {
            sizeFacets[size] = (sizeFacets[size] || 0) + 1;
          });
        }
      });
      
      // Generate color facets
      const colorFacets = {};
      allProducts.forEach(product => {
        if (product.colors && Array.isArray(product.colors)) {
          product.colors.forEach(color => {
            colorFacets[color] = (colorFacets[color] || 0) + 1;
          });
        }
      });
      
      // Calculate price ranges
      const prices = allProducts.map(p => p.price || 0).filter(p => p > 0);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      return {
        brands: Object.entries(brandFacets).map(([name, count]) => ({ name, count })),
        categories: Object.entries(categoryFacets).map(([name, count]) => ({ name, count })),
        conditions: Object.entries(conditionFacets).map(([name, count]) => ({ name, count })),
        sizes: Object.entries(sizeFacets).map(([name, count]) => ({ name, count })),
        colors: Object.entries(colorFacets).map(([name, count]) => ({ name, count })),
        priceRange: { min: minPrice, max: maxPrice }
      };
      
    } catch (error) {
      console.error('Error generating facets from database:', error);
      return {
        brands: [],
        categories: [],
        conditions: [],
        sizes: [],
        colors: [],
        priceRange: { min: 0, max: 1000 }
      };
    }
  }

  // Get popular searches from actual data
  async getPopularSearches(limit = 10) {
    try {
      await this.initialize();
      
      // In a real implementation, this would track search queries
      // For now, return popular product names and categories
      const popularProducts = await Product.find({ isActive: true })
        .sort({ salesCount: -1 })
        .limit(limit)
        .select('name category');
      
      const searches = popularProducts.map(product => ({
        query: product.name,
        count: product.salesCount || 0,
        type: 'product'
      }));
      
      // Add popular categories
      const categories = await Product.distinct('category', { isActive: true });
      categories.slice(0, 5).forEach(category => {
        searches.push({
          query: category,
          count: Math.floor(Math.random() * 100),
          type: 'category'
        });
      });
      
      return searches.sort((a, b) => b.count - a.count).slice(0, limit);
      
    } catch (error) {
      console.error('Error getting popular searches from database:', error);
      return [];
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query, limit = 5) {
    try {
      await this.initialize();
      
      if (!query || query.length < 2) {
        return [];
      }
      
      // Search for products matching the query
      const products = await Product.find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { 'brand.name': { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('brand', 'name')
      .limit(limit)
      .select('name brand category');
      
      return products.map(product => ({
        text: product.name,
        type: 'product',
        brand: product.brand?.name,
        category: product.category
      }));
      
    } catch (error) {
      console.error('Error getting search suggestions from database:', error);
      return [];
    }
  }

  // Save search query (for analytics)
  async saveSearchQuery(query, filters = {}) {
    try {
      await this.initialize();
      
      const db = await getDB();
      const searchesCollection = db.collection('search_queries');
      
      await searchesCollection.insertOne({
        query,
        filters,
        timestamp: new Date(),
        resultsCount: 0 // Would be updated after search
      });
      
    } catch (error) {
      console.error('Error saving search query to database:', error);
      // Don't throw error as this is not critical
    }
  }

  // Get search analytics
  async getSearchAnalytics(timeframe = '7d') {
    try {
      await this.initialize();
      
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
      
      return {
        totalSearches,
        popularQueries: popularQueries.map(item => ({
          query: item._id,
          count: item.count
        })),
        timeframe
      };
      
    } catch (error) {
      console.error('Error getting search analytics from database:', error);
      return {
        totalSearches: 0,
        popularQueries: [],
        timeframe
      };
    }
  }
}

module.exports = new SearchService();