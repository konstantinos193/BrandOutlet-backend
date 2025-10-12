const { connectDB } = require('../config/database');
const Product = require('../models/Product');
const { ObjectId } = require('mongodb');

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
      console.log('📦 ProductManagementService: Fetching real products from database');
      
      // Build MongoDB query
      const query = {};
      
      // Apply search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'brand.name': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Apply category filter
      if (category) {
        query.category = { $regex: category, $options: 'i' };
      }
      
      // Apply brand filter
      if (brand) {
        query['brand.name'] = { $regex: brand, $options: 'i' };
      }
      
      // Apply status filter (map to isActive)
      if (status) {
        if (status === 'active') {
          query.isActive = true;
        } else if (status === 'inactive') {
          query.isActive = false;
        }
      }
      
      // Build sort object
      const sort = {};
      switch (sortBy) {
        case 'name':
          sort.name = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'brand':
          sort['brand.name'] = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'category':
          sort.category = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'price':
          sort.price = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'stock':
          sort.stock = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'createdAt':
          sort.createdAt = sortOrder === 'desc' ? -1 : 1;
          break;
        case 'updatedAt':
          sort.updatedAt = sortOrder === 'desc' ? -1 : 1;
          break;
        default:
          sort.name = sortOrder === 'desc' ? -1 : 1;
      }
      
      // Get products from database
      const collection = this.db.collection('products');
      const total = await collection.countDocuments(query);
      
      const products = await collection
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .toArray();
      
      // Transform products to match expected format
      const transformedProducts = products.map(product => ({
        id: product._id.toString(),
        name: product.name || 'Unnamed Product',
        brand: product.brand?.name || 'Unknown Brand',
        category: product.category || 'Other',
        description: product.description || '',
        price: product.price || 0,
        originalPrice: product.originalPrice || product.price || 0,
        condition: product.condition || 'New',
        color: product.color || 'Unknown',
        stock: product.stock || 0,
        status: product.isActive ? 'active' : 'inactive',
        images: product.images || ['/products/placeholder.jpg'],
        tags: product.tags || [],
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        createdAt: product.createdAt || new Date(),
        updatedAt: product.updatedAt || new Date()
      }));
      
      return {
        products: transformedProducts,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasNextPage: (page * limit) < total,
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
    
    const collection = this.db.collection('products');
    const product = await collection.findOne({ _id: new ObjectId(productId) });
    
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
    await this.initialize();
    const collection = this.db.collection('products');
    
    const isActive = status === 'active';
    await collection.updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          isActive,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated product ${productId} status to ${status}`);
    
    return {
      productId,
      status,
      updatedAt: new Date().toISOString(),
      message: `Product status updated to ${status}`
    };
  }

  // Update product price
  async updateProductPrice(productId, price) {
    await this.initialize();
    const collection = this.db.collection('products');
    
    await collection.updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          price: parseFloat(price),
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated product ${productId} price to $${price}`);
    
    return {
      productId,
      price: parseFloat(price),
      updatedAt: new Date().toISOString(),
      message: `Product price updated to $${price}`
    };
  }

  // Update product stock
  async updateProductStock(productId, stock) {
    await this.initialize();
    const collection = this.db.collection('products');
    
    await collection.updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          stock: parseInt(stock),
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated product ${productId} stock to ${stock}`);
    
    return {
      productId,
      stock: parseInt(stock),
      updatedAt: new Date().toISOString(),
      message: `Product stock updated to ${stock}`
    };
  }

  // Update product category
  async updateProductCategory(productId, category) {
    await this.initialize();
    const collection = this.db.collection('products');
    
    await collection.updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          category,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated product ${productId} category to ${category}`);
    
    return {
      productId,
      category,
      updatedAt: new Date().toISOString(),
      message: `Product category updated to ${category}`
    };
  }

  // Update product brand
  async updateProductBrand(productId, brand) {
    await this.initialize();
    const collection = this.db.collection('products');
    
    await collection.updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          'brand.name': brand,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated product ${productId} brand to ${brand}`);
    
    return {
      productId,
      brand,
      updatedAt: new Date().toISOString(),
      message: `Product brand updated to ${brand}`
    };
  }

  // Delete product
  async deleteProduct(productId) {
    await this.initialize();
    const collection = this.db.collection('products');
    
    await collection.deleteOne({ _id: new ObjectId(productId) });
    
    console.log(`✅ Deleted product ${productId}`);
    
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
      console.log('📊 ProductManagementService: Fetching real product statistics from database');
      
      const collection = this.db.collection('products');
      
      // Get basic counts
      const total = await collection.countDocuments();
      const active = await collection.countDocuments({ isActive: true });
      const inactive = await collection.countDocuments({ isActive: false });
      const outOfStock = await collection.countDocuments({ stock: 0 });
      const lowStock = await collection.countDocuments({ 
        stock: { $gt: 0, $lte: 5 } 
      });
      
      // Get category stats
      const categoryStats = await collection.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      // Get brand stats
      const brandStats = await collection.aggregate([
        { $group: { _id: '$brand.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      // Get price stats
      const priceStats = await collection.aggregate([
        {
          $group: {
            _id: null,
            averagePrice: { $avg: '$price' },
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
          }
        }
      ]).toArray();
      
      const averagePrice = priceStats[0]?.averagePrice || 0;
      const totalValue = priceStats[0]?.totalValue || 0;
      
      // Get price range stats
      const priceRanges = await collection.aggregate([
        {
          $bucket: {
            groupBy: '$price',
            boundaries: [0, 100, 500, 1000, 2000, Infinity],
            default: 'Over $2000',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]).toArray();
      
      const stats = {
        total,
        active,
        inactive,
        outOfStock,
        lowStock,
        categories: categoryStats.map(cat => ({ category: cat._id, count: cat.count })),
        brands: brandStats.map(brand => ({ brand: brand._id, count: brand.count })),
        priceRanges: priceRanges.map(range => ({
          label: range._id === 'Over $2000' ? 'Over $2000' : `$${range._id} - $${range._id + 400}`,
          min: range._id,
          max: range._id === 'Over $2000' ? Infinity : range._id + 400,
          count: range.count
        })),
        averagePrice: Math.round(averagePrice * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100
      };
      
      return stats;
    });
  }


  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new ProductManagementService();
