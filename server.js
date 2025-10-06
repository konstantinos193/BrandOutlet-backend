const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import route loader for dynamic loading
const { getLazyRouteHandler, preloadCriticalRoutes } = require('./utils/routeLoader');
const { preloadCriticalServices } = require('./utils/serviceLoader');

// Import Redis client
const { connectRedis } = require('./config/redis');

// Critical routes that should be loaded immediately
const criticalRoutes = [
  './api/userPreferences',
  './api/analytics',
  './api/pageTracking',
  './api/products',
  './api/cart',
  './api/admin'
];

// Heavy routes that can be loaded on-demand
const heavyRoutes = [
  './api/unifiedAnalytics',
  './api/forecasting',
  './api/realTime',
  './api/insights',
  './api/seasonalTrends',
  './api/productManagement',
  './api/userManagement',
  './api/dashboard',
  './api/notifications',
  './api/customOrders',
  './api/ml',
  './api/validation',
  './api/file-processing'
];
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for rate limiting (required for production deployments)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://jordioresell.vercel.app', // Add your Vercel domain
  'http://localhost:3000', // Local development
  'http://localhost:3001' // Local backend
];

// Function to check if origin matches Vercel pattern
const isVercelOrigin = (origin) => {
  return origin && origin.includes('.vercel.app');
};

// Debug CORS
console.log('🔧 CORS Configuration:');
console.log('Allowed Origins:', allowedOrigins);
console.log('Frontend URL from env:', process.env.FRONTEND_URL);
console.log('Node Environment:', process.env.NODE_ENV);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS Request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      const isMatch = origin === allowedOrigin;
      console.log(`🔍 Checking exact ${allowedOrigin} against ${origin}: ${isMatch}`);
      return isMatch;
    }) || isVercelOrigin(origin); // Also check for Vercel origins
    
    if (isAllowed) {
      console.log('✅ Origin allowed:', origin);
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Development mode - allowing origin:', origin);
      return callback(null, true);
    }
    
    // Reject other origins
    console.log('❌ Origin rejected:', origin);
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  trustProxy: true // Trust proxy for accurate IP detection
});
app.use('/api/', limiter);

// Logging
if (process.env.ENABLE_REQUEST_LOGGING !== 'false') {
  app.use(morgan(process.env.LOG_LEVEL === 'debug' ? 'dev' : 'combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
const healthCheckPath = process.env.HEALTH_CHECK_PATH || '/health';
app.get(healthCheckPath, (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  };

  // Add detailed health checks if enabled
  if (process.env.DETAILED_HEALTH_CHECKS === 'true') {
    healthData.details = {
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  res.status(200).json(healthData);
});

// Test endpoint to verify route loading
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API routes are working',
    timestamp: new Date().toISOString()
  });
});

// Direct analytics tracking endpoint (bypasses route loader)
let analyticsEvents = [];
const maxEvents = 10000;

app.post('/api/analytics/track', (req, res) => {
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

// API routes - Critical routes loaded immediately
console.log('🔧 Loading critical API routes...');
app.use('/api/user-preferences', getLazyRouteHandler('./api/userPreferences'));
app.use('/api/analytics', getLazyRouteHandler('./api/analytics-cached')); // Use cached analytics
app.use('/api/analytics-tracker', getLazyRouteHandler('./api/analytics-tracker')); // Simple analytics tracker
app.use('/api/page-tracking', getLazyRouteHandler('./api/pageTracking'));
app.use('/api/products', getLazyRouteHandler('./api/products-cached')); // Use cached products
app.use('/api/cart', getLazyRouteHandler('./api/cart'));
app.use('/api/admin', getLazyRouteHandler('./api/admin')); // Admin dashboard
console.log('✅ Critical routes loaded');

// Admin route loaded with critical routes (moved above)
app.use('/api/unified-analytics', getLazyRouteHandler('./api/unifiedAnalytics'));
app.use('/api/forecasting', getLazyRouteHandler('./api/forecasting'));
app.use('/api/real-time', getLazyRouteHandler('./api/realTime'));
app.use('/api/insights', getLazyRouteHandler('./api/insights'));
app.use('/api/seasonal-trends', getLazyRouteHandler('./api/seasonalTrends'));
app.use('/api/product-management', getLazyRouteHandler('./api/productManagement'));
app.use('/api/user-management', getLazyRouteHandler('./api/userManagement'));
app.use('/api/dashboard', getLazyRouteHandler('./api/dashboard'));
app.use('/api/notifications', getLazyRouteHandler('./api/notifications'));
app.use('/api/custom-orders', getLazyRouteHandler('./api/customOrders'));
app.use('/api/performance-analytics', getLazyRouteHandler('./api/performance-analytics'));
app.use('/api/ml', getLazyRouteHandler('./api/ml'));

// Additional routes with lazy loading
console.log('🔧 Loading additional API routes...');
app.use('/api/variants', getLazyRouteHandler('./api/variants'));
app.use('/api/top-selling', getLazyRouteHandler('./api/topSelling'));
app.use('/api/data-driven-strategies', getLazyRouteHandler('./api/dataDrivenStrategies'));
app.use('/api/search', getLazyRouteHandler('./api/advancedSearch'));
app.use('/api/orders', getLazyRouteHandler('./api/orders'));
app.use('/api/payments', getLazyRouteHandler('./api/payments'));
app.use('/api/refunds', getLazyRouteHandler('./api/refunds'));
app.use('/api/search/global', getLazyRouteHandler('./api/globalSearch'));
app.use('/api/stats', getLazyRouteHandler('./api/stats'));
console.log('✅ Stats route loaded: /api/stats');
app.use('/api/trappers', getLazyRouteHandler('./api/trappers'));
app.use('/api/sizeConversion', getLazyRouteHandler('./api/sizeConversion'));
app.use('/api/seo', getLazyRouteHandler('./api/seo'));
// Legacy SEO metrics endpoint for backward compatibility
app.use('/api/seo-metrics', getLazyRouteHandler('./api/seo'));
console.log('✅ All additional routes loaded');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - catch all routes that don't match any defined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server and connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    await connectDB();
    
    // Connect to Redis (optional)
    let redisClient;
    try {
      redisClient = await connectRedis();
      if (redisClient && redisClient.isFallback) {
        console.log('⚠️ Redis not available, using fallback mode');
      } else {
        console.log('✓ Redis client initialized');
      }
    } catch (error) {
      console.warn('⚠️ Redis not available, using fallback mode:', error.message);
      // Continue without Redis - the app should still work
      redisClient = null;
    }
    
    // Preload critical routes for faster initial response
    await preloadCriticalRoutes(criticalRoutes);
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics`);
      console.log(`👤 User Preferences API: http://localhost:${PORT}/api/user-preferences`);
      console.log(`📈 Page Tracking API: http://localhost:${PORT}/api/page-tracking`);
      console.log(`🔧 Admin API: http://localhost:${PORT}/api/admin`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`⚡ Code splitting enabled - heavy routes loaded on-demand`);
      console.log(`📦 Redis caching enabled - API queries cached for performance`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
