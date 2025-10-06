/**
 * Service Loader Utility
 * 
 * Dynamic service loading for performance optimization
 */

const fs = require('fs');
const path = require('path');

// Cache for loaded services
const serviceCache = new Map();

/**
 * Preload critical services
 * @param {Array<string>} services - Array of service paths
 */
async function preloadCriticalServices(services) {
  console.log('Preloading critical services...');
  
  for (const servicePath of services) {
    try {
      const fullPath = path.resolve(servicePath);
      
      if (fs.existsSync(fullPath)) {
        // Clear require cache
        delete require.cache[require.resolve(fullPath)];
        
        // Load service
        const service = require(fullPath);
        
        // Cache service
        serviceCache.set(servicePath, service);
        
        console.log(`✓ Loaded service: ${servicePath}`);
      } else {
        console.warn(`⚠ Service file not found: ${servicePath}`);
      }
    } catch (error) {
      console.error(`✗ Failed to load service ${servicePath}:`, error.message);
    }
  }
  
  console.log(`Preloaded ${serviceCache.size} services`);
}

/**
 * Get service on demand
 * @param {string} servicePath - Path to service file
 * @returns {any} Service instance
 */
function getServiceOnDemand(servicePath) {
  // Check if service is cached
  if (serviceCache.has(servicePath)) {
    return serviceCache.get(servicePath);
  }

  // Load service dynamically
  try {
    const fullPath = path.resolve(servicePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Service file not found: ${servicePath}`);
    }

    // Clear require cache
    delete require.cache[require.resolve(fullPath)];
    
    // Load service
    const service = require(fullPath);
    
    // Cache service
    serviceCache.set(servicePath, service);
    
    return service;
    
  } catch (error) {
    console.error(`Error loading service ${servicePath}:`, error);
    throw error;
  }
}

/**
 * Clear service cache
 */
function clearServiceCache() {
  serviceCache.clear();
  console.log('Service cache cleared');
}

/**
 * Get service cache stats
 * @returns {Object} Cache statistics
 */
function getServiceCacheStats() {
  return {
    size: serviceCache.size,
    services: Array.from(serviceCache.keys())
  };
}

/**
 * Health check for services
 * @returns {Object} Health status
 */
function getServiceHealth() {
  const stats = getServiceCacheStats();
  return {
    status: 'healthy',
    cachedServices: stats.size,
    services: stats.services,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  preloadCriticalServices,
  getServiceOnDemand,
  clearServiceCache,
  getServiceCacheStats,
  getServiceHealth
};