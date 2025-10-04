const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');

// GET /api/variants - Get all variants with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      productId,
      size,
      color,
      material,
      condition,
      inStock,
      isActive,
      limit = 50,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const db = getDB();
    const collection = db.collection('variants');
    
    const filters = {};
    if (productId) filters.productId = productId;
    if (size) filters.size = size;
    if (color) filters.color = color;
    if (material) filters.material = material;
    if (condition) filters.condition = condition;
    if (inStock === 'true') filters.stock = { $gt: 0 };
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const variants = await collection
      .find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await collection.countDocuments(filters);

    res.json({
      success: true,
      data: {
        variants,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalVariants: total,
          hasNext: skip + variants.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variants',
      message: error.message
    });
  }
});

// GET /api/variants/:id - Get variant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const collection = db.collection('variants');
    
    const variant = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    res.json({
      success: true,
      data: variant
    });
  } catch (error) {
    console.error('Error fetching variant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variant',
      message: error.message
    });
  }
});

// POST /api/variants - Create new variant
router.post('/', async (req, res) => {
  try {
    const variantData = req.body;
    
    // Generate SKU if not provided
    if (!variantData.sku) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      variantData.sku = `VAR-${timestamp}-${random}`;
    }

    // Set default values
    variantData.isActive = variantData.isActive !== false;
    variantData.stock = variantData.stock || 0;
    variantData.createdAt = new Date();
    variantData.updatedAt = new Date();

    const db = getDB();
    const collection = db.collection('variants');
    
    const result = await collection.insertOne(variantData);
    variantData._id = result.insertedId;

    // Update product's total stock and price range
    await updateProductVariantStats(variantData.productId);

    res.status(201).json({
      success: true,
      data: variantData,
      message: 'Variant created successfully'
    });
  } catch (error) {
    console.error('Error creating variant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create variant',
      message: error.message
    });
  }
});

// PUT /api/variants/:id - Update variant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const db = getDB();
    const collection = db.collection('variants');
    
    const variant = await collection.findOne({ _id: new ObjectId(id) });
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    updateData.updatedAt = new Date();
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Update product's total stock and price range
    await updateProductVariantStats(variant.productId);

    const updatedVariant = await collection.findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      data: updatedVariant,
      message: 'Variant updated successfully'
    });
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update variant',
      message: error.message
    });
  }
});

// DELETE /api/variants/:id - Delete variant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = getDB();
    const collection = db.collection('variants');
    
    const variant = await collection.findOne({ _id: new ObjectId(id) });
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found'
      });
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    // Update product's total stock and price range
    await updateProductVariantStats(variant.productId);

    res.json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete variant',
      message: error.message
    });
  }
});

// POST /api/variants/bulk - Bulk operations on variants
router.post('/bulk', async (req, res) => {
  try {
    const { operation, variantIds, data } = req.body;
    
    if (!operation || !variantIds || !Array.isArray(variantIds)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bulk operation parameters'
      });
    }

    const db = getDB();
    const collection = db.collection('variants');
    
    let result;
    const productIds = new Set();

    switch (operation) {
      case 'update_stock':
        result = await collection.updateMany(
          { _id: { $in: variantIds.map(id => new ObjectId(id)) } },
          { $set: { stock: data.stock, updatedAt: new Date() } }
        );
        break;
        
      case 'update_price':
        result = await collection.updateMany(
          { _id: { $in: variantIds.map(id => new ObjectId(id)) } },
          { $set: { price: data.price, updatedAt: new Date() } }
        );
        break;
        
      case 'activate':
        result = await collection.updateMany(
          { _id: { $in: variantIds.map(id => new ObjectId(id)) } },
          { $set: { isActive: true, updatedAt: new Date() } }
        );
        break;
        
      case 'deactivate':
        result = await collection.updateMany(
          { _id: { $in: variantIds.map(id => new ObjectId(id)) } },
          { $set: { isActive: false, updatedAt: new Date() } }
        );
        break;
        
      case 'delete':
        // Get product IDs before deletion
        const variants = await collection.find({ 
          _id: { $in: variantIds.map(id => new ObjectId(id)) } 
        }).toArray();
        variants.forEach(v => productIds.add(v.productId));
        
        result = await collection.deleteMany({
          _id: { $in: variantIds.map(id => new ObjectId(id)) }
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid operation type'
        });
    }

    // Update product stats for affected products
    for (const productId of productIds) {
      await updateProductVariantStats(productId);
    }

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount || result.deletedCount,
        operation
      },
      message: `Bulk ${operation} completed successfully`
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation',
      message: error.message
    });
  }
});

// GET /api/variants/stats/:productId - Get variant statistics for a product
router.get('/stats/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
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

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching variant stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variant stats',
      message: error.message
    });
  }
});

// Helper function to update product variant statistics
async function updateProductVariantStats(productId) {
  try {
    const db = getDB();
    const variantsCollection = db.collection('variants');
    const productsCollection = db.collection('products');
    
    const variants = await variantsCollection.find({ productId }).toArray();
    
    if (variants.length === 0) {
      // No variants, reset to single product mode
      await productsCollection.updateOne(
        { _id: new ObjectId(productId) },
        { 
          $set: { 
            hasVariants: false,
            totalStock: 0,
            minPrice: 0,
            maxPrice: 0,
            updatedAt: new Date()
          }
        }
      );
      return;
    }

    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    const prices = variants.map(v => v.price).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          hasVariants: true,
          totalStock,
          minPrice,
          maxPrice,
          updatedAt: new Date()
        }
      }
    );
  } catch (error) {
    console.error('Error updating product variant stats:', error);
  }
}

module.exports = router;

