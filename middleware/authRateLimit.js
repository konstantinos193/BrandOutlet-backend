const rateLimits = require('./rateLimiting');

// Middleware to apply different rate limits based on authentication
const authRateLimit = (req, res, next) => {
  // Check if user is authenticated
  const isAuthenticated = req.user && req.user.id;
  const isAdmin = req.user && req.user.role === 'admin';
  
  if (isAdmin) {
    // Admin users get the most lenient rate limit
    return rateLimits.lenient(req, res, next);
  } else if (isAuthenticated) {
    // Regular authenticated users get moderate rate limit
    return rateLimits.moderate(req, res, next);
  } else {
    // Unauthenticated users get strict rate limit
    return rateLimits.strict(req, res, next);
  }
};

module.exports = authRateLimit;
