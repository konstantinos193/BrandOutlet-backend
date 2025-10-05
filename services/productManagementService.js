const { connectDB } = require('../config/database');

class ProductManagementService {
  constructor() {
    this.db = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async initialize() {
    if (!this.db) {
      this.db = await connectDB();
    }
  }

  // Get cached data or generate new data
  async getCachedData(key, generator, ttl = this.cacheTimeout) {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }
    
    const data = await generator();
    this.cache.set(key, {
      data,
      timestamp: now
    });
    
    return data;
  }

  // Get all products with pagination and filtering
  async getProducts(options = {}) {
    await this.initialize();
    
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      brand = '',
      status = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

    const cacheKey = `products-${page}-${limit}-${search}-${category}-${brand}-${status}-${sortBy}-${sortOrder}`;
    return this.getCachedData(cacheKey, async () => {
      // In a real implementation, this would query MongoDB
      const mockProducts = this.generateMockProducts();
      
      let filteredProducts = [...mockProducts];
      
      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase();
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (category) {
        filteredProducts = filteredProducts.filter(product =>
          product.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      if (brand) {
        filteredProducts = filteredProducts.filter(product =>
          product.brand.toLowerCase() === brand.toLowerCase()
        );
      }
      
      if (status) {
        filteredProducts = filteredProducts.filter(product =>
          product.status === status
        );
      }
      
      // Apply sorting
      filteredProducts = this.sortProducts(filteredProducts, sortBy, sortOrder);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      
      return {
        products: paginatedProducts,
        total: filteredProducts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredProducts.length / limit),
        hasNextPage: endIndex < filteredProducts.length,
        hasPrevPage: page > 1
      };
    });
  }

  // Execute bulk operations on products
  async executeBulkOperation(operation, productIds, options = {}) {
    await this.initialize();
    
    const results = {
      success: [],
      failed: [],
      total: productIds.length,
      operation
    };
    
    for (const productId of productIds) {
      try {
        const result = await this.executeSingleOperation(operation, productId, options);
        results.success.push({
          productId,
          result
        });
      } catch (error) {
        results.failed.push({
          productId,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Execute single operation on a product
  async executeSingleOperation(operation, productId, options = {}) {
    await this.initialize();
    
    // In a real implementation, this would update MongoDB
    const mockProducts = this.generateMockProducts();
    const product = mockProducts.find(p => p.id === productId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    switch (operation) {
      case 'updateStatus':
        return this.updateProductStatus(productId, options.status);
      
      case 'updatePrice':
        return this.updateProductPrice(productId, options.price);
      
      case 'updateStock':
        return this.updateProductStock(productId, options.stock);
      
      case 'updateCategory':
        return this.updateProductCategory(productId, options.category);
      
      case 'updateBrand':
        return this.updateProductBrand(productId, options.brand);
      
      case 'delete':
        return this.deleteProduct(productId);
      
      case 'duplicate':
        return this.duplicateProduct(productId);
      
      case 'export':
        return this.exportProduct(productId);
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  // Update product status
  async updateProductStatus(productId, status) {
    // In a real implementation, this would update MongoDB
    console.log(`Updating product ${productId} status to ${status}`);
    
    return {
      productId,
      status,
      updatedAt: new Date().toISOString(),
      message: `Product status updated to ${status}`
    };
  }

  // Update product price
  async updateProductPrice(productId, price) {
    // In a real implementation, this would update MongoDB
    console.log(`Updating product ${productId} price to ${price}`);
    
    return {
      productId,
      price: parseFloat(price),
      updatedAt: new Date().toISOString(),
      message: `Product price updated to $${price}`
    };
  }

  // Update product stock
  async updateProductStock(productId, stock) {
    // In a real implementation, this would update MongoDB
    console.log(`Updating product ${productId} stock to ${stock}`);
    
    return {
      productId,
      stock: parseInt(stock),
      updatedAt: new Date().toISOString(),
      message: `Product stock updated to ${stock}`
    };
  }

  // Update product category
  async updateProductCategory(productId, category) {
    // In a real implementation, this would update MongoDB
    console.log(`Updating product ${productId} category to ${category}`);
    
    return {
      productId,
      category,
      updatedAt: new Date().toISOString(),
      message: `Product category updated to ${category}`
    };
  }

  // Update product brand
  async updateProductBrand(productId, brand) {
    // In a real implementation, this would update MongoDB
    console.log(`Updating product ${productId} brand to ${brand}`);
    
    return {
      productId,
      brand,
      updatedAt: new Date().toISOString(),
      message: `Product brand updated to ${brand}`
    };
  }

  // Delete product
  async deleteProduct(productId) {
    // In a real implementation, this would delete from MongoDB
    console.log(`Deleting product ${productId}`);
    
    return {
      productId,
      deletedAt: new Date().toISOString(),
      message: 'Product deleted successfully'
    };
  }

  // Duplicate product
  async duplicateProduct(productId) {
    // In a real implementation, this would create a copy in MongoDB
    console.log(`Duplicating product ${productId}`);
    
    const newProductId = `product-${Date.now()}`;
    
    return {
      originalProductId: productId,
      newProductId,
      createdAt: new Date().toISOString(),
      message: 'Product duplicated successfully'
    };
  }

  // Export product
  async exportProduct(productId) {
    // In a real implementation, this would generate export data
    console.log(`Exporting product ${productId}`);
    
    return {
      productId,
      exportUrl: `https://api.example.com/exports/products/${productId}.csv`,
      exportedAt: new Date().toISOString(),
      message: 'Product exported successfully'
    };
  }

  // Get product statistics
  async getProductStats() {
    await this.initialize();
    
    const cacheKey = 'product-stats';
    return this.getCachedData(cacheKey, async () => {
      const mockProducts = this.generateMockProducts();
      
      const stats = {
        total: mockProducts.length,
        active: mockProducts.filter(p => p.status === 'active').length,
        inactive: mockProducts.filter(p => p.status === 'inactive').length,
        outOfStock: mockProducts.filter(p => p.stock === 0).length,
        lowStock: mockProducts.filter(p => p.stock > 0 && p.stock <= 5).length,
        categories: this.getCategoryStats(mockProducts),
        brands: this.getBrandStats(mockProducts),
        priceRanges: this.getPriceRangeStats(mockProducts),
        averagePrice: this.calculateAveragePrice(mockProducts),
        totalValue: this.calculateTotalValue(mockProducts)
      };
      
      return stats;
    });
  }

  // Generate mock products
  generateMockProducts() {
    const brands = ['Nike', 'Adidas', 'Jordan', 'Supreme', 'Off-White', 'Yeezy', 'Travis Scott', 'Dior', 'Gucci', 'Louis Vuitton'];
    const categories = ['Sneakers', 'Clothing', 'Accessories', 'Bags', 'Watches'];
    const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
    const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown'];
    const statuses = ['active', 'inactive', 'draft', 'archived'];
    
    const products = [];
    
    for (let i = 1; i <= 500; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
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
        stock: Math.floor(Math.random() * 20),
        status,
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

  // Sort products
  sortProducts(products, sortBy, sortOrder = 'asc') {
    return products.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'brand':
          aValue = a.brand.toLowerCase();
          bValue = b.brand.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
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

  // Get category statistics
  getCategoryStats(products) {
    const categoryCounts = {};
    products.forEach(product => {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Get brand statistics
  getBrandStats(products) {
    const brandCounts = {};
    products.forEach(product => {
      brandCounts[product.brand] = (brandCounts[product.brand] || 0) + 1;
    });
    
    return Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Get price range statistics
  getPriceRangeStats(products) {
    const ranges = [
      { label: 'Under $100', min: 0, max: 100 },
      { label: '$100 - $500', min: 100, max: 500 },
      { label: '$500 - $1000', min: 500, max: 1000 },
      { label: '$1000 - $2000', min: 1000, max: 2000 },
      { label: 'Over $2000', min: 2000, max: Infinity }
    ];
    
    return ranges.map(range => ({
      ...range,
      count: products.filter(p => p.price >= range.min && p.price < range.max).length
    }));
  }

  // Calculate average price
  calculateAveragePrice(products) {
    if (products.length === 0) return 0;
    const total = products.reduce((sum, product) => sum + product.price, 0);
    return Math.round(total / products.length * 100) / 100;
  }

  // Calculate total value
  calculateTotalValue(products) {
    return products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new ProductManagementService();
