const geoip = require('geoip-lite');
const UserAgent = require('user-agents');

/**
 * Get geolocation data from IP address
 * @param {string} ip - IP address
 * @returns {Object} Geolocation data
 */
function getLocationFromIP(ip) {
  try {
    // Handle localhost and private IPs
    if (isLocalOrPrivateIP(ip)) {
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown',
        latitude: null,
        longitude: null,
        isLocal: true
      };
    }

    const geo = geoip.lookup(ip);
    
    if (!geo) {
      return {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: 'Unknown',
        latitude: null,
        longitude: null,
        isLocal: false
      };
    }

    return {
      country: geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      city: geo.city || 'Unknown',
      timezone: geo.timezone || 'Unknown',
      latitude: geo.ll ? geo.ll[0] : null,
      longitude: geo.ll ? geo.ll[1] : null,
      isLocal: false
    };
  } catch (error) {
    console.error('Error getting geolocation:', error);
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      timezone: 'Unknown',
      latitude: null,
      longitude: null,
      isLocal: false,
      error: error.message
    };
  }
}

/**
 * Parse user agent to get device and browser information
 * @param {string} userAgent - User agent string
 * @returns {Object} Device and browser data
 */
function parseUserAgent(userAgent) {
  try {
    if (!userAgent) {
      return {
        browser: 'Unknown',
        browserVersion: 'Unknown',
        os: 'Unknown',
        osVersion: 'Unknown',
        device: 'Unknown',
        isMobile: false,
        isTablet: false,
        isDesktop: false
      };
    }

    let ua;
    try {
      ua = new UserAgent(userAgent);
    } catch (error) {
      console.warn('UserAgent parsing failed, using fallback:', error.message);
      return {
        browser: 'Unknown',
        browserVersion: 'Unknown',
        os: 'Unknown',
        osVersion: 'Unknown',
        device: 'Unknown',
        isMobile: false,
        isTablet: false,
        isDesktop: true
      };
    }
    
    return {
      browser: (ua.browser && ua.browser.name) || 'Unknown',
      browserVersion: (ua.browser && ua.browser.version) || 'Unknown',
      os: (ua.os && ua.os.name) || 'Unknown',
      osVersion: (ua.os && ua.os.version) || 'Unknown',
      device: (ua.device && ua.device.type) || 'Unknown',
      isMobile: ua.isMobile || false,
      isTablet: ua.isTablet || false,
      isDesktop: ua.isDesktop || false
    };
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return {
      browser: 'Unknown',
      browserVersion: 'Unknown',
      os: 'Unknown',
      osVersion: 'Unknown',
      device: 'Unknown',
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      error: error.message
    };
  }
}

/**
 * Check if IP is local or private
 * @param {string} ip - IP address
 * @returns {boolean} True if local/private
 */
function isLocalOrPrivateIP(ip) {
  if (!ip) return true;
  
  // Handle IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number);
    
    // Localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return true;
    }
    
    // Private IP ranges
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
  }
  
  // Handle IPv6 localhost
  if (ip === '::1' || ip.startsWith('::ffff:127.0.0.1')) {
    return true;
  }
  
  return false;
}

/**
 * Get real IP address from request (handles proxies)
 * @param {Object} req - Express request object
 * @returns {string} Real IP address
 */
function getRealIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         '127.0.0.1';
}

/**
 * Get comprehensive location and device data
 * @param {Object} req - Express request object
 * @returns {Object} Complete tracking data
 */
function getTrackingData(req) {
  const ip = getRealIP(req);
  const userAgent = req.get('User-Agent') || '';
  
  const location = getLocationFromIP(ip);
  const device = parseUserAgent(userAgent);
  
  return {
    ip,
    location,
    device,
    timestamp: new Date(),
    referrer: req.get('Referer') || null,
    acceptLanguage: req.get('Accept-Language') || null
  };
}

module.exports = {
  getLocationFromIP,
  parseUserAgent,
  isLocalOrPrivateIP,
  getRealIP,
  getTrackingData
};
