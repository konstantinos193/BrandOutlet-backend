const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');
const router = express.Router();

// In-memory storage for notifications (replace with database in production)
let notifications = [
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
    type: 'verification',
    title: 'Product Verification Pending',
    message: '3 products waiting for authenticity verification',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unread: true,
    priority: 'medium',
    data: {
      pendingCount: 3,
      products: ['Nike Air Max', 'Adidas Ultraboost', 'Jordan 1 Retro']
    }
  },
  {
    id: uuidv4(),
    type: 'system',
    title: 'System Update Available',
    message: 'Version 2.1.0 is ready to install with new features',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    unread: false,
    priority: 'low',
    data: {
      version: '2.1.0',
      features: ['Enhanced analytics', 'New payment methods', 'Improved UI']
    }
  },
  {
    id: uuidv4(),
    type: 'inventory',
    title: 'Low Stock Alert',
    message: 'Nike Air Max 270 is running low (5 items left)',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    unread: true,
    priority: 'medium',
    data: {
      productName: 'Nike Air Max 270',
      currentStock: 5,
      minThreshold: 10
    }
  }
];

// GET /api/notifications - Get all notifications
router.get('/', async (req, res) => {
  try {
    const { limit = 50, unread_only = false, type } = req.query;
    
    let filteredNotifications = [...notifications];
    
    // Filter by unread status
    if (unread_only === 'true') {
      filteredNotifications = filteredNotifications.filter(n => n.unread);
    }
    
    // Filter by type
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }
    
    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit
    const limitedNotifications = filteredNotifications.slice(0, parseInt(limit));
    
    // Count unread notifications
    const unreadCount = notifications.filter(n => n.unread).length;
    
    res.json({
      success: true,
      data: {
        notifications: limitedNotifications,
        total: filteredNotifications.length,
        unreadCount,
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

// GET /api/notifications/unread-count - Get unread count only
router.get('/unread-count', async (req, res) => {
  try {
    const unreadCount = notifications.filter(n => n.unread).length;
    
    res.json({
      success: true,
      data: {
        unreadCount,
        lastChecked: new Date().toISOString()
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
    const { id } = req.params;
    
    const notification = notifications.find(n => n.id === id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    notification.unread = false;
    notification.readAt = new Date();
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: {
        id: notification.id,
        unread: notification.unread
      }
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
    const updatedCount = notifications.filter(n => n.unread).length;
    
    notifications.forEach(notification => {
      if (notification.unread) {
        notification.unread = false;
        notification.readAt = new Date();
      }
    });
    
    res.json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      data: {
        updatedCount,
        unreadCount: 0
      }
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
    const { id } = req.params;
    
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    notifications.splice(notificationIndex, 1);
    
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

// POST /api/notifications - Create new notification (for testing or admin use)
router.post('/', async (req, res) => {
  try {
    const { type, title, message, priority = 'medium', data = {} } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, title, message'
      });
    }
    
    const newNotification = {
      id: uuidv4(),
      type,
      title,
      message,
      timestamp: new Date(),
      unread: true,
      priority,
      data
    };
    
    notifications.unshift(newNotification); // Add to beginning
    
    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: newNotification
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
    const total = notifications.length;
    const unread = notifications.filter(n => n.unread).length;
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {});
    const byPriority = notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        total,
        unread,
        read: total - unread,
        byType,
        byPriority,
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
