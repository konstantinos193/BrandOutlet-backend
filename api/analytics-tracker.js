const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');

let db = null;

// Initialize database connection
const initializeDB = async () => {
  if (!db) {
    db = await connectDB();
  }
};

// POST /api/analytics-tracker/track - Track analytics events
router.post('/track', async (req, res) => {
  try {
    await initializeDB();
    const event = req.body;
    
    // Validate required fields
    if (!event.eventName || !event.timestamp) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventName, timestamp'
      });
    }

    // Add metadata
    const trackedEvent = {
      ...event,
      id: Date.now() + Math.random(),
      receivedAt: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      createdAt: new Date()
    };

    // Store event in MongoDB
    const analyticsCollection = db.collection('analyticsEvents');
    await analyticsCollection.insertOne(trackedEvent);

    console.log(`📊 Analytics event tracked: ${event.eventName}`);

    res.json({
      success: true,
      message: 'Event tracked successfully',
      eventId: trackedEvent.id
    });

  } catch (error) {
    console.error('Error tracking analytics event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      message: error.message
    });
  }
});

// GET /api/analytics-tracker/events - Get analytics events
router.get('/events', async (req, res) => {
  try {
    await initializeDB();
    const limit = parseInt(req.query.limit) || 100;
    const analyticsCollection = db.collection('analyticsEvents');
    
    const events = await analyticsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    const total = await analyticsCollection.countDocuments();
    
    res.json({
      success: true,
      data: events,
      total: total,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching analytics events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// GET /api/analytics-tracker/stats - Get analytics stats
router.get('/stats', async (req, res) => {
  try {
    await initializeDB();
    const analyticsCollection = db.collection('analyticsEvents');
    
    const [totalEvents, uniqueUsers, uniqueSessions, lastEvent, firstEvent] = await Promise.all([
      analyticsCollection.countDocuments(),
      analyticsCollection.distinct('user_id').then(users => users.length),
      analyticsCollection.distinct('session_id').then(sessions => sessions.length),
      analyticsCollection.findOne({}, { sort: { createdAt: -1 } }),
      analyticsCollection.findOne({}, { sort: { createdAt: 1 } })
    ]);
    
    const stats = {
      totalEvents,
      uniqueUsers,
      uniqueSessions,
      lastEvent: lastEvent?.timestamp,
      firstEvent: firstEvent?.timestamp
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

module.exports = router;
