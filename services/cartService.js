const { connectDB } = require('../config/database');
const cacheService = require('./cacheService');

class CartService {
  constructor() {
    this.db = null;
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  async initialize() {
    if (!this.db) {
      this.db = await connectDB();
    }
  }

  // Get cached data or generate new data using Redis
  async getCachedData(key, generator, ttl = this.cacheTimeout) {
    return await cacheService.cacheWithTTL(key, generator, ttl);
  }

  // Get cart for a user
  async getCart(userId) {
    await this.initialize();
    
    const cacheKey = `cart-${userId}`;
    return this.getCachedData(cacheKey, async () => {
      const cartsCollection = this.db.collection('carts');
      
      try {
        let cart = await cartsCollection.findOne({ userId });
        
        if (!cart) {
          // Create new cart if it doesn't exist
          cart = {
            id: `cart-${userId}`,
            userId,
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            total: 0,
            totalValue: 0,
            itemCount: 0,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await cartsCollection.insertOne(cart);
        }
        
        return cart;
      } catch (error) {
        console.error('Error fetching cart:', error);
        // Return empty cart as fallback
        return {
          id: `cart-${userId}`,
          userId,
          items: [],
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
          totalValue: 0,
          itemCount: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    });
  }

  // Add item to cart
  async addToCart(userId, productId, quantity = 1, options = {}) {
    await this.initialize();
    
    // In a real implementation, this would update MongoDB
    const product = await this.getProduct(productId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }
    
    const cart = await this.getCart(userId);
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId === productId && 
      JSON.stringify(item.options) === JSON.stringify(options)
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        id: `item-${Date.now()}`,
        productId,
        quantity,
        options,
        price: product.price,
        name: product.name,
        image: product.images[0],
        addedAt: new Date().toISOString()
      });
    }
    
    // Recalculate totals
    this.calculateCartTotals(cart);
    
    // Save to database
    const cartsCollection = this.db.collection('carts');
    await cartsCollection.updateOne(
      { userId },
      { 
        $set: { 
          ...cart,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    // Clear cache for this user
    await cacheService.invalidate(`cart-${userId}`);
    
    console.log(`Added ${quantity} of product ${productId} to cart for user ${userId}`);
    
    return cart;
  }

  // Remove item from cart
  async removeFromCart(userId, itemId) {
    await this.initialize();
    
    const cart = await this.getCart(userId);
    
    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      throw new Error(`Item with ID ${itemId} not found in cart`);
    }
    
    cart.items.splice(itemIndex, 1);
    
    // Recalculate totals
    this.calculateCartTotals(cart);
    
    // Save to database
    const cartsCollection = this.db.collection('carts');
    await cartsCollection.updateOne(
      { userId },
      { 
        $set: { 
          ...cart,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    // Clear cache for this user
    await cacheService.invalidate(`cart-${userId}`);
    
    console.log(`Removed item ${itemId} from cart for user ${userId}`);
    
    return cart;
  }

  // Update item quantity in cart
  async updateCartItemQuantity(userId, itemId, quantity) {
    await this.initialize();
    
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    
    const cart = await this.getCart(userId);
    
    const item = cart.items.find(item => item.id === itemId);
    
    if (!item) {
      throw new Error(`Item with ID ${itemId} not found in cart`);
    }
    
    if (quantity === 0) {
      return await this.removeFromCart(userId, itemId);
    }
    
    // Check stock availability
    const product = await this.getProduct(item.productId);
    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }
    
    item.quantity = quantity;
    
    // Recalculate totals
    this.calculateCartTotals(cart);
    
    // Save to database
    const cartsCollection = this.db.collection('carts');
    await cartsCollection.updateOne(
      { userId },
      { 
        $set: { 
          ...cart,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    // Clear cache for this user
    await cacheService.invalidate(`cart-${userId}`);
    
    console.log(`Updated quantity for item ${itemId} to ${quantity} for user ${userId}`);
    
    return cart;
  }

  // Clear cart
  async clearCart(userId) {
    await this.initialize();
    
    const cart = await this.getCart(userId);
    cart.items = [];
    cart.status = 'abandoned';
    this.calculateCartTotals(cart);
    
    // Save to database
    const cartsCollection = this.db.collection('carts');
    await cartsCollection.updateOne(
      { userId },
      { 
        $set: { 
          ...cart,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    // Clear cache for this user
    await cacheService.invalidate(`cart-${userId}`);
    
    console.log(`Cleared cart for user ${userId}`);
    
    return cart;
  }

  // Calculate cart totals
  calculateCartTotals(cart) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate tax (simplified - 8.5% tax rate)
    cart.tax = Math.round(cart.subtotal * 0.085 * 100) / 100;
    
    // Calculate shipping (free over $100, otherwise $10)
    cart.shipping = cart.subtotal >= 100 ? 0 : 10;
    
    // Calculate total
    cart.total = cart.subtotal + cart.tax + cart.shipping;
    cart.totalValue = cart.total; // For analytics compatibility
    
    cart.updatedAt = new Date();
  }

  // Get product details
  async getProduct(productId) {
    await this.initialize();
    
    // In a real implementation, this would query MongoDB
    // For now, return mock product
    const mockProducts = this.generateMockProducts();
    return mockProducts.find(p => p.id === productId);
  }

  // Generate mock products
  generateMockProducts() {
    return [
      {
        id: 'product-1',
        name: 'Nike Air Jordan 1 Retro High',
        price: 150,
        stock: 10,
        images: ['https://example.com/jordan1-1.jpg'],
        brand: 'Nike',
        category: 'Sneakers'
      },
      {
        id: 'product-2',
        name: 'Supreme Box Logo Hoodie',
        price: 300,
        stock: 5,
        images: ['https://example.com/supreme-hoodie-1.jpg'],
        brand: 'Supreme',
        category: 'Clothing'
      },
      {
        id: 'product-3',
        name: 'Yeezy 350 V2 Cream',
        price: 220,
        stock: 8,
        images: ['https://example.com/yeezy-350-1.jpg'],
        brand: 'Adidas',
        category: 'Sneakers'
      }
    ];
  }

  // Apply discount to cart
  async applyDiscount(userId, discountCode) {
    await this.initialize();
    
    const cart = await this.getCart(userId);
    
    // In a real implementation, this would validate discount code
    const discount = this.validateDiscountCode(discountCode);
    
    if (!discount) {
      throw new Error('Invalid discount code');
    }
    
    cart.discount = {
      code: discountCode,
      type: discount.type,
      value: discount.value,
      appliedAt: new Date().toISOString()
    };
    
    // Recalculate totals with discount
    this.calculateCartTotals(cart);
    
    return cart;
  }

  // Remove discount from cart
  async removeDiscount(userId) {
    await this.initialize();
    
    const cart = await this.getCart(userId);
    delete cart.discount;
    
    // Recalculate totals without discount
    this.calculateCartTotals(cart);
    
    return cart;
  }

  // Validate discount code
  validateDiscountCode(code) {
    const validCodes = {
      'WELCOME10': { type: 'percentage', value: 10 },
      'SAVE20': { type: 'percentage', value: 20 },
      'FREESHIP': { type: 'shipping', value: 0 },
      'FIXED50': { type: 'fixed', value: 50 }
    };
    
    return validCodes[code] || null;
  }

  // Get cart summary
  async getCartSummary(userId) {
    await this.initialize();
    
    const cart = await this.getCart(userId);
    
    return {
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      discount: cart.discount,
      total: cart.total,
      isEmpty: cart.items.length === 0
    };
  }

  // Check cart validity (stock, prices, etc.)
  async validateCart(userId) {
    await this.initialize();
    
    const cart = await this.getCart(userId);
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    for (const item of cart.items) {
      const product = await this.getProduct(item.productId);
      
      if (!product) {
        validation.isValid = false;
        validation.errors.push(`Product ${item.productId} no longer exists`);
        continue;
      }
      
      if (product.stock < item.quantity) {
        validation.isValid = false;
        validation.errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }
      
      if (product.price !== item.price) {
        validation.warnings.push(`Price changed for ${product.name}. Old: $${item.price}, New: $${product.price}`);
        item.price = product.price; // Update price
      }
    }
    
    if (validation.warnings.length > 0 || !validation.isValid) {
      this.calculateCartTotals(cart);
    }
    
    return {
      ...validation,
      cart: validation.isValid ? cart : null
    };
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new CartService();
