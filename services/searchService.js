const { connectDB } = require('../config/database');

class SearchService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    if (!this.db) {
      this.db = await connectDB();
    }
  }

  // Advanced search with faceting and filtering
  async searchProducts(filters = {}) {
    await this.initialize();
    
    // In a real implementation, this would query MongoDB
    // For now, we'll simulate the search with mock data
    const mockProducts = this.generateMockProducts();
    
    let results = [...mockProducts];
    
    // Apply search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply brand filter
    if (filters.brands && filters.brands.length > 0) {
      results = results.filter(product => 
        filters.brands.includes(product.brand)
      );
    }
    
    // Apply category filter
    if (filters.categories && filters.categories.length > 0) {
      results = results.filter(product => 
        filters.categories.includes(product.category)
      );
    }
    
    // Apply price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      results = results.filter(product => {
        const price = product.price;
        const minPrice = filters.minPrice || 0;
        const maxPrice = filters.maxPrice || Infinity;
        return price >= minPrice && price <= maxPrice;
      });
    }
    
    // Apply size filter
    if (filters.sizes && filters.sizes.length > 0) {
      results = results.filter(product => 
        product.sizes.some(size => filters.sizes.includes(size))
      );
    }
    
    // Apply condition filter
    if (filters.conditions && filters.conditions.length > 0) {
      results = results.filter(product => 
        filters.conditions.includes(product.condition)
      );
    }
    
    // Apply color filter
    if (filters.colors && filters.colors.length > 0) {
      results = results.filter(product => 
        filters.colors.includes(product.color)
      );
    }
    
    // Apply availability filter
    if (filters.availability) {
      if (filters.availability === 'in_stock') {
        results = results.filter(product => product.stock > 0);
      } else if (filters.availability === 'out_of_stock') {
        results = results.filter(product => product.stock === 0);
      }
    }
    
    // Apply sorting
    if (filters.sortBy) {
      results = this.sortProducts(results, filters.sortBy, filters.sortOrder || 'asc');
    }
    
    // Generate facets for filtering
    const facets = this.generateFacets(mockProducts, filters);
    
    // Apply pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedResults = results.slice(startIndex, endIndex);
    
    return {
      products: paginatedResults,
      total: results.length,
      page,
      limit,
      totalPages: Math.ceil(results.length / limit),
      facets,
      appliedFilters: this.getAppliedFilters(filters)
    };
  }

  // Generate mock products for testing
  generateMockProducts() {
    const brands = ['Nike', 'Adidas', 'Jordan', 'Supreme', 'Off-White', 'Yeezy', 'Travis Scott', 'Dior', 'Gucci', 'Louis Vuitton'];
    const categories = ['Sneakers', 'Clothing', 'Accessories', 'Bags', 'Watches'];
    const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
    const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6', '7', '8', '9', '10', '11', '12'];
    
    const products = [];
    
    for (let i = 1; i <= 1000; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      products.push({
        id: `product-${i}`,
        name: `${brand} ${category} ${i}`,
        brand,
        category,
        description: `High-quality ${brand} ${category.toLowerCase()} in ${color.toLowerCase()}`,
        price: Math.floor(Math.random() * 2000) + 50,
        originalPrice: Math.floor(Math.random() * 2500) + 100,
        condition,
        color,
        sizes: sizes.slice(0, Math.floor(Math.random() * 5) + 1),
        stock: Math.floor(Math.random() * 20),
        images: [`https://example.com/image${i}-1.jpg`, `https://example.com/image${i}-2.jpg`],
        tags: [brand.toLowerCase(), category.toLowerCase(), color.toLowerCase(), condition.toLowerCase()],
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 100),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }
    
    return products;
  }

  // Generate facets for filtering
  generateFacets(allProducts, currentFilters) {
    const facets = {};
    
    // Brand facets
    const brandCounts = {};
    allProducts.forEach(product => {
      brandCounts[product.brand] = (brandCounts[product.brand] || 0) + 1;
    });
    facets.brands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ value: brand, count }))
      .sort((a, b) => b.count - a.count);
    
    // Category facets
    const categoryCounts = {};
    allProducts.forEach(product => {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    });
    facets.categories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ value: category, count }))
      .sort((a, b) => b.count - a.count);
    
    // Condition facets
    const conditionCounts = {};
    allProducts.forEach(product => {
      conditionCounts[product.condition] = (conditionCounts[product.condition] || 0) + 1;
    });
    facets.conditions = Object.entries(conditionCounts)
      .map(([condition, count]) => ({ value: condition, count }))
      .sort((a, b) => b.count - a.count);
    
    // Color facets
    const colorCounts = {};
    allProducts.forEach(product => {
      colorCounts[product.color] = (colorCounts[product.color] || 0) + 1;
    });
    facets.colors = Object.entries(colorCounts)
      .map(([color, count]) => ({ value: color, count }))
      .sort((a, b) => b.count - a.count);
    
    // Size facets
    const sizeCounts = {};
    allProducts.forEach(product => {
      product.sizes.forEach(size => {
        sizeCounts[size] = (sizeCounts[size] || 0) + 1;
      });
    });
    facets.sizes = Object.entries(sizeCounts)
      .map(([size, count]) => ({ value: size, count }))
      .sort((a, b) => b.count - a.count);
    
    // Price range facets
    const prices = allProducts.map(p => p.price).sort((a, b) => a - b);
    const minPrice = Math.floor(prices[0] / 100) * 100;
    const maxPrice = Math.ceil(prices[prices.length - 1] / 100) * 100;
    
    facets.priceRanges = [
      { label: 'Under $100', min: 0, max: 100, count: prices.filter(p => p < 100).length },
      { label: '$100 - $500', min: 100, max: 500, count: prices.filter(p => p >= 100 && p < 500).length },
      { label: '$500 - $1000', min: 500, max: 1000, count: prices.filter(p => p >= 500 && p < 1000).length },
      { label: '$1000 - $2000', min: 1000, max: 2000, count: prices.filter(p => p >= 1000 && p < 2000).length },
      { label: 'Over $2000', min: 2000, max: Infinity, count: prices.filter(p => p >= 2000).length }
    ];
    
    return facets;
  }

  // Sort products
  sortProducts(products, sortBy, sortOrder = 'asc') {
    return products.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'brand':
          aValue = a.brand.toLowerCase();
          bValue = b.brand.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
  }

  // Get applied filters summary
  getAppliedFilters(filters) {
    const applied = [];
    
    if (filters.searchTerm) {
      applied.push({ type: 'search', label: 'Search', value: filters.searchTerm });
    }
    
    if (filters.brands && filters.brands.length > 0) {
      applied.push({ type: 'brands', label: 'Brands', value: filters.brands.join(', ') });
    }
    
    if (filters.categories && filters.categories.length > 0) {
      applied.push({ type: 'categories', label: 'Categories', value: filters.categories.join(', ') });
    }
    
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const min = filters.minPrice || 0;
      const max = filters.maxPrice || '∞';
      applied.push({ type: 'price', label: 'Price Range', value: `$${min} - $${max}` });
    }
    
    if (filters.conditions && filters.conditions.length > 0) {
      applied.push({ type: 'conditions', label: 'Conditions', value: filters.conditions.join(', ') });
    }
    
    if (filters.colors && filters.colors.length > 0) {
      applied.push({ type: 'colors', label: 'Colors', value: filters.colors.join(', ') });
    }
    
    if (filters.sizes && filters.sizes.length > 0) {
      applied.push({ type: 'sizes', label: 'Sizes', value: filters.sizes.join(', ') });
    }
    
    return applied;
  }

  // Get search suggestions
  async getSuggestions(query, limit = 10) {
    await this.initialize();
    
    if (!query || query.length < 2) {
      return [];
    }
    
    const mockProducts = this.generateMockProducts();
    const suggestions = new Set();
    
    // Add product name suggestions
    mockProducts.forEach(product => {
      if (product.name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add({
          type: 'product',
          text: product.name,
          id: product.id,
          category: 'Products'
        });
      }
    });
    
    // Add brand suggestions
    const brands = [...new Set(mockProducts.map(p => p.brand))];
    brands.forEach(brand => {
      if (brand.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add({
          type: 'brand',
          text: brand,
          id: brand,
          category: 'Brands'
        });
      }
    });
    
    // Add category suggestions
    const categories = [...new Set(mockProducts.map(p => p.category))];
    categories.forEach(category => {
      if (category.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add({
          type: 'category',
          text: category,
          id: category,
          category: 'Categories'
        });
      }
    });
    
    return Array.from(suggestions).slice(0, limit);
  }

  // Get popular searches
  async getPopularSearches(limit = 10) {
    await this.initialize();
    
    // Mock popular searches
    const popularSearches = [
      'Nike Air Jordan',
      'Supreme Box Logo',
      'Yeezy 350',
      'Off-White',
      'Travis Scott',
      'Dior Jordan',
      'Gucci Sneakers',
      'Louis Vuitton',
      'Nike Dunk',
      'Adidas Yeezy'
    ];
    
    return popularSearches.slice(0, limit).map((search, index) => ({
      text: search,
      count: Math.floor(Math.random() * 1000) + 100,
      rank: index + 1
    }));
  }
}

module.exports = new SearchService();
