/**
 * Route Loader Utility
 * 
 * Dynamic route loading for performance optimization
 */

const fs = require('fs');
const path = require('path');

// Cache for loaded routes
const routeCache = new Map();

/**
 * Get lazy route handler
 * @param {string} routePath - Path to route file
 * @returns {Function} Route handler function
 */
function getLazyRouteHandler(routePath) {
  return async (req, res, next) => {
    try {
      // Check if route is already loaded
      if (routeCache.has(routePath)) {
        const route = routeCache.get(routePath);
        return route(req, res, next);
      }

      // Load route dynamically - resolve relative to backend directory
      const backendDir = path.dirname(require.main.filename) || process.cwd();
      let fullPath = path.resolve(backendDir, routePath);
      
      // If file doesn't exist, try with .js extension
      if (!fs.existsSync(fullPath) && !routePath.endsWith('.js')) {
        const pathWithExt = routePath + '.js';
        fullPath = path.resolve(backendDir, pathWithExt);
      }
      
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Route file not found: ${routePath}`);
        return res.status(404).json({
          success: false,
          message: 'Route not found',
          route: routePath
        });
      }

      // Clear require cache for fresh load
      delete require.cache[require.resolve(fullPath)];
      
      // Load the route
      const route = require(fullPath);
      
      // Cache the route
      routeCache.set(routePath, route);
      
      // Execute the route
      return route(req, res, next);
      
    } catch (error) {
      console.error(`Error loading route ${routePath}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };
}

/**
 * Preload critical routes
 * @param {Array<string>} routes - Array of route paths
 */
async function preloadCriticalRoutes(routes) {
  console.log('Preloading critical routes...');
  
  for (const routePath of routes) {
    try {
      const backendDir = path.dirname(require.main.filename) || process.cwd();
      let fullPath = path.resolve(backendDir, routePath);
      
      // If file doesn't exist, try with .js extension
      if (!fs.existsSync(fullPath) && !routePath.endsWith('.js')) {
        const pathWithExt = routePath + '.js';
        fullPath = path.resolve(backendDir, pathWithExt);
      }
      
      if (fs.existsSync(fullPath)) {
        // Clear require cache
        delete require.cache[require.resolve(fullPath)];
        
        // Load route
        const route = require(fullPath);
        
        // Cache route
        routeCache.set(routePath, route);
        
        console.log(`✓ Loaded route: ${routePath}`);
      } else {
        console.warn(`⚠ Route file not found: ${routePath}`);
      }
    } catch (error) {
      console.error(`✗ Failed to load route ${routePath}:`, error.message);
    }
  }
  
  console.log(`Preloaded ${routeCache.size} routes`);
}

/**
 * Load route on demand
 * @param {string} routePath - Path to route file
 * @returns {Function} Route handler
 */
function loadRouteOnDemand(routePath) {
  return (req, res, next) => {
    // Check if route is cached
    if (routeCache.has(routePath)) {
      const route = routeCache.get(routePath);
      return route(req, res, next);
    }

    // Load route dynamically
    try {
      const backendDir = path.dirname(require.main.filename) || process.cwd();
      let fullPath = path.resolve(backendDir, routePath);
      
      // If file doesn't exist, try with .js extension
      if (!fs.existsSync(fullPath) && !routePath.endsWith('.js')) {
        const pathWithExt = routePath + '.js';
        fullPath = path.resolve(backendDir, pathWithExt);
      }
      
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Clear require cache
      delete require.cache[require.resolve(fullPath)];
      
      // Load route
      const route = require(fullPath);
      
      // Cache route
      routeCache.set(routePath, route);
      
      // Execute route
      return route(req, res, next);
      
    } catch (error) {
      console.error(`Error loading route ${routePath}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };
}

/**
 * Clear route cache
 */
function clearRouteCache() {
  routeCache.clear();
  console.log('Route cache cleared');
}

/**
 * Get route cache stats
 * @returns {Object} Cache statistics
 */
function getRouteCacheStats() {
  return {
    size: routeCache.size,
    routes: Array.from(routeCache.keys())
  };
}

/**
 * Health check for routes
 * @returns {Object} Health status
 */
function getRouteHealth() {
  const stats = getRouteCacheStats();
  return {
    status: 'healthy',
    cachedRoutes: stats.size,
    routes: stats.routes,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getLazyRouteHandler,
  preloadCriticalRoutes,
  loadRouteOnDemand,
  clearRouteCache,
  getRouteCacheStats,
  getRouteHealth
};
