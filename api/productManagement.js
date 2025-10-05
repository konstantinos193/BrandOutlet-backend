const express = require('express');
const router = express.Router();
const productManagementService = require('../services/productManagementService');

// GET /api/product-management/products - Get products with pagination and filtering
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      brand = '',
      status = '',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      category,
      brand,
      status,
      sortBy,
      sortOrder
    };

    const result = await productManagementService.getProducts(options);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// POST /api/product-management/bulk-operation - Execute bulk operations
router.post('/bulk-operation', async (req, res) => {
  try {
    const { operation, productIds, options = {} } = req.body;

    if (!operation) {
      return res.status(400).json({
        success: false,
        error: 'Operation is required',
        message: 'Please specify the operation to perform'
      });
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product IDs are required',
        message: 'Please provide an array of product IDs'
      });
    }

    const result = await productManagementService.executeBulkOperation(operation, productIds, options);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing bulk operation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute bulk operation',
      message: error.message
    });
  }
});

// PUT /api/product-management/products/:id/status - Update product status
router.put('/products/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
        message: 'Please provide the new status'
      });
    }

    const result = await productManagementService.executeSingleOperation('updateStatus', id, { status });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product status',
      message: error.message
    });
  }
});

// PUT /api/product-management/products/:id/price - Update product price
router.put('/products/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    if (!price || isNaN(price)) {
      return res.status(400).json({
        success: false,
        error: 'Valid price is required',
        message: 'Please provide a valid price'
      });
    }

    const result = await productManagementService.executeSingleOperation('updatePrice', id, { price });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating product price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product price',
      message: error.message
    });
  }
});

// PUT /api/product-management/products/:id/stock - Update product stock
router.put('/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || isNaN(stock)) {
      return res.status(400).json({
        success: false,
        error: 'Valid stock quantity is required',
        message: 'Please provide a valid stock quantity'
      });
    }

    const result = await productManagementService.executeSingleOperation('updateStock', id, { stock });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product stock',
      message: error.message
    });
  }
});

// DELETE /api/product-management/products/:id - Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await productManagementService.executeSingleOperation('delete', id);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

// POST /api/product-management/products/:id/duplicate - Duplicate product
router.post('/products/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await productManagementService.executeSingleOperation('duplicate', id);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error duplicating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate product',
      message: error.message
    });
  }
});

// GET /api/product-management/products/:id/export - Export product
router.get('/products/:id/export', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await productManagementService.executeSingleOperation('export', id);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export product',
      message: error.message
    });
  }
});

// GET /api/product-management/stats - Get product statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await productManagementService.getProductStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product stats',
      message: error.message
    });
  }
});

// POST /api/product-management/clear-cache - Clear product management cache
router.post('/clear-cache', async (req, res) => {
  try {
    productManagementService.clearCache();
    
    res.json({
      success: true,
      message: 'Product management cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing product management cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear product management cache',
      message: error.message
    });
  }
});

module.exports = router;
