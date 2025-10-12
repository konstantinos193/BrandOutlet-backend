const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const { getDB } = require('../config/database');
const authModule = require('./auth');
const { verifyToken } = authModule;
const authRateLimit = require('../middleware/authRateLimit');

// Apply authentication middleware to all inventory routes
router.use(verifyToken);
router.use(authRateLimit);

// GET /api/inventory - Get all inventory items with filters
router.get('/', async (req, res) => {
  try {
    console.log('📦 Inventory data requested');
    
    const {
      page = 1,
      limit = 20,
      search,
      status,
      lowStock,
      outOfStock,
      supplierId,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {};
    
    if (status) filters.status = status;
    if (lowStock === 'true') filters.lowStock = true;
    if (outOfStock === 'true') filters.outOfStock = true;
    if (supplierId) filters.supplierId = supplierId;

    const inventory = await Inventory.findAll(filters);
    
    // Apply search filter
    let filteredInventory = inventory;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInventory = inventory.filter(item => 
        item.sku.toLowerCase().includes(searchLower) ||
        (item.product && item.product.name && item.product.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filteredInventory.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedInventory = filteredInventory.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        inventory: paginatedInventory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredInventory.length / limit),
          totalItems: filteredInventory.length,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          search,
          status,
          lowStock,
          outOfStock,
          supplierId
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
      message: error.message
    });
  }
});

// GET /api/inventory/:id - Get inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventory = await Inventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: inventory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory item',
      message: error.message
    });
  }
});

// POST /api/inventory - Create new inventory item
router.post('/', async (req, res) => {
  try {
    console.log('📦 Creating new inventory item');
    
    const {
      productId,
      variantId,
      sku,
      currentStock,
      minStockLevel,
      maxStockLevel,
      reorderPoint,
      reorderQuantity,
      cost,
      sellingPrice,
      supplier,
      location
    } = req.body;

    // Validate required fields
    if (!productId || !variantId || !sku || cost === undefined || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, variantId, sku, cost, sellingPrice'
      });
    }

    // Check if SKU already exists
    const existingInventory = await Inventory.findBySku(sku);
    if (existingInventory) {
      return res.status(400).json({
        success: false,
        error: 'SKU already exists'
      });
    }

    // Create new inventory item
    const inventory = new Inventory({
      productId,
      variantId,
      sku,
      currentStock: currentStock || 0,
      minStockLevel: minStockLevel || 10,
      maxStockLevel: maxStockLevel || 1000,
      reorderPoint: reorderPoint || 20,
      reorderQuantity: reorderQuantity || 50,
      cost,
      sellingPrice,
      supplier: supplier || {},
      location: location || { warehouse: 'main' }
    });

    await inventory.save();
    await inventory.checkAlerts();

    res.status(201).json({
      success: true,
      data: inventory,
      message: 'Inventory item created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item',
      message: error.message
    });
  }
});

// PUT /api/inventory/:id - Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const inventory = await Inventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    await inventory.update(updateData);
    await inventory.checkAlerts();

    res.json({
      success: true,
      data: inventory,
      message: 'Inventory item updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory item',
      message: error.message
    });
  }
});

// POST /api/inventory/:id/movement - Add stock movement
router.post('/:id/movement', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity, reason, reference, performedBy, notes } = req.body;
    
    const inventory = await Inventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    // Validate movement data
    if (!type || !quantity || !reason || !performedBy) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, quantity, reason, performedBy'
      });
    }

    const movement = {
      type,
      quantity: parseInt(quantity),
      reason,
      reference,
      performedBy,
      notes
    };

    await inventory.addStockMovement(movement);
    await inventory.checkAlerts();

    res.json({
      success: true,
      data: inventory,
      message: 'Stock movement added successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding stock movement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add stock movement',
      message: error.message
    });
  }
});

// GET /api/inventory/low-stock - Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    console.log('⚠️ Low stock items requested');
    
    const lowStockItems = await Inventory.getLowStockItems();
    
    res.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch low stock items',
      message: error.message
    });
  }
});

// GET /api/inventory/analytics - Get inventory analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    console.log('📊 Inventory analytics requested');
    
    const analytics = await Inventory.getInventoryAnalytics();
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory analytics',
      message: error.message
    });
  }
});

// POST /api/inventory/bulk-update - Bulk update inventory items
router.post('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Updates array is required'
      });
    }

    const results = [];
    
    for (const update of updates) {
      try {
        const inventory = await Inventory.findById(update.id);
        if (inventory) {
          await inventory.update(update.data);
          await inventory.checkAlerts();
          results.push({ id: update.id, success: true });
        } else {
          results.push({ id: update.id, success: false, error: 'Not found' });
        }
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'Bulk update completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error performing bulk update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk update',
      message: error.message
    });
  }
});

// DELETE /api/inventory/:id - Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventory = await Inventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory item not found'
      });
    }

    await inventory.delete();

    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete inventory item',
      message: error.message
    });
  }
});

module.exports = router;
