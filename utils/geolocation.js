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

    const ua = userAgent.toLowerCase();
    
    // Browser detection
    let browser = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opr')) {
      browser = 'Chrome';
      const match = ua.match(/chrome\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('firefox')) {
      browser = 'Firefox';
      const match = ua.match(/firefox\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
      const match = ua.match(/version\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('edg')) {
      browser = 'Edge';
      const match = ua.match(/edg\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('opr') || ua.includes('opera')) {
      browser = 'Opera';
      const match = ua.match(/(?:opr|opera)\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('msie') || ua.includes('trident')) {
      browser = 'Internet Explorer';
      const match = ua.match(/(?:msie |rv:)(\d+\.\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    // OS detection
    let os = 'Unknown';
    let osVersion = 'Unknown';
    
    if (ua.includes('windows nt')) {
      os = 'Windows';
      const match = ua.match(/windows nt (\d+\.\d+)/);
      if (match) {
        const version = match[1];
        switch (version) {
          case '10.0': osVersion = '10/11'; break;
          case '6.3': osVersion = '8.1'; break;
          case '6.2': osVersion = '8'; break;
          case '6.1': osVersion = '7'; break;
          case '6.0': osVersion = 'Vista'; break;
          default: osVersion = version;
        }
      }
    } else if (ua.includes('mac os x') || ua.includes('macos')) {
      os = 'macOS';
      const match = ua.match(/mac os x (\d+[._]\d+)/);
      if (match) {
        osVersion = match[1].replace('_', '.');
      }
    } else if (ua.includes('android')) {
      os = 'Android';
      const match = ua.match(/android (\d+\.\d+)/);
      osVersion = match ? match[1] : 'Unknown';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
      const match = ua.match(/os (\d+[._]\d+)/);
      osVersion = match ? match[1].replace('_', '.') : 'Unknown';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    }

    // Device type detection
    let device = 'Unknown';
    let isMobile = false;
    let isTablet = false;
    let isDesktop = false;

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      device = 'Mobile';
      isMobile = true;
    } else if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) {
      device = 'Tablet';
      isTablet = true;
    } else {
      device = 'Desktop';
      isDesktop = true;
    }

    // Additional mobile detection
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipod')) {
      isMobile = true;
      if (device === 'Unknown') device = 'Mobile';
    }

    // Additional tablet detection
    if (ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile')) || ua.includes('tablet')) {
      isTablet = true;
      if (device === 'Unknown') device = 'Tablet';
    }

    // Default to desktop if nothing else matches
    if (!isMobile && !isTablet) {
      isDesktop = true;
      if (device === 'Unknown') device = 'Desktop';
    }

    return {
      browser,
      browserVersion,
      os,
      osVersion,
      device,
      isMobile,
      isTablet,
      isDesktop
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
      isDesktop: true
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
