const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const userPreferencesRoutes = require('./api/userPreferences');
const analyticsRoutes = require('./api/analytics');
const pageTrackingRoutes = require('./api/pageTracking');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
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
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
