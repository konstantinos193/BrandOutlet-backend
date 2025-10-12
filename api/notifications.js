const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { connectDB } = require('../config/database');
const router = express.Router();

let db = null;

// Initialize database connection
const initializeDB = async () => {
  if (!db) {
    db = await connectDB();
  }
  return db;
};

// Sample notifications data (in production, this would come from database)
const sampleNotifications = [
  {
    id: uuidv4(),
    type: 'order',
    title: 'New Order Received',
    message: 'Order #ORD-001 from John Doe for €299.99',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    unread: true,
    priority: 'high',
    data: {
      orderId: 'ORD-001',
      customerName: 'John Doe',
      amount: 299.99,
      status: 'pending'
    }
  },
  {
    id: uuidv4(),
    type: 'inventory',
    title: 'Low Stock Alert',
    message: 'Nike Air Max 270 - Size 10 is running low (3 items left)',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    unread: true,
    priority: 'medium',
    data: {
      productId: 'PROD-123',
      productName: 'Nike Air Max 270',
      currentStock: 3,
      threshold: 5
    }
  },
  {
    id: uuidv4(),
    type: 'system',
    title: 'System Update',
    message: 'Scheduled maintenance completed successfully',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unread: false,
    priority: 'low',
    data: {
      updateType: 'maintenance',
      duration: '30 minutes',
      status: 'completed'
    }
  },
  {
    id: uuidv4(),
    type: 'user',
    title: 'New User Registration',
    message: 'Sarah Wilson has registered for an account',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    unread: false,
    priority: 'low',
    data: {
      userId: 'USER-456',
      userName: 'Sarah Wilson',
      registrationDate: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  },
  {
    id: uuidv4(),
    type: 'payment',
    title: 'Payment Processed',
    message: 'Payment of €299.99 for Order #ORD-001 has been processed successfully',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    unread: false,
    priority: 'medium',
    data: {
      orderId: 'ORD-001',
      amount: 299.99,
      paymentMethod: 'Credit Card',
      transactionId: 'TXN-789'
    }
  }
];

// Initialize sample data in database
const initializeSampleData = async () => {
  try {
    const database = await initializeDB();
    const notificationsCollection = database.collection('notifications');
    
    // Check if notifications already exist
    const existingCount = await notificationsCollection.countDocuments();
    if (existingCount === 0) {
      // Insert sample notifications
      await notificationsCollection.insertMany(sampleNotifications);
      console.log('✅ Sample notifications initialized in database');
    }
  } catch (error) {
    console.error('Error initializing sample notifications:', error);
  }
};

// Initialize sample data on startup
initializeSampleData();

// GET /api/notifications - Get all notifications
router.get('/', async (req, res) => {
  try {
    await initializeDB();
    const { limit = 50, unread_only = false, type } = req.query;
    
    const notificationsCollection = db.collection('notifications');
    
    // Build query
    const query = {};
    if (unread_only === 'true') {
      query.unread = true;
    }
    if (type) {
      query.type = type;
    }
    
    // Get notifications from database
    const notifications = await notificationsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    // Count unread notifications
    const unreadCount = await notificationsCollection.countDocuments({ unread: true });
    
    res.json({
      success: true,
      data: {
        notifications: notifications,
        total: notifications.length,
        unreadCount: unreadCount,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const database = await initializeDB();
    const notificationsCollection = database.collection('notifications');
    const unreadCount = await notificationsCollection.countDocuments({ unread: true });
    
    res.json({
      success: true,
      data: {
        unreadCount: unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count',
      message: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    await initializeDB();
    const { id } = req.params;
    
    const notificationsCollection = db.collection('notifications');
    const result = await notificationsCollection.updateOne(
      { id: id },
      { $set: { unread: false, readAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const database = await initializeDB();
    const notificationsCollection = database.collection('notifications');
    
    const result = await notificationsCollection.updateMany(
      { unread: true },
      { $set: { unread: false, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await initializeDB();
    const { id } = req.params;
    
    const notificationsCollection = db.collection('notifications');
    const result = await notificationsCollection.deleteOne({ id: id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

// POST /api/notifications - Create new notification
router.post('/', async (req, res) => {
  try {
    await initializeDB();
    const { type, title, message, priority = 'medium', data = {} } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, title, message'
      });
    }

    const notification = {
      id: uuidv4(),
      type,
      title,
      message,
      priority,
      data,
      timestamp: new Date(),
      unread: true,
      createdAt: new Date()
    };

    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.insertOne(notification);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      message: error.message
    });
  }
});

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const database = await initializeDB();
    const notificationsCollection = database.collection('notifications');
    
    const [total, unread, byType] = await Promise.all([
      notificationsCollection.countDocuments(),
      notificationsCollection.countDocuments({ unread: true }),
      notificationsCollection.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]).toArray()
    ]);

    const typeStats = {};
    byType.forEach(stat => {
      typeStats[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        total,
        unread,
        byType: typeStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification stats',
      message: error.message
    });
  }
});

module.exports = router;