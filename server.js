const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userPreferencesRoutes = require('./api/userPreferences');
const analyticsRoutes = require('./api/analytics');
const pageTrackingRoutes = require('./api/pageTracking');
const adminRoutes = require('./api/admin');
const productsRoutes = require('./api/products');
const variantsRoutes = require('./api/variants');
const topSellingRoutes = require('./api/topSelling');
const dataDrivenStrategiesRoutes = require('./api/dataDrivenStrategies');
const advancedSearchRoutes = require('./api/advancedSearch');
const ordersRoutes = require('./api/orders');
const paymentsRoutes = require('./api/payments');
const refundsRoutes = require('./api/refunds');
const globalSearchRoutes = require('./api/globalSearch');
const statsRoutes = require('./api/stats');
const trappersRoutes = require('./api/trappers');
const { router: sizeConversionRoutes } = require('./api/sizeConversion');
const seoRoutes = require('./api/seo');
const unifiedAnalyticsRoutes = require('./api/unifiedAnalytics');
const forecastingRoutes = require('./api/forecasting');
const realTimeRoutes = require('./api/realTime');
const insightsRoutes = require('./api/insights');
const seasonalTrendsRoutes = require('./api/seasonalTrends');
const productManagementRoutes = require('./api/productManagement');
const cartRoutes = require('./api/cart');
const userManagementRoutes = require('./api/userManagement');
const dashboardRoutes = require('./api/dashboard');
const notificationsRoutes = require('./api/notifications');
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

// API routes
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/page-tracking', pageTrackingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/variants', variantsRoutes);
app.use('/api/top-selling', topSellingRoutes);
app.use('/api/data-driven-strategies', dataDrivenStrategiesRoutes);
app.use('/api/search', advancedSearchRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/refunds', refundsRoutes);
app.use('/api/search/global', globalSearchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/trappers', trappersRoutes);
app.use('/api/sizeConversion', sizeConversionRoutes);
app.use('/api/seo', seoRoutes);
// Legacy SEO metrics endpoint for backward compatibility
app.use('/api/seo-metrics', seoRoutes);
app.use('/api/unified-analytics', unifiedAnalyticsRoutes);
app.use('/api/forecasting', forecastingRoutes);
app.use('/api/real-time', realTimeRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/seasonal-trends', seasonalTrendsRoutes);
app.use('/api/product-management', productManagementRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);

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
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics`);
      console.log(`👤 User Preferences API: http://localhost:${PORT}/api/user-preferences`);
      console.log(`📈 Page Tracking API: http://localhost:${PORT}/api/page-tracking`);
      console.log(`🔧 Admin API: http://localhost:${PORT}/api/admin`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
