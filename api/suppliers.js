const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { getDB } = require('../config/database');
const authModule = require('./auth');
const { verifyToken } = authModule;
const authRateLimit = require('../middleware/authRateLimit');

// Apply authentication middleware to all supplier routes
router.use(verifyToken);
router.use(authRateLimit);

// GET /api/suppliers - Get all suppliers with filters
router.get('/', async (req, res) => {
  try {
    console.log('🏭 Suppliers data requested');
    
    const {
      page = 1,
      limit = 20,
      search,
      status,
      minRating,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filters = {};
    
    if (status) filters.status = status;
    if (minRating) filters.minRating = parseFloat(minRating);

    let suppliers = await Supplier.findAll(filters);
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      suppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.contactEmail.toLowerCase().includes(searchLower) ||
        (supplier.phone && supplier.phone.includes(search))
      );
    }

    // Apply sorting
    suppliers.sort((a, b) => {
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
    const paginatedSuppliers = suppliers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        suppliers: paginatedSuppliers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(suppliers.length / limit),
          totalItems: suppliers.length,
          itemsPerPage: parseInt(limit)
        },
        filters: {
          search,
          status,
          minRating
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suppliers',
      message: error.message
    });
  }
});

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier',
      message: error.message
    });
  }
});

// POST /api/suppliers - Create new supplier
router.post('/', async (req, res) => {
  try {
    console.log('🏭 Creating new supplier');
    
    const {
      name,
      contactEmail,
      phone,
      address,
      website,
      leadTime,
      minimumOrderQuantity,
      paymentTerms,
      currency,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !contactEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, contactEmail'
      });
    }

    // Check if supplier with email already exists
    const existingSupplier = await Supplier.findByEmail(contactEmail);
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        error: 'Supplier with this email already exists'
      });
    }

    // Create new supplier
    const supplier = new Supplier({
      name,
      contactEmail,
      phone,
      address,
      website,
      leadTime: leadTime || 7,
      minimumOrderQuantity: minimumOrderQuantity || 1,
      paymentTerms: paymentTerms || 'net_30',
      currency: currency || 'USD',
      notes
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create supplier',
      message: error.message
    });
  }
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    await supplier.update(updateData);

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier',
      message: error.message
    });
  }
});

// POST /api/suppliers/:id/performance - Update supplier performance
router.post('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const performanceData = req.body;
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    await supplier.updatePerformance(performanceData);

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier performance updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating supplier performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update supplier performance',
      message: error.message
    });
  }
});

// POST /api/suppliers/:id/products - Add product to supplier
router.post('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    await supplier.addProduct(productId);

    res.json({
      success: true,
      data: supplier,
      message: 'Product added to supplier successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding product to supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add product to supplier',
      message: error.message
    });
  }
});

// DELETE /api/suppliers/:id/products/:productId - Remove product from supplier
router.delete('/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    await supplier.removeProduct(productId);

    res.json({
      success: true,
      data: supplier,
      message: 'Product removed from supplier successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error removing product from supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove product from supplier',
      message: error.message
    });
  }
});

// GET /api/suppliers/analytics/overview - Get supplier analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    console.log('📊 Supplier analytics requested');
    
    const analytics = await Supplier.getSupplierAnalytics();
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching supplier analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplier analytics',
      message: error.message
    });
  }
});

// GET /api/suppliers/top-performers - Get top performing suppliers
router.get('/analytics/top-performers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topPerformers = await Supplier.getTopPerformers(parseInt(limit));
    
    res.json({
      success: true,
      data: topPerformers,
      count: topPerformers.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching top performing suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top performing suppliers',
      message: error.message
    });
  }
});

// GET /api/suppliers/search - Search suppliers
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params;
    
    const suppliers = await Supplier.search(term);
    
    res.json({
      success: true,
      data: suppliers,
      count: suppliers.length,
      searchTerm: term,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search suppliers',
      message: error.message
    });
  }
});

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    await supplier.delete();

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete supplier',
      message: error.message
    });
  }
});

module.exports = router;
