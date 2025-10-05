const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Product {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.brandId = data.brandId;
    this.brand = data.brand;
    this.price = data.price;
    this.originalPrice = data.originalPrice;
    this.discount = data.discount;
    this.images = data.images || [];
    this.description = data.description;
    this.category = data.category;
    this.subcategory = data.subcategory;
    this.size = data.size;
    this.color = data.color;
    this.condition = data.condition;
    this.stock = data.stock || 1;
    this.isActive = data.isActive !== false;
    this.tags = data.tags || [];
    this.sku = data.sku;
    this.weight = data.weight;
    this.dimensions = data.dimensions;
    this.authenticity = data.authenticity || {
      isVerified: false,
      verifiedBy: null,
      verifiedAt: null,
      certificateUrl: null
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Save product to database
  async save() {
    try {
      const db = getDB();
      const collection = db.collection('products');
      
      const productData = {
        name: this.name,
        brandId: this.brandId,
        brand: this.brand,
        price: this.price,
        originalPrice: this.originalPrice,
        discount: this.discount,
        images: this.images,
        description: this.description,
        category: this.category,
        subcategory: this.subcategory,
        size: this.size,
        color: this.color,
        condition: this.condition,
        stock: this.stock,
        isActive: this.isActive,
        tags: this.tags,
        sku: this.sku,
        weight: this.weight,
        dimensions: this.dimensions,
        authenticity: this.authenticity,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };

      const result = await collection.insertOne(productData);
      this.id = result.insertedId.toString();
      return this;
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  }

  // Get all products
  static async findAll(filters = {}) {
    try {
      const db = getDB();
      const collection = db.collection('products');
      
      const query = {};
      
      // Apply filters
      if (filters.brandId) query.brandId = filters.brandId;
      if (filters.category) query.category = filters.category;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      }

      const products = await collection.find(query).sort({ createdAt: -1 }).toArray();
      return products.map(product => new Product(product));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get product by ID
  static async findById(id) {
    try {
      const db = getDB();
      const collection = db.collection('products');
      const product = await collection.findOne({ _id: new ObjectId(id) });
      return product ? new Product(product) : null;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  // Update product
  async update(updateData) {
    try {
      const db = getDB();
      const collection = db.collection('products');
      
      updateData.updatedAt = new Date();
      
      await collection.updateOne(
        { _id: new ObjectId(this.id) },
        { $set: updateData }
      );
      
      // Update local instance
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Delete product
  async delete() {
    try {
      const db = getDB();
      const collection = db.collection('products');
      
      await collection.deleteOne({ _id: new ObjectId(this.id) });
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Get dashboard stats
  static async getDashboardStats() {
    try {
      const db = getDB();
      const collection = db.collection('products');
      const variantsCollection = db.collection('variants');
      
      const totalProducts = await collection.countDocuments();
      const activeProducts = await collection.countDocuments({ isActive: true });
      const verifiedProducts = await collection.countDocuments({ 'authenticity.isVerified': true });
      
      // Get recent products (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentProducts = await collection.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      // Get variant stats
      const totalVariants = await variantsCollection.countDocuments();
      const activeVariants = await variantsCollection.countDocuments({ isActive: true });
      const outOfStockVariants = await variantsCollection.countDocuments({ stock: 0 });

      return {
        totalProducts,
        activeProducts,
        verifiedProducts,
        recentProducts,
        totalVariants,
        activeVariants,
        outOfStockVariants
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get recent products
  static async getRecentProducts(limit = 10) {
    try {
      const db = getDB();
      const collection = db.collection('products');
      
      const products = await collection
        .find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return products.map(product => new Product(product));
    } catch (error) {
      console.error('Error fetching recent products:', error);
      throw error;
    }
  }

  // Count products with filters
  static async count(filters = {}) {
    try {
      const db = getDB();
      const collection = db.collection('products');
      
      const query = {};
      
      // Apply filters
      if (filters.brandId) query.brandId = filters.brandId;
      if (filters.category) query.category = filters.category;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      }

      return await collection.countDocuments(query);
    } catch (error) {
      console.error('Error counting products:', error);
      throw error;
    }
  }

  // Get unique brands count
  static async getUniqueBrandsCount() {
    try {
      const db = getDB();
      const collection = db.collection('products');
      
      const result = await collection.distinct('brandId', { isActive: true });
      return result.length;
    } catch (error) {
      console.error('Error getting unique brands count:', error);
      throw error;
    }
  }

  // Get total variants count
  static async getTotalVariantsCount() {
    try {
      const db = getDB();
      const variantsCollection = db.collection('variants');
      
      return await variantsCollection.countDocuments();
    } catch (error) {
      console.error('Error getting total variants count:', error);
      throw error;
    }
  }
}

module.exports = Product;
