const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { getTrackingData } = require('../utils/geolocation');
const { connectDB } = require('../config/database');
const authModule = require('./auth');
const { verifyToken } = authModule;
const router = express.Router();

let db = null;

// Initialize database connection
const initializeDB = async () => {
  if (!db) {
    db = await connectDB();
  }
  return db;
};

// Health check endpoint for page tracking
router.get('/health', async (req, res) => {
  try {
    const database = await initializeDB();
    const pageViewsCollection = database.collection('pageViews');
    const totalViews = await pageViewsCollection.countDocuments();
    const uniqueVisitors = await pageViewsCollection.distinct('sessionId').then(sessions => sessions.length);
    
    res.json({
      success: true,
      message: 'Page tracking service is healthy',
      timestamp: new Date().toISOString(),
      stats: {
        totalViews,
        uniqueVisitors,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Page tracking service error',
      error: error.message
    });
  }
});

// Validation schema for page tracking
const pageViewSchema = Joi.object({
  page: Joi.string().required(),
  path: Joi.string().required(),
  referrer: Joi.string().optional(),
  userAgent: Joi.string().optional(),
  sessionId: Joi.string().optional(),
  timestamp: Joi.date().default(Date.now),
  duration: Joi.number().optional(), // time spent on page in seconds
  exitPage: Joi.boolean().default(false)
});

// POST /api/page-tracking/view - Track page view
router.post('/view', async (req, res) => {
  try {
    console.log('📊 Page view tracking request received');
    
    const { error, value } = pageViewSchema.validate(req.body);
    if (error) {
      console.error('Validation error:', error.details[0].message);
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message
      });
    }

    // Get comprehensive tracking data including geolocation with error handling
    let trackingData;
    try {
      trackingData = getTrackingData(req);
    } catch (trackingError) {
      console.error('Error getting tracking data:', trackingError);
      // Fallback to basic tracking data
      trackingData = {
        ip: req.ip || '127.0.0.1',
        location: {
          country: 'Unknown',
          region: 'Unknown',
          city: 'Unknown',
          timezone: 'Unknown',
          latitude: null,
          longitude: null,
          isLocal: true
        },
        device: {
          browser: 'Unknown',
          browserVersion: 'Unknown',
          os: 'Unknown',
          osVersion: 'Unknown',
          device: 'Unknown',
          isMobile: false,
          isTablet: false,
          isDesktop: false
        },
        referrer: req.get('Referer') || null,
        acceptLanguage: req.get('Accept-Language') || null
      };
    }
    
    // Add unique ID and additional data
    const pageViewData = {
      id: uuidv4(),
      ...value,
      timestamp: new Date(),
      ipAddress: trackingData.ip,
      userAgent: req.get('User-Agent') || value.userAgent,
      location: trackingData.location,
      device: trackingData.device,
      referrer: trackingData.referrer,
      acceptLanguage: trackingData.acceptLanguage
    };

    // Store the page view in MongoDB
    const database = await initializeDB();
    const pageViewsCollection = database.collection('pageViews');
    await pageViewsCollection.insertOne(pageViewData);

    // Analytics will be calculated on-demand from database
    console.log('Page view stored in database, analytics calculated on-demand');

    console.log('✅ Page view tracked successfully:', pageViewData.id);

    res.status(201).json({
      success: true,
      message: 'Page view tracked successfully',
      data: {
        id: pageViewData.id,
        timestamp: pageViewData.timestamp
      }
    });

  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({
      error: 'Failed to track page view',
      message: error.message
    });
  }
});

// POST /api/page-tracking/exit - Track page exit
router.post('/exit', async (req, res) => {
  try {
    // Add null checks for req.body
    if (!req.body) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required'
      });
    }

    const { sessionId, page, duration } = req.body;

    // If no sessionId provided, create a default one
    const trackingSessionId = sessionId || 'anonymous-' + Date.now();

    // Find the last page view for this session and update it in MongoDB
    const database = await initializeDB();
    const pageViewsCollection = database.collection('pageViews');
    
    const lastView = await pageViewsCollection
      .findOne(
        { sessionId: trackingSessionId },
        { sort: { timestamp: -1 } }
      );

    if (lastView) {
      await pageViewsCollection.updateOne(
        { _id: lastView._id },
        { 
          $set: { 
            exitPage: true,
            duration: duration || 0,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // If no previous view found, create a basic exit record
      const exitView = {
        id: uuidv4(),
        page: page || 'unknown',
        path: page || '/unknown',
        sessionId: trackingSessionId,
        timestamp: new Date(),
        exitPage: true,
        duration: duration || 0,
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown',
        createdAt: new Date()
      };
      await pageViewsCollection.insertOne(exitView);
    }

    res.json({
      success: true,
      message: 'Page exit tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking page exit:', error);
    res.status(500).json({
      error: 'Failed to track page exit',
      message: error.message
    });
  }
});

// GET /api/page-tracking/analytics - Get page analytics (Admin only)
router.get('/analytics', verifyToken, async (req, res) => {
  try {
    const { timeframe = '7d', page } = req.query;
    
    // Initialize database connection
    const database = await initializeDB();
    const pageViewsCollection = database.collection('pageViews');
    
    // Build query for time filter
    let query = {};
    const timeFilter = getTimeFilter(timeframe);
    if (timeFilter) {
      query.timestamp = { $gte: timeFilter };
    }
    
    // Apply page filter
    if (page) {
      query.page = page;
    }
    
    // Fetch page views from database
    const pageViews = await pageViewsCollection.find(query).toArray();
    
    // Calculate analytics from the fetched data
    const analytics = calculatePageAnalytics(pageViews);

    res.json({
      success: true,
      data: {
        ...analytics,
        timeframe,
        totalViews: pageViews.length,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching page analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch page analytics',
      message: error.message
    });
  }
});

// GET /api/page-tracking/popular-pages - Get most popular pages (Admin only)
router.get('/popular-pages', verifyToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Initialize database connection
    const database = await initializeDB();
    const pageViewsCollection = database.collection('pageViews');
    
    // Fetch all page views from database
    const pageViews = await pageViewsCollection.find({}).toArray();
    
    // Calculate page view counts
    const pageViewCounts = {};
    pageViews.forEach(view => {
      pageViewCounts[view.page] = (pageViewCounts[view.page] || 0) + 1;
    });
    
    const totalViews = pageViews.length;
    
    const popularPages = Object.entries(pageViewCounts)
      .map(([page, count]) => ({
        page,
        views: count,
        percentage: ((count / totalViews) * 100).toFixed(1)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        popularPages,
        totalPages: Object.keys(pageViewCounts).length,
        totalViews: totalViews
      }
    });

  } catch (error) {
    console.error('Error fetching popular pages:', error);
    res.status(500).json({
      error: 'Failed to fetch popular pages',
      message: error.message
    });
  }
});

// GET /api/page-tracking/export - Export page tracking data
router.get('/export', verifyToken, async (req, res) => {
  try {
    // Initialize database connection
    const database = await initializeDB();
    const pageViewsCollection = database.collection('pageViews');
    
    // Fetch all page views from database
    const pageViews = await pageViewsCollection.find({}).toArray();
    
    const csvHeader = 'ID,Page,Path,Referrer,Timestamp,Duration,IP Address,User Agent\n';
    const csvData = pageViews.map(view => 
      `${view.id},${view.page},${view.path},${view.referrer || ''},${view.timestamp},${view.duration || 0},${view.ipAddress},${view.userAgent}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=page-tracking.csv');
    res.send(csvHeader + csvData);

  } catch (error) {
    console.error('Error exporting page data:', error);
    res.status(500).json({
      error: 'Failed to export page data',
      message: error.message
    });
  }
});

// Helper function to update page analytics
function updatePageAnalytics(pageViewData) {
  pageAnalytics.totalViews++;
  
  // Track unique visitors
  if (pageViewData.sessionId) {
    pageAnalytics.uniqueVisitors.add(pageViewData.sessionId);
  }

  // Update page views count
  if (!pageAnalytics.pageViews[pageViewData.page]) {
    pageAnalytics.pageViews[pageViewData.page] = 0;
  }
  pageAnalytics.pageViews[pageViewData.page]++;

  // Update hourly stats
  const hour = new Date(pageViewData.timestamp).getHours();
  if (!pageAnalytics.hourlyStats[hour]) {
    pageAnalytics.hourlyStats[hour] = 0;
  }
  pageAnalytics.hourlyStats[hour]++;

  // Update daily stats
  const day = new Date(pageViewData.timestamp).toDateString();
  if (!pageAnalytics.dailyStats[day]) {
    pageAnalytics.dailyStats[day] = 0;
  }
  pageAnalytics.dailyStats[day]++;

  // Update country stats
  if (pageViewData.location && pageViewData.location.country) {
    const country = pageViewData.location.country;
    if (!pageAnalytics.countryStats[country]) {
      pageAnalytics.countryStats[country] = 0;
    }
    pageAnalytics.countryStats[country]++;
  }

  // Update device stats
  if (pageViewData.device) {
    const deviceType = pageViewData.device.device || 'Unknown';
    if (!pageAnalytics.deviceStats[deviceType]) {
      pageAnalytics.deviceStats[deviceType] = 0;
    }
    pageAnalytics.deviceStats[deviceType]++;

    // Track mobile vs desktop vs tablet
    if (pageViewData.device.isMobile) {
      if (!pageAnalytics.deviceStats['Mobile']) {
        pageAnalytics.deviceStats['Mobile'] = 0;
      }
      pageAnalytics.deviceStats['Mobile']++;
    } else if (pageViewData.device.isTablet) {
      if (!pageAnalytics.deviceStats['Tablet']) {
        pageAnalytics.deviceStats['Tablet'] = 0;
      }
      pageAnalytics.deviceStats['Tablet']++;
    } else if (pageViewData.device.isDesktop) {
      if (!pageAnalytics.deviceStats['Desktop']) {
        pageAnalytics.deviceStats['Desktop'] = 0;
      }
      pageAnalytics.deviceStats['Desktop']++;
    }
  }

  // Update browser stats
  if (pageViewData.device && pageViewData.device.browser) {
    const browser = pageViewData.device.browser;
    if (!pageAnalytics.browserStats[browser]) {
      pageAnalytics.browserStats[browser] = 0;
    }
    pageAnalytics.browserStats[browser]++;
  }

  pageAnalytics.lastUpdated = new Date();
}

// Helper function to calculate page analytics
function calculatePageAnalytics(views) {
  const pageStats = {};
  const hourlyDistribution = {};
  const dailyDistribution = {};
  let totalDuration = 0;
  let pagesWithDuration = 0;

  views.forEach(view => {
    // Page statistics
    if (!pageStats[view.page]) {
      pageStats[view.page] = {
        views: 0,
        uniqueVisitors: new Set(),
        avgDuration: 0,
        totalDuration: 0,
        exitRate: 0,
        exits: 0
      };
    }

    pageStats[view.page].views++;
    if (view.sessionId) {
      pageStats[view.page].uniqueVisitors.add(view.sessionId);
    }

    if (view.duration) {
      pageStats[view.page].totalDuration += view.duration;
      totalDuration += view.duration;
      pagesWithDuration++;
    }

    if (view.exitPage) {
      pageStats[view.page].exits++;
    }

    // Hourly distribution
    const hour = new Date(view.timestamp).getHours();
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;

    // Daily distribution
    const day = new Date(view.timestamp).toDateString();
    dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;
  });

  // Calculate averages and rates
  Object.keys(pageStats).forEach(page => {
    const stats = pageStats[page];
    stats.uniqueVisitors = stats.uniqueVisitors.size;
    stats.avgDuration = stats.totalDuration / Math.max(stats.views, 1);
    stats.exitRate = (stats.exits / stats.views) * 100;
  });

  // Get popular pages
  const popularPages = Object.entries(pageStats)
    .map(([page, stats]) => ({
      page,
      views: stats.views,
      uniqueVisitors: stats.uniqueVisitors,
      avgDuration: Math.round(stats.avgDuration),
      exitRate: Math.round(stats.exitRate * 100) / 100
    }))
    .sort((a, b) => b.views - a.views);

  // Calculate geolocation analytics
  const countryStats = {};
  const deviceStats = {};
  const browserStats = {};
  const cityStats = {};

  views.forEach(view => {
    // Country stats
    if (view.location && view.location.country) {
      const country = view.location.country;
      countryStats[country] = (countryStats[country] || 0) + 1;
    }

    // City stats
    if (view.location && view.location.city) {
      const city = view.location.city;
      cityStats[city] = (cityStats[city] || 0) + 1;
    }

    // Device stats
    if (view.device) {
      // Primary device type
      const deviceType = view.device.device || 'Unknown';
      deviceStats[deviceType] = (deviceStats[deviceType] || 0) + 1;

      // Mobile vs Desktop vs Tablet
      if (view.device.isMobile) {
        deviceStats['Mobile'] = (deviceStats['Mobile'] || 0) + 1;
      } else if (view.device.isTablet) {
        deviceStats['Tablet'] = (deviceStats['Tablet'] || 0) + 1;
      } else if (view.device.isDesktop) {
        deviceStats['Desktop'] = (deviceStats['Desktop'] || 0) + 1;
      }
    }

    // Browser stats
    if (view.device && view.device.browser) {
      const browser = view.device.browser;
      browserStats[browser] = (browserStats[browser] || 0) + 1;
    }
  });

  // Get top countries, cities, devices, and browsers
  const topCountries = Object.entries(countryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([country, count]) => ({ country, count, percentage: ((count / views.length) * 100).toFixed(1) }));

  const topCities = Object.entries(cityStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([city, count]) => ({ city, count, percentage: ((count / views.length) * 100).toFixed(1) }));

  const topDevices = Object.entries(deviceStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([device, count]) => ({ device, count, percentage: ((count / views.length) * 100).toFixed(1) }));

  const topBrowsers = Object.entries(browserStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([browser, count]) => ({ browser, count, percentage: ((count / views.length) * 100).toFixed(1) }));

  // Geographic data for map visualization
  const geographicData = views
    .filter(view => view.location && view.location.latitude && view.location.longitude)
    .map(view => ({
      id: view.id,
      city: view.location.city,
      country: view.location.country,
      region: view.location.region,
      latitude: view.location.latitude,
      longitude: view.location.longitude,
      page: view.page,
      path: view.path,
      views: 1,
      timestamp: view.timestamp,
      device: view.device?.device || 'Unknown',
      browser: view.device?.browser || 'Unknown'
    }));

  // Aggregate geographic data by location
  const aggregatedGeographicData = {};
  geographicData.forEach(point => {
    const key = `${point.latitude},${point.longitude}`;
    if (!aggregatedGeographicData[key]) {
      aggregatedGeographicData[key] = {
        id: point.id,
        city: point.city,
        country: point.country,
        region: point.region,
        latitude: point.latitude,
        longitude: point.longitude,
        totalViews: 0,
        pages: new Set(),
        devices: new Set(),
        browsers: new Set(),
        lastVisit: point.timestamp
      };
    }
    aggregatedGeographicData[key].totalViews += point.views;
    aggregatedGeographicData[key].pages.add(point.page);
    aggregatedGeographicData[key].devices.add(point.device);
    aggregatedGeographicData[key].browsers.add(point.browser);
    if (new Date(point.timestamp) > new Date(aggregatedGeographicData[key].lastVisit)) {
      aggregatedGeographicData[key].lastVisit = point.timestamp;
    }
  });

  // Convert to array and format for frontend
  const mapData = Object.values(aggregatedGeographicData).map(point => ({
    ...point,
    pages: Array.from(point.pages),
    devices: Array.from(point.devices),
    browsers: Array.from(point.browsers),
    pagesCount: point.pages.size,
    devicesCount: point.devices.size,
    browsersCount: point.browsers.size
  }));

  // Page view mapping - detailed page analytics
  const pageViewMapping = {};
  views.forEach(view => {
    const page = view.page;
    if (!pageViewMapping[page]) {
      pageViewMapping[page] = {
        page,
        path: view.path,
        totalViews: 0,
        uniqueVisitors: new Set(),
        countries: new Set(),
        cities: new Set(),
        devices: new Set(),
        browsers: new Set(),
        avgDuration: 0,
        durations: [],
        timestamps: []
      };
    }
    
    pageViewMapping[page].totalViews++;
    pageViewMapping[page].uniqueVisitors.add(view.sessionId);
    if (view.location?.country) pageViewMapping[page].countries.add(view.location.country);
    if (view.location?.city) pageViewMapping[page].cities.add(view.location.city);
    if (view.device?.device) pageViewMapping[page].devices.add(view.device.device);
    if (view.device?.browser) pageViewMapping[page].browsers.add(view.device.browser);
    if (view.duration) pageViewMapping[page].durations.push(view.duration);
    pageViewMapping[page].timestamps.push(view.timestamp);
  });

  // Calculate averages and convert sets to arrays
  Object.values(pageViewMapping).forEach(page => {
    page.uniqueVisitors = page.uniqueVisitors.size;
    page.countries = Array.from(page.countries);
    page.cities = Array.from(page.cities);
    page.devices = Array.from(page.devices);
    page.browsers = Array.from(page.browsers);
    page.avgDuration = page.durations.length > 0 
      ? Math.round(page.durations.reduce((a, b) => a + b, 0) / page.durations.length)
      : 0;
    page.countriesCount = page.countries.length;
    page.citiesCount = page.cities.length;
    page.devicesCount = page.devices.length;
    page.browsersCount = page.browsers.length;
  });

  return {
    pageStats,
    popularPages: popularPages.slice(0, 10),
    hourlyDistribution,
    dailyDistribution,
    totalViews: views.length,
    uniqueVisitors: new Set(views.map(v => v.sessionId).filter(Boolean)).size,
    avgPageDuration: pagesWithDuration > 0 ? Math.round(totalDuration / pagesWithDuration) : 0,
    bounceRate: calculateBounceRate(views),
    geolocation: {
      topCountries,
      topCities,
      topDevices,
      topBrowsers,
      totalCountries: Object.keys(countryStats).length,
      totalCities: Object.keys(cityStats).length
    },
    // New data for maps and detailed analytics
    mapData: mapData.sort((a, b) => b.totalViews - a.totalViews),
    pageViewMapping: Object.values(pageViewMapping).sort((a, b) => b.totalViews - a.totalViews)
  };
}

// Helper function to calculate bounce rate
function calculateBounceRate(views) {
  const singlePageVisits = views.filter(view => {
    const sessionViews = views.filter(v => v.sessionId === view.sessionId);
    return sessionViews.length === 1;
  }).length;

  return views.length > 0 ? Math.round((singlePageVisits / views.length) * 100) : 0;
}

// Helper function to get time filter
function getTimeFilter(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default: return null;
  }
}

module.exports = router;
