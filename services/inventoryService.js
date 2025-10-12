const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const { getDB } = require('../config/database');

class InventoryService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    if (!this.db) {
      this.db = await getDB();
    }
  }

  // Get comprehensive inventory dashboard data
  async getInventoryDashboard() {
    try {
      await this.initialize();
      
      const [
        analytics,
        lowStockItems,
        recentMovements,
        topSellingItems,
        supplierPerformance
      ] = await Promise.all([
        this.getInventoryAnalytics(),
        this.getLowStockItems(),
        this.getRecentMovements(10),
        this.getTopSellingItems(10),
        this.getSupplierPerformance()
      ]);

      return {
        analytics,
        alerts: {
          lowStock: lowStockItems.length,
          outOfStock: analytics.outOfStockCount,
          critical: lowStockItems.filter(item => 
            item.alerts.some(alert => alert.severity === 'critical' && !alert.resolved)
          ).length
        },
        lowStockItems: lowStockItems.slice(0, 5), // Show top 5
        recentMovements,
        topSellingItems,
        supplierPerformance,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting inventory dashboard:', error);
      throw error;
    }
  }

  // Get inventory analytics
  async getInventoryAnalytics() {
    try {
      await this.initialize();
      
      const analytics = await Inventory.getInventoryAnalytics();
      
      // Calculate additional metrics
      const totalValue = analytics.totalValue || 0;
      const totalRevenue = analytics.totalRevenue || 0;
      const totalProducts = analytics.totalProducts || 0;
      
      return {
        ...analytics,
        averageValuePerItem: totalProducts > 0 ? totalValue / totalProducts : 0,
        revenuePerItem: totalProducts > 0 ? totalRevenue / totalProducts : 0,
        stockTurnoverRate: analytics.averageTurnover || 0,
        lowStockPercentage: totalProducts > 0 ? (analytics.lowStockCount / totalProducts) * 100 : 0,
        outOfStockPercentage: totalProducts > 0 ? (analytics.outOfStockCount / totalProducts) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting inventory analytics:', error);
      throw error;
    }
  }

  // Get low stock items
  async getLowStockItems() {
    try {
      await this.initialize();
      
      const lowStockItems = await Inventory.getLowStockItems();
      
      // Sort by severity and stock level
      return lowStockItems.sort((a, b) => {
        const aCritical = a.alerts.some(alert => alert.severity === 'critical' && !alert.resolved);
        const bCritical = b.alerts.some(alert => alert.severity === 'critical' && !alert.resolved);
        
        if (aCritical && !bCritical) return -1;
        if (!aCritical && bCritical) return 1;
        
        return a.currentStock - b.currentStock;
      });
    } catch (error) {
      console.error('Error getting low stock items:', error);
      throw error;
    }
  }

  // Get recent stock movements
  async getRecentMovements(limit = 20) {
    try {
      await this.initialize();
      
      const collection = this.db.collection('inventory');
      
      const pipeline = [
        { $unwind: '$stockMovements' },
        { $sort: { 'stockMovements.timestamp': -1 } },
        { $limit: limit },
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
        },
        {
          $project: {
            _id: 1,
            sku: 1,
            product: { $arrayElemAt: ['$product', 0] },
            variant: { $arrayElemAt: ['$variant', 0] },
            movement: '$stockMovements'
          }
        }
      ];
      
      const movements = await collection.aggregate(pipeline).toArray();
      return movements;
    } catch (error) {
      console.error('Error getting recent movements:', error);
      throw error;
    }
  }

  // Get top selling items
  async getTopSellingItems(limit = 10) {
    try {
      await this.initialize();
      
      const collection = this.db.collection('inventory');
      
      const pipeline = [
        { $match: { status: 'active' } },
        { $sort: { 'analytics.totalSold': -1 } },
        { $limit: limit },
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
      return items;
    } catch (error) {
      console.error('Error getting top selling items:', error);
      throw error;
    }
  }

  // Get supplier performance
  async getSupplierPerformance() {
    try {
      await this.initialize();
      
      const collection = this.db.collection('suppliers');
      
      const pipeline = [
        { $match: { status: 'active' } },
        {
          $project: {
            name: 1,
            contactEmail: 1,
            rating: 1,
            performance: 1,
            productsCount: { $size: '$products' },
            averageOrderValue: '$performance.averageOrderValue',
            onTimeDelivery: '$performance.onTimeDelivery',
            qualityScore: '$performance.qualityScore'
          }
        },
        { $sort: { rating: -1, 'performance.onTimeDelivery': -1 } },
        { $limit: 10 }
      ];
      
      const suppliers = await collection.aggregate(pipeline).toArray();
      return suppliers;
    } catch (error) {
      console.error('Error getting supplier performance:', error);
      throw error;
    }
  }

  // Process stock movement
  async processStockMovement(inventoryId, movementData) {
    try {
      await this.initialize();
      
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error('Inventory item not found');
      }

      await inventory.addStockMovement(movementData);
      await inventory.checkAlerts();

      return inventory;
    } catch (error) {
      console.error('Error processing stock movement:', error);
      throw error;
    }
  }

  // Bulk stock adjustment
  async bulkStockAdjustment(adjustments) {
    try {
      await this.initialize();
      
      const results = [];
      
      for (const adjustment of adjustments) {
        try {
          const inventory = await Inventory.findById(adjustment.inventoryId);
          if (inventory) {
            const movement = {
              type: 'adjustment',
              quantity: adjustment.quantity,
              reason: 'bulk_adjustment',
              performedBy: adjustment.performedBy,
              notes: adjustment.notes || 'Bulk stock adjustment'
            };
            
            await inventory.addStockMovement(movement);
            await inventory.checkAlerts();
            
            results.push({
              inventoryId: adjustment.inventoryId,
              success: true,
              newStock: inventory.currentStock
            });
          } else {
            results.push({
              inventoryId: adjustment.inventoryId,
              success: false,
              error: 'Inventory item not found'
            });
          }
        } catch (error) {
          results.push({
            inventoryId: adjustment.inventoryId,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error performing bulk stock adjustment:', error);
      throw error;
    }
  }

  // Generate reorder suggestions
  async generateReorderSuggestions() {
    try {
      await this.initialize();
      
      const lowStockItems = await this.getLowStockItems();
      
      const suggestions = lowStockItems.map(item => {
        const suggestedQuantity = Math.max(
          item.reorderQuantity,
          item.reorderPoint - item.currentStock + 10 // Add buffer
        );
        
        return {
          inventoryId: item.id,
          sku: item.sku,
          productName: item.product?.name || 'Unknown Product',
          currentStock: item.currentStock,
          reorderPoint: item.reorderPoint,
          suggestedQuantity,
          supplier: item.supplier,
          urgency: item.currentStock === 0 ? 'critical' : 
                   item.currentStock <= item.minStockLevel ? 'high' : 'medium',
          estimatedCost: suggestedQuantity * item.cost,
          leadTime: item.supplier?.leadTime || 7
        };
      });
      
      return suggestions.sort((a, b) => {
        const urgencyOrder = { critical: 3, high: 2, medium: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      });
    } catch (error) {
      console.error('Error generating reorder suggestions:', error);
      throw error;
    }
  }

  // Update inventory analytics
  async updateInventoryAnalytics(inventoryId) {
    try {
      await this.initialize();
      
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error('Inventory item not found');
      }

      // Calculate analytics based on stock movements
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentMovements = inventory.stockMovements.filter(
        movement => new Date(movement.timestamp) >= thirtyDaysAgo
      );
      
      const salesMovements = recentMovements.filter(movement => movement.type === 'out');
      const totalSold = salesMovements.reduce((sum, movement) => sum + movement.quantity, 0);
      const totalRevenue = totalSold * inventory.sellingPrice;
      const averageDailySales = totalSold / 30;
      const turnoverRate = inventory.currentStock > 0 ? totalSold / inventory.currentStock : 0;
      
      inventory.analytics = {
        totalSold: inventory.analytics.totalSold + totalSold,
        totalRevenue: inventory.analytics.totalRevenue + totalRevenue,
        averageDailySales,
        turnoverRate,
        lastCalculated: now
      };
      
      await inventory.save();
      return inventory;
    } catch (error) {
      console.error('Error updating inventory analytics:', error);
      throw error;
    }
  }

  // Get inventory trends
  async getInventoryTrends(days = 30) {
    try {
      await this.initialize();
      
      const collection = this.db.collection('inventory');
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      
      const pipeline = [
        { $unwind: '$stockMovements' },
        {
          $match: {
            'stockMovements.timestamp': { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$stockMovements.timestamp'
                }
              },
              type: '$stockMovements.type'
            },
            totalQuantity: { $sum: '$stockMovements.quantity' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            movements: {
              $push: {
                type: '$_id.type',
                quantity: '$totalQuantity',
                count: '$count'
              }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ];
      
      const trends = await collection.aggregate(pipeline).toArray();
      return trends;
    } catch (error) {
      console.error('Error getting inventory trends:', error);
      throw error;
    }
  }
}

module.exports = new InventoryService();
