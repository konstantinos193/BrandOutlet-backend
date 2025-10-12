const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Inventory {
  constructor(data) {
    this.id = data.id || null;
    this.productId = data.productId;
    this.variantId = data.variantId;
    this.sku = data.sku;
    this.currentStock = data.currentStock || 0;
    this.reservedStock = data.reservedStock || 0;
    this.availableStock = data.availableStock || 0;
    this.minStockLevel = data.minStockLevel || 10;
    this.maxStockLevel = data.maxStockLevel || 1000;
    this.reorderPoint = data.reorderPoint || 20;
    this.reorderQuantity = data.reorderQuantity || 50;
    this.cost = data.cost;
    this.sellingPrice = data.sellingPrice;
    this.margin = data.margin || 0;
    this.supplier = data.supplier || {};
    this.location = data.location || { warehouse: 'main' };
    this.status = data.status || 'active';
    this.lastRestocked = data.lastRestocked || new Date();
    this.lastSold = data.lastSold;
    this.stockMovements = data.stockMovements || [];
    this.alerts = data.alerts || [];
    this.analytics = data.analytics || {
      totalSold: 0,
      totalRevenue: 0,
      averageDailySales: 0,
      turnoverRate: 0,
      lastCalculated: new Date()
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Calculate available stock
  get calculatedAvailableStock() {
    return Math.max(0, this.currentStock - this.reservedStock);
  }

  // Save inventory to database
  async save() {
    try {
      const db = getDB();
      const collection = db.collection('inventory');
      
      // Update calculated fields
      this.availableStock = this.calculatedAvailableStock;
      this.margin = this.sellingPrice - this.cost;
      this.updatedAt = new Date();
      
      const inventoryData = {
        productId: this.productId,
        variantId: this.variantId,
        sku: this.sku,
        currentStock: this.currentStock,
        reservedStock: this.reservedStock,
        availableStock: this.availableStock,
        minStockLevel: this.minStockLevel,
        maxStockLevel: this.maxStockLevel,
        reorderPoint: this.reorderPoint,
        reorderQuantity: this.reorderQuantity,
        cost: this.cost,
        sellingPrice: this.sellingPrice,
        margin: this.margin,
        supplier: this.supplier,
        location: this.location,
        status: this.status,
        lastRestocked: this.lastRestocked,
        lastSold: this.lastSold,
        stockMovements: this.stockMovements,
        alerts: this.alerts,
        analytics: this.analytics,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };

      if (this.id) {
        // Update existing inventory
        await collection.updateOne(
          { _id: new ObjectId(this.id) },
          { $set: inventoryData }
        );
      } else {
        // Create new inventory
        const result = await collection.insertOne(inventoryData);
        this.id = result.insertedId.toString();
      }
      
      return this;
    } catch (error) {
      console.error('Error saving inventory:', error);
      throw error;
    }
  }

  // Add stock movement
  async addStockMovement(movement) {
    try {
      this.stockMovements.push({
        ...movement,
        timestamp: new Date()
      });
      
      // Update stock levels based on movement type
      switch (movement.type) {
        case 'in':
          this.currentStock += movement.quantity;
          break;
        case 'out':
          this.currentStock = Math.max(0, this.currentStock - movement.quantity);
          break;
        case 'reserved':
          this.reservedStock += movement.quantity;
          break;
        case 'unreserved':
          this.reservedStock = Math.max(0, this.reservedStock - movement.quantity);
          break;
      }
      
      this.availableStock = this.calculatedAvailableStock;
      this.lastSold = movement.type === 'out' ? new Date() : this.lastSold;
      
      return await this.save();
    } catch (error) {
      console.error('Error adding stock movement:', error);
      throw error;
    }
  }

  // Check and create alerts
  async checkAlerts() {
    try {
      const alerts = [];
      
      // Low stock alert
      if (this.currentStock <= this.reorderPoint && this.currentStock > 0) {
        alerts.push({
          type: 'low_stock',
          severity: this.currentStock <= this.minStockLevel ? 'critical' : 'high',
          message: `Stock level (${this.currentStock}) is at or below reorder point (${this.reorderPoint})`,
          triggeredAt: new Date(),
          resolved: false
        });
      }
      
      // Out of stock alert
      if (this.currentStock === 0) {
        alerts.push({
          type: 'out_of_stock',
          severity: 'critical',
          message: 'Product is out of stock',
          triggeredAt: new Date(),
          resolved: false
        });
      }
      
      // Overstock alert
      if (this.currentStock > this.maxStockLevel) {
        alerts.push({
          type: 'overstock',
          severity: 'medium',
          message: `Stock level (${this.currentStock}) exceeds maximum level (${this.maxStockLevel})`,
          triggeredAt: new Date(),
          resolved: false
        });
      }
      
      // Add new alerts (avoid duplicates)
      alerts.forEach(alert => {
        const existingAlert = this.alerts.find(a => 
          a.type === alert.type && !a.resolved
        );
        if (!existingAlert) {
          this.alerts.push(alert);
        }
      });
      
      return await this.save();
    } catch (error) {
      console.error('Error checking alerts:', error);
      throw error;
    }
  }

  // Get all inventory items
  static async findAll(filters = {}) {
    try {
      const db = getDB();
      const collection = db.collection('inventory');
      
      const query = {};
      
      // Apply filters
      if (filters.productId) query.productId = new ObjectId(filters.productId);
      if (filters.variantId) query.variantId = new ObjectId(filters.variantId);
      if (filters.sku) query.sku = filters.sku;
      if (filters.status) query.status = filters.status;
      if (filters.supplierId) query['supplier.id'] = new ObjectId(filters.supplierId);
      if (filters.lowStock) {
        query.$expr = { $lte: ['$currentStock', '$reorderPoint'] };
      }
      if (filters.outOfStock) {
        query.currentStock = 0;
      }

      const inventory = await collection.find(query).sort({ updatedAt: -1 }).toArray();
      return inventory.map(item => new Inventory(item));
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  // Get inventory by ID
  static async findById(id) {
    try {
      const db = getDB();
      const collection = db.collection('inventory');
      const inventory = await collection.findOne({ _id: new ObjectId(id) });
      return inventory ? new Inventory(inventory) : null;
    } catch (error) {
      console.error('Error fetching inventory by ID:', error);
      throw error;
    }
  }

  // Get inventory by SKU
  static async findBySku(sku) {
    try {
      const db = getDB();
      const collection = db.collection('inventory');
      const inventory = await collection.findOne({ sku: sku });
      return inventory ? new Inventory(inventory) : null;
    } catch (error) {
      console.error('Error fetching inventory by SKU:', error);
      throw error;
    }
  }

  // Get low stock items
  static async getLowStockItems() {
    try {
      const db = getDB();
      const collection = db.collection('inventory');
      
      const pipeline = [
        {
          $match: {
            $or: [
              { currentStock: 0 },
              { $expr: { $lte: ['$currentStock', '$reorderPoint'] } }
            ],
            status: 'active'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $lookup: {
            from: 'variants',
            localField: 'variantId',
            foreignField: '_id',
            as: 'variant'
          }
        },
        {
          $unwind: { path: '$product', preserveNullAndEmptyArrays: true }
        },
        {
          $unwind: { path: '$variant', preserveNullAndEmptyArrays: true }
        }
      ];
      
      const items = await collection.aggregate(pipeline).toArray();
      return items.map(item => new Inventory(item));
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  // Get inventory analytics
  static async getInventoryAnalytics() {
    try {
      const db = getDB();
      const collection = db.collection('inventory');
      
      const pipeline = [
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$currentStock', '$cost'] } },
            totalRevenue: { $sum: '$analytics.totalRevenue' },
            lowStockCount: {
              $sum: {
                $cond: [
                  { $lte: ['$currentStock', '$reorderPoint'] },
                  1,
                  0
                ]
              }
            },
            outOfStockCount: {
              $sum: {
                $cond: [
                  { $eq: ['$currentStock', 0] },
                  1,
                  0
                ]
              }
            },
            averageTurnover: { $avg: '$analytics.turnoverRate' }
          }
        }
      ];
      
      const result = await collection.aggregate(pipeline).toArray();
      return result[0] || {};
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      throw error;
    }
  }

  // Update inventory
  async update(updateData) {
    try {
      const db = getDB();
      const collection = db.collection('inventory');
      
      updateData.updatedAt = new Date();
      
      await collection.updateOne(
        { _id: new ObjectId(this.id) },
        { $set: updateData }
      );
      
      // Update local instance
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  // Delete inventory
  async delete() {
    try {
      const db = getDB();
      const collection = db.collection('inventory');
      
      await collection.deleteOne({ _id: new ObjectId(this.id) });
      return true;
    } catch (error) {
      console.error('Error deleting inventory:', error);
      throw error;
    }
  }
}

module.exports = Inventory;
