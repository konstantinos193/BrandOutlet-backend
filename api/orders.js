const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// GET /api/orders - Get orders with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    console.log('📦 Fetching orders from database');

    const db = await getDB();
    const ordersCollection = db.collection('orders');

    // Build query filters
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'seller.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get orders from database
    const orders = await ordersCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count for pagination
    const total = await ordersCollection.countDocuments(query);

    // Transform orders to match expected format
    const transformedOrders = orders.map(order => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
      customer: {
        id: order.customer?.id || order.customerId?.toString(),
        name: order.customer?.name || 'Unknown Customer',
        email: order.customer?.email || '',
        phone: order.customer?.phone || '',
        address: order.customer?.address || {}
      },
      seller: {
        id: order.seller?.id || order.sellerId?.toString(),
        name: order.seller?.name || 'Unknown Seller',
        email: order.seller?.email || ''
      },
      items: order.items || [],
      status: order.status || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.paymentMethod || 'credit_card',
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      totalAmount: order.totalAmount || 0,
      currency: order.currency || 'EUR',
      shippingAddress: order.shippingAddress || {},
      billingAddress: order.billingAddress || {},
      notes: order.notes || '',
      trackingNumber: order.trackingNumber || '',
      estimatedDelivery: order.estimatedDelivery || null,
      deliveredAt: order.deliveredAt || null,
      createdAt: order.createdAt || new Date(),
      updatedAt: order.updatedAt || new Date()
    }));

    res.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          search,
          status,
          paymentStatus,
          dateFrom,
          dateTo,
          minAmount: minAmount ? parseFloat(minAmount) : null,
          maxAmount: maxAmount ? parseFloat(maxAmount) : null
        }
      }
    });

  } catch (error) {
    console.error('Error fetching orders from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error.message
    });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📦 Fetching order ${id} from database`);

    const db = await getDB();
    const ordersCollection = db.collection('orders');

    const order = await ordersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const transformedOrder = {
      id: order._id.toString(),
      orderNumber: order.orderNumber || `ORD-${order._id.toString().slice(-6)}`,
      customer: {
        id: order.customer?.id || order.customerId?.toString(),
        name: order.customer?.name || 'Unknown Customer',
        email: order.customer?.email || '',
        phone: order.customer?.phone || '',
        address: order.customer?.address || {}
      },
      seller: {
        id: order.seller?.id || order.sellerId?.toString(),
        name: order.seller?.name || 'Unknown Seller',
        email: order.seller?.email || ''
      },
      items: order.items || [],
      status: order.status || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      paymentMethod: order.paymentMethod || 'credit_card',
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      discount: order.discount || 0,
      totalAmount: order.totalAmount || 0,
      currency: order.currency || 'EUR',
      shippingAddress: order.shippingAddress || {},
      billingAddress: order.billingAddress || {},
      notes: order.notes || '',
      trackingNumber: order.trackingNumber || '',
      estimatedDelivery: order.estimatedDelivery || null,
      deliveredAt: order.deliveredAt || null,
      createdAt: order.createdAt || new Date(),
      updatedAt: order.updatedAt || new Date()
    };

    res.json({
      success: true,
      data: transformedOrder
    });

  } catch (error) {
    console.error('Error fetching order from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      message: error.message
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`📦 Updating order ${id} status to ${status} in database`);

    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, confirmed, processing, shipped, delivered, cancelled, or refunded'
      });
    }

    const db = await getDB();
    const ordersCollection = db.collection('orders');

    const updateData = { 
      status,
      updatedAt: new Date()
    };

    // Add deliveredAt timestamp if status is delivered
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { status }
    });

  } catch (error) {
    console.error('Error updating order status in database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order status',
      message: error.message
    });
  }
});

// PUT /api/orders/:id/tracking - Update tracking information
router.put('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    console.log(`📦 Updating tracking info for order ${id} in database`);

    const db = await getDB();
    const ordersCollection = db.collection('orders');

    const updateData = {
      trackingNumber,
      carrier,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      updatedAt: new Date()
    };

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Tracking information updated successfully',
      data: { trackingNumber, carrier, estimatedDelivery }
    });

  } catch (error) {
    console.error('Error updating tracking info in database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tracking information',
      message: error.message
    });
  }
});

// GET /api/orders/stats - Get order statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching order statistics from database');

    const db = await getDB();
    const ordersCollection = db.collection('orders');

    // Get total orders
    const total = await ordersCollection.countDocuments();

    // Get orders by status
    const pending = await ordersCollection.countDocuments({ status: 'pending' });
    const confirmed = await ordersCollection.countDocuments({ status: 'confirmed' });
    const processing = await ordersCollection.countDocuments({ status: 'processing' });
    const shipped = await ordersCollection.countDocuments({ status: 'shipped' });
    const delivered = await ordersCollection.countDocuments({ status: 'delivered' });
    const cancelled = await ordersCollection.countDocuments({ status: 'cancelled' });

    // Get orders by payment status
    const paymentPending = await ordersCollection.countDocuments({ paymentStatus: 'pending' });
    const paymentCompleted = await ordersCollection.countDocuments({ paymentStatus: 'completed' });
    const paymentFailed = await ordersCollection.countDocuments({ paymentStatus: 'failed' });

    // Calculate total revenue
    const revenueResult = await ordersCollection.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]).toArray();

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Calculate average order value
    const avgOrderValue = total > 0 ? totalRevenue / total : 0;

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          confirmed,
          processing,
          shipped,
          delivered,
          cancelled
        },
        byPaymentStatus: {
          pending: paymentPending,
          completed: paymentCompleted,
          failed: paymentFailed
        },
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: Math.round(avgOrderValue * 100) / 100
      }
    });

  } catch (error) {
    console.error('Error fetching order statistics from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics',
      message: error.message
    });
  }
});

module.exports = router;