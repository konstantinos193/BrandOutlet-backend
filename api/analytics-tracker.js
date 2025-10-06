const express = require('express');
const router = express.Router();

// In-memory storage for analytics events
const analyticsEvents = [];
const maxEvents = 10000; // Keep last 10k events

// POST /api/analytics-tracker/track - Track analytics events
router.post('/track', async (req, res) => {
  try {
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
      receivedAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };

    // Store event
    analyticsEvents.push(trackedEvent);
    
    // Keep only last maxEvents
    if (analyticsEvents.length > maxEvents) {
      analyticsEvents.splice(0, analyticsEvents.length - maxEvents);
    }

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
    const limit = parseInt(req.query.limit) || 100;
    const events = analyticsEvents.slice(-limit);
    
    res.json({
      success: true,
      data: events,
      total: analyticsEvents.length,
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
    const stats = {
      totalEvents: analyticsEvents.length,
      uniqueUsers: new Set(analyticsEvents.map(e => e.user_id)).size,
      uniqueSessions: new Set(analyticsEvents.map(e => e.session_id)).size,
      lastEvent: analyticsEvents[analyticsEvents.length - 1]?.timestamp,
      firstEvent: analyticsEvents[0]?.timestamp
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
