const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import route loader for dynamic loading
const { getLazyRouteHandler, preloadCriticalRoutes } = require('./utils/routeLoader');
const { preloadCriticalServices } = require('./utils/serviceLoader');

// Direct imports for critical routes
const trappersRouter = require('./api/trappers');
const statsRouter = require('./api/stats');
const pageTrackingRouter = require('./api/pageTracking');

// Import Redis client
const { connectRedis } = require('./config/redis');

// Critical routes that should be loaded immediately
const criticalRoutes = [
  './api/userPreferences',
  './api/analytics',
  './api/pageTracking',
  './api/products',
  './api/cart',
  './api/admin',
  './api/stats',
  './api/auth'
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

// Import custom rate limiting middleware
const rateLimits = require('./middleware/rateLimiting');

// Apply different rate limits based on route
app.use('/api/health', rateLimits.public);
app.use('/api/test', rateLimits.public);
app.use('/api/analytics/track', rateLimits.public);

// Apply strict rate limiting to unauthenticated routes only
// Skip admin routes as they have their own authentication and rate limiting
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for admin routes (they have their own auth + rate limiting)
  if (req.path.startsWith('/admin')) {
    return next();
  }
  // Skip rate limiting for trappers API (public data, no sensitive operations)
  if (req.path.startsWith('/trappers')) {
    return next();
  }
  // Skip rate limiting for stats API (public data)
  if (req.path.startsWith('/stats')) {
    return next();
  }
  // Apply strict rate limiting to other routes
  return rateLimits.strict(req, res, next);
});

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
app.use('/api/page-tracking', pageTrackingRouter);
app.use('/api/products', getLazyRouteHandler('./api/products-cached')); // Use cached products
app.use('/api/cart', getLazyRouteHandler('./api/cart'));
app.use('/api/admin', getLazyRouteHandler('./api/admin')); // Admin dashboard
app.use('/api/auth', getLazyRouteHandler('./api/auth')); // Authentication
console.log('✅ Critical routes loaded');

// Admin route loaded with critical routes (moved above)
app.use('/api/unified-analytics', getLazyRouteHandler('./api/unifiedAnalytics'));
app.use('/api/forecasting', getLazyRouteHandler('./api/forecasting'));
app.use('/api/real-time', getLazyRouteHandler('./api/realTime'));
app.use('/api/insights', getLazyRouteHandler('./api/insights'));
app.use('/api/seasonal-trends', getLazyRouteHandler('./api/seasonalTrends'));
app.use('/api/product-management', getLazyRouteHandler('./api/productManagement'));
app.use('/api/user-management', getLazyRouteHandler('./api/userManagement'));
app.use('/api/notifications', getLazyRouteHandler('./api/notifications'));
app.use('/api/custom-orders', getLazyRouteHandler('./api/customOrders'));
app.use('/api/performance-analytics', getLazyRouteHandler('./api/performance-analytics'));
app.use('/api/ml', getLazyRouteHandler('./api/ml'));

// Additional routes with lazy loading
console.log('🔧 Loading additional API routes...');
app.use('/api/variants', getLazyRouteHandler('./api/variants'));
// Move top-selling to admin routes since it's used in admin dashboard
app.use('/api/admin/top-selling', getLazyRouteHandler('./api/topSelling'));
app.use('/api/data-driven-strategies', getLazyRouteHandler('./api/dataDrivenStrategies'));
app.use('/api/search', getLazyRouteHandler('./api/advancedSearch'));
app.use('/api/orders', getLazyRouteHandler('./api/orders'));
app.use('/api/payments', getLazyRouteHandler('./api/payments'));
app.use('/api/refunds', getLazyRouteHandler('./api/refunds'));
app.use('/api/search/global', getLazyRouteHandler('./api/globalSearch'));
app.use('/api/stats', statsRouter);
console.log('✅ Stats route loaded: /api/stats');
app.use('/api/trappers', trappersRouter);
app.use('/api/sizeConversion', getLazyRouteHandler('./api/sizeConversion'));
app.use('/api/seo', getLazyRouteHandler('./api/seo'));
// Legacy SEO metrics endpoint for backward compatibility
app.use('/api/seo-metrics', getLazyRouteHandler('./api/seo'));
// Seed routes for database initialization
app.use('/api/seed', getLazyRouteHandler('./api/seed.js'));
console.log('✅ All additional routes loaded');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Serve fonts from backend public directory
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));

// Root route - Dark and dank landing page for accidental visitors
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BrandOutlet Backend - Access Denied</title>
    <style>
        @font-face {
            font-family: 'Moondalator';
            src: url('/fonts/moondalator/Moogalator-yYJr3.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
        
        @font-face {
            font-family: 'SuperCacao';
            src: url('/fonts/supercocoa/SuperCacao-qZr8x.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'SuperCacao', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00ff00;
            overflow: hidden;
            position: relative;
        }
        
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 80%, rgba(0, 255, 0, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(0, 255, 255, 0.05) 0%, transparent 50%);
            animation: matrix 20s linear infinite;
            z-index: -1;
        }
        
        @keyframes matrix {
            0% { transform: translateY(0) rotate(0deg); }
            100% { transform: translateY(-100px) rotate(360deg); }
        }
        
        .container {
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(15px);
            border-radius: 15px;
            padding: 3rem;
            text-align: center;
            max-width: 700px;
            width: 90%;
            box-shadow: 
                0 0 50px rgba(0, 255, 0, 0.3),
                inset 0 0 50px rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            position: relative;
            overflow: hidden;
        }
        
        .container::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #00ff00, #ff00ff, #00ffff, #ff0000, #00ff00);
            background-size: 300% 300%;
            border-radius: 15px;
            z-index: -1;
            animation: borderGlow 3s linear infinite;
        }
        
        @keyframes borderGlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .logo {
            font-family: 'Moondalator', monospace;
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            text-shadow: 
                0 0 10px #00ff00,
                0 0 20px #00ff00,
                0 0 30px #00ff00;
            background: linear-gradient(45deg, #00ff00, #00ffff, #ff00ff, #ffff00);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: logoGlow 2s ease-in-out infinite alternate;
        }
        
        @keyframes logoGlow {
            0% { 
                background-position: 0% 50%;
                filter: hue-rotate(0deg);
            }
            100% { 
                background-position: 100% 50%;
                filter: hue-rotate(90deg);
            }
        }
        
        .subtitle {
            font-size: 1.4rem;
            margin-bottom: 2rem;
            color: #ff00ff;
            text-shadow: 0 0 10px #ff00ff;
            font-weight: 300;
            letter-spacing: 2px;
        }
        
        .main-title {
            font-size: 2.8rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
            color: #ff0000;
            text-shadow: 
                0 0 10px #ff0000,
                0 0 20px #ff0000;
            animation: glitch 2s infinite;
        }
        
        @keyframes glitch {
            0%, 100% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
        }
        
        .description {
            font-size: 1.2rem;
            line-height: 1.8;
            margin-bottom: 2rem;
            color: #00ffff;
            text-shadow: 0 0 5px #00ffff;
        }
        
        .warning {
            background: rgba(255, 0, 0, 0.2);
            border: 2px solid #ff0000;
            border-radius: 10px;
            padding: 1.5rem;
            margin: 2rem 0;
            font-size: 1.1rem;
            color: #ff0000;
            text-shadow: 0 0 10px #ff0000;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
            animation: warningPulse 1.5s infinite;
        }
        
        @keyframes warningPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.3); }
            50% { box-shadow: 0 0 30px rgba(255, 0, 0, 0.6); }
        }
        
        .warning strong {
            color: #ffff00;
            text-shadow: 0 0 10px #ffff00;
        }
        
        .ascii-art {
            font-family: monospace;
            font-size: 0.8rem;
            color: #00ff00;
            margin: 1rem 0;
            white-space: pre;
            text-shadow: 0 0 5px #00ff00;
        }
        
        .blink {
            animation: blink 1s infinite;
        }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        
        .footer {
            margin-top: 2rem;
            font-size: 1rem;
            color: #00ff00;
            text-shadow: 0 0 5px #00ff00;
        }
        
        .tech-stack {
            font-size: 0.9rem;
            margin-top: 0.5rem;
            color: #ff00ff;
            text-shadow: 0 0 5px #ff00ff;
        }
        
        @media (max-width: 768px) {
            .logo {
                font-size: 2.5rem;
            }
            
            .subtitle {
                font-size: 1.2rem;
            }
            
            .main-title {
                font-size: 2rem;
            }
            
            .description {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">BrandOutlet</div>
        <div class="subtitle">BACKEND SERVICES</div>
        
        <h1 class="main-title">ACCESS DENIED</h1>
        
        <div class="ascii-art">
    ███████╗██╗   ██╗███████╗███████╗███████╗███████╗███████╗
    ██╔════╝██║   ██║██╔════╝██╔════╝██╔════╝██╔════╝██╔════╝
    ██║     ██║   ██║█████╗  █████╗  █████╗  █████╗  █████╗  
    ██║     ██║   ██║██╔══╝  ██╔══╝  ██╔══╝  ██╔══╝  ██╔══╝  
    ╚██████╗╚██████╔╝███████╗███████╗███████╗███████╗███████╗
     ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚══════╝╚══════╝╚══════╝
        </div>
        
        <div class="description">
            Well, well, well... look who's being a little too curious. This is our backend API server, not a fancy website. You're probably looking for the <strong>frontend</strong> where all the magic happens.
        </div>
        
        <div class="warning">
            <strong>WARNING:</strong> If you're not a developer, you might want to head over to our actual website instead of poking around in our server code. This area is restricted.
        </div>
        
        <div class="description">
            But hey, since you're here... want to see some cool API endpoints? Just kidding! <span class="blink">_</span>
        </div>
        
        <div class="footer">
            <div>Made with dark energy by the BrandOutlet team</div>
            <div class="tech-stack">Backend running on Node.js • MongoDB • Redis • Lots of coffee and dark magic</div>
        </div>
    </div>
</body>
</html>
  `);
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
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
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
