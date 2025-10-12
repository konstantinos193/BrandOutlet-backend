const rateLimit = require('express-rate-limit');

// Different rate limits for different types of requests
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
    skipSuccessfulRequests,
    // Custom handler for rate limit exceeded
    handler: (req, res) => {
      const isAuthenticated = req.user && req.user.id;
      const retryAfter = Math.ceil(windowMs / 1000);
      
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: isAuthenticated 
          ? 'Too many requests. Please wait before making more requests.'
          : 'Too many requests from this IP. Please authenticate for higher limits.',
        retryAfter,
        isAuthenticated,
        limit: max,
        windowMs: windowMs / 1000
      });
    }
  });
};

// Rate limits for different endpoints
const rateLimits = {
  // Very strict for unauthenticated requests
  strict: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    20, // 20 requests per 15 minutes for unauthenticated users
    'Too many requests from this IP, please try again later.'
  ),
  
  // Moderate for authenticated users
  moderate: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    200, // 200 requests per 15 minutes for authenticated users
    'Too many requests, please try again later.',
    true // Skip successful requests from counting
  ),
  
  // Lenient for admin users
  lenient: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    500, // 500 requests per 15 minutes for admin users
    'Too many requests, please try again later.',
    true // Skip successful requests from counting
  ),
  
  // Very lenient for health checks and public endpoints
  public: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    50, // 50 requests per 15 minutes for public endpoints
    'Too many requests to public endpoints, please try again later.'
  )
};

module.exports = rateLimits;
