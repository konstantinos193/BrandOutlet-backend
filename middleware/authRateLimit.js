const rateLimits = require('./rateLimiting');

// Middleware to apply different rate limits based on authentication
const authRateLimit = (req, res, next) => {
  // Check if user is authenticated
  const isAuthenticated = req.user && req.user.id;
  const isAdmin = req.user && req.user.role === 'admin';
  
  console.log('🔍 AuthRateLimit Debug:', {
    path: req.path,
    hasUser: !!req.user,
    userId: req.user?.id,
    userRole: req.user?.role,
    isAuthenticated,
    isAdmin,
    authHeader: req.headers.authorization ? 'Present' : 'Missing',
    tokenPreview: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'None'
  });
  
  if (isAdmin) {
    // Admin users get unlimited access - no rate limiting
    console.log('👑 Admin user - skipping rate limits (unlimited access)');
    return next();
  } else if (isAuthenticated) {
    // Regular authenticated users get moderate rate limit
    console.log('✅ Applying authenticated rate limit (200 requests)');
    return rateLimits.moderate(req, res, next);
  } else {
    // Unauthenticated users get strict rate limit
    console.log('❌ Applying strict rate limit (20 requests)');
    return rateLimits.strict(req, res, next);
  }
};

module.exports = authRateLimit;
