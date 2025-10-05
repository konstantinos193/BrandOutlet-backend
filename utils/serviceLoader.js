/**
 * Dynamic service loader for code splitting in backend services
 * This allows loading heavy services on-demand to reduce initial bundle size
 */

const serviceCache = new Map();

/**
 * Dynamically load a service module
 * @param {string} servicePath - Path to the service file
 * @returns {Promise<Object>} - The service module
 */
async function loadService(servicePath) {
  // Check if service is already cached
  if (serviceCache.has(servicePath)) {
    return serviceCache.get(servicePath);
  }

  try {
    // Dynamically import the service
    const serviceModule = await import(servicePath);
    const service = serviceModule.default || serviceModule;
    
    // Cache the service for future use
    serviceCache.set(servicePath, service);
    
    console.log(`✅ Loaded service: ${servicePath}`);
    return service;
  } catch (error) {
    console.error(`❌ Failed to load service: ${servicePath}`, error);
    throw error;
  }
}

/**
 * Load multiple services in parallel
 * @param {Array<string>} servicePaths - Array of service paths
 * @returns {Promise<Array<Object>>} - Array of service modules
 */
async function loadServices(servicePaths) {
  const loadPromises = servicePaths.map(servicePath => loadService(servicePath));
  return Promise.all(loadPromises);
}

/**
 * Get service with lazy loading
 * @param {string} servicePath - Path to the service file
 * @returns {Function} - Service getter function
 */
function getLazyService(servicePath) {
  return async () => {
    try {
      return await loadService(servicePath);
    } catch (error) {
      console.error(`Error loading service ${servicePath}:`, error);
      throw error;
    }
  };
}

/**
 * Create a service proxy that loads the service on first access
 * @param {string} servicePath - Path to the service file
 * @returns {Object} - Service proxy object
 */
function createServiceProxy(servicePath) {
  let serviceInstance = null;
  let loadingPromise = null;

  return new Proxy({}, {
    get(target, prop) {
      if (serviceInstance) {
        return serviceInstance[prop];
      }

      if (!loadingPromise) {
        loadingPromise = loadService(servicePath).then(service => {
          serviceInstance = service;
          return service;
        });
      }

      return loadingPromise.then(service => service[prop]);
    }
  });
}

/**
 * Preload critical services
 * @param {Array<string>} criticalServices - Array of critical service paths
 */
async function preloadCriticalServices(criticalServices) {
  console.log('🚀 Preloading critical services...');
  
  try {
    await loadServices(criticalServices);
    console.log('✅ Critical services preloaded successfully');
  } catch (error) {
    console.error('❌ Failed to preload critical services:', error);
  }
}

/**
 * Clear service cache (useful for development)
 */
function clearServiceCache() {
  serviceCache.clear();
  console.log('🗑️ Service cache cleared');
}

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
function getCacheStats() {
  return {
    size: serviceCache.size,
    services: Array.from(serviceCache.keys())
  };
}

/**
 * Service categories for organized loading
 */
const SERVICE_CATEGORIES = {
  ANALYTICS: [
    './services/analyticsService',
    './services/analyticsDataService',
    './services/realDataInsightsService'
  ],
  AI: [
    './services/aiInsightsService',
    './services/aiInsightsGenerator'
  ],
  PRODUCTS: [
    './services/productManagementService',
    './services/searchService'
  ],
  FORECASTING: [
    './services/forecastingService',
    './services/seasonalAnalysisService'
  ],
  CART: [
    './services/cartService'
  ],
  SEO: [
    './services/seoService'
  ],
  REALTIME: [
    './services/realTimeService'
  ]
};

/**
 * Load services by category
 * @param {string} category - Service category
 * @returns {Promise<Array<Object>>} - Array of service modules
 */
async function loadServicesByCategory(category) {
  const servicePaths = SERVICE_CATEGORIES[category];
  if (!servicePaths) {
    throw new Error(`Unknown service category: ${category}`);
  }
  
  return loadServices(servicePaths);
}

module.exports = {
  loadService,
  loadServices,
  getLazyService,
  createServiceProxy,
  preloadCriticalServices,
  clearServiceCache,
  getCacheStats,
  loadServicesByCategory,
  SERVICE_CATEGORIES
};
