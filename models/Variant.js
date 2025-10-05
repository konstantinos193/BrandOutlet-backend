const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Variant {
  constructor(data) {
    this.id = data.id || null;
    this.productId = data.productId;
    this.sku = data.sku;
    this.size = data.size;
    this.color = data.color;
    this.material = data.material;
    this.condition = data.condition;
    this.stock = data.stock || 0;
    this.price = data.price;
    this.originalPrice = data.originalPrice;
    this.discount = data.discount;
    this.images = data.images || [];
    this.isActive = data.isActive !== false;
    this.weight = data.weight;
    this.dimensions = data.dimensions;
    this.attributes = data.attributes || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Save variant to database
  async save() {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      
      const variantData = {
        productId: this.productId,
        sku: this.sku,
        size: this.size,
        color: this.color,
        material: this.material,
        condition: this.condition,
        stock: this.stock,
        price: this.price,
        originalPrice: this.originalPrice,
        discount: this.discount,
        images: this.images,
        isActive: this.isActive,
        weight: this.weight,
        dimensions: this.dimensions,
        attributes: this.attributes,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };

      const result = await collection.insertOne(variantData);
      this.id = result.insertedId.toString();
      return this;
    } catch (error) {
      console.error('Error saving variant:', error);
      throw error;
    }
  }

  // Get all variants
  static async findAll(filters = {}) {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      
      const query = {};
      
      // Apply filters
      if (filters.productId) query.productId = filters.productId;
      if (filters.size) query.size = filters.size;
      if (filters.color) query.color = filters.color;
      if (filters.material) query.material = filters.material;
      if (filters.condition) query.condition = filters.condition;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.inStock !== undefined) {
        query.stock = filters.inStock ? { $gt: 0 } : { $lte: 0 };
      }
      if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
      }

      const variants = await collection.find(query).sort({ createdAt: -1 }).toArray();
      return variants.map(variant => new Variant(variant));
    } catch (error) {
      console.error('Error fetching variants:', error);
      throw error;
    }
  }

  // Get variant by ID
  static async findById(id) {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      const variant = await collection.findOne({ _id: new ObjectId(id) });
      return variant ? new Variant(variant) : null;
    } catch (error) {
      console.error('Error fetching variant by ID:', error);
      throw error;
    }
  }

  // Get variants by product ID
  static async findByProductId(productId) {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      const variants = await collection.find({ productId }).sort({ createdAt: -1 }).toArray();
      return variants.map(variant => new Variant(variant));
    } catch (error) {
      console.error('Error fetching variants by product ID:', error);
      throw error;
    }
  }

  // Update variant
  async update(updateData) {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      
      updateData.updatedAt = new Date();
      
      await collection.updateOne(
        { _id: new ObjectId(this.id) },
        { $set: updateData }
      );
      
      // Update local instance
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      console.error('Error updating variant:', error);
      throw error;
    }
  }

  // Delete variant
  async delete() {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      
      await collection.deleteOne({ _id: new ObjectId(this.id) });
      return true;
    } catch (error) {
      console.error('Error deleting variant:', error);
      throw error;
    }
  }

  // Get variant statistics for a product
  static async getProductStats(productId) {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      
      const variants = await collection.find({ productId }).toArray();
      
      const stats = {
        totalVariants: variants.length,
        activeVariants: variants.filter(v => v.isActive).length,
        outOfStockVariants: variants.filter(v => v.stock === 0).length,
        lowStockVariants: variants.filter(v => v.stock > 0 && v.stock <= 5).length,
        totalStockValue: variants.reduce((sum, v) => sum + (v.stock * v.price), 0),
        averagePrice: variants.length > 0 ? variants.reduce((sum, v) => sum + v.price, 0) / variants.length : 0,
        sizeDistribution: {},
        colorDistribution: {},
        conditionDistribution: {}
      };

      // Calculate distributions
      variants.forEach(variant => {
        if (variant.size) {
          stats.sizeDistribution[variant.size] = (stats.sizeDistribution[variant.size] || 0) + 1;
        }
        if (variant.color) {
          stats.colorDistribution[variant.color] = (stats.colorDistribution[variant.color] || 0) + 1;
        }
        stats.conditionDistribution[variant.condition] = (stats.conditionDistribution[variant.condition] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching variant stats:', error);
      throw error;
    }
  }

  // Get global variant statistics
  static async getGlobalStats() {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      
      const totalVariants = await collection.countDocuments();
      const activeVariants = await collection.countDocuments({ isActive: true });
      const outOfStockVariants = await collection.countDocuments({ stock: 0 });
      const lowStockVariants = await collection.countDocuments({ 
        stock: { $gt: 0, $lte: 5 } 
      });

      // Get total stock value
      const stockValueResult = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
            averagePrice: { $avg: '$price' }
          }
        }
      ]).toArray();

      const totalStockValue = stockValueResult.length > 0 ? stockValueResult[0].totalValue : 0;
      const averagePrice = stockValueResult.length > 0 ? stockValueResult[0].averagePrice : 0;

      return {
        totalVariants,
        activeVariants,
        outOfStockVariants,
        lowStockVariants,
        totalStockValue,
        averagePrice
      };
    } catch (error) {
      console.error('Error fetching global variant stats:', error);
      throw error;
    }
  }

  // Bulk update variants
  static async bulkUpdate(variantIds, updateData) {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      
      updateData.updatedAt = new Date();
      
      const result = await collection.updateMany(
        { _id: { $in: variantIds.map(id => new ObjectId(id)) } },
        { $set: updateData }
      );
      
      return result;
    } catch (error) {
      console.error('Error bulk updating variants:', error);
      throw error;
    }
  }

  // Bulk delete variants
  static async bulkDelete(variantIds) {
    try {
      const db = getDB();
      const collection = db.collection('variants');
      
      const result = await collection.deleteMany({
        _id: { $in: variantIds.map(id => new ObjectId(id)) }
      });
      
      return result;
    } catch (error) {
      console.error('Error bulk deleting variants:', error);
      throw error;
    }
  }
}

module.exports = Variant;



