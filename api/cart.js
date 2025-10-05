const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');

// GET /api/cart/:userId - Get user's cart
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cart = await cartService.getCart(userId);
    
    res.json({
      success: true,
      data: cart,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart',
      message: error.message
    });
  }
});

// POST /api/cart/:userId/add - Add item to cart
router.post('/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1, options = {} } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required',
        message: 'Please provide a product ID'
      });
    }
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity must be at least 1'
      });
    }
    
    const cart = await cartService.addToCart(userId, productId, quantity, options);
    
    res.json({
      success: true,
      data: cart,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart',
      message: error.message
    });
  }
});

// DELETE /api/cart/:userId/items/:itemId - Remove item from cart
router.delete('/:userId/items/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    const cart = await cartService.removeFromCart(userId, itemId);
    
    res.json({
      success: true,
      data: cart,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart',
      message: error.message
    });
  }
});

// PUT /api/cart/:userId/items/:itemId/quantity - Update item quantity
router.put('/:userId/items/:itemId/quantity', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;
    
    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity cannot be negative'
      });
    }
    
    const cart = await cartService.updateCartItemQuantity(userId, itemId, quantity);
    
    res.json({
      success: true,
      data: cart,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart item quantity',
      message: error.message
    });
  }
});

// DELETE /api/cart/:userId/clear - Clear cart
router.delete('/:userId/clear', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cart = await cartService.clearCart(userId);
    
    res.json({
      success: true,
      data: cart,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
      message: error.message
    });
  }
});

// POST /api/cart/:userId/discount - Apply discount code
router.post('/:userId/discount', async (req, res) => {
  try {
    const { userId } = req.params;
    const { discountCode } = req.body;
    
    if (!discountCode) {
      return res.status(400).json({
        success: false,
        error: 'Discount code is required',
        message: 'Please provide a discount code'
      });
    }
    
    const cart = await cartService.applyDiscount(userId, discountCode);
    
    res.json({
      success: true,
      data: cart,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply discount',
      message: error.message
    });
  }
});

// DELETE /api/cart/:userId/discount - Remove discount code
router.delete('/:userId/discount', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cart = await cartService.removeDiscount(userId);
    
    res.json({
      success: true,
      data: cart,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error removing discount:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove discount',
      message: error.message
    });
  }
});

// GET /api/cart/:userId/summary - Get cart summary
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const summary = await cartService.getCartSummary(userId);
    
    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching cart summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart summary',
      message: error.message
    });
  }
});

// POST /api/cart/:userId/validate - Validate cart
router.post('/:userId/validate', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const validation = await cartService.validateCart(userId);
    
    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error validating cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate cart',
      message: error.message
    });
  }
});

// POST /api/cart/clear-cache - Clear cart cache
router.post('/clear-cache', async (req, res) => {
  try {
    cartService.clearCache();
    
    res.json({
      success: true,
      message: 'Cart cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cart cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart cache',
      message: error.message
    });
  }
});

module.exports = router;
