const express = require('express');
const cacheService = require('../services/cacheService');
const router = express.Router();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Trapper data - in a real app this would come from a database
const trappers = [
  // US East Coast
  {
    id: '1',
    name: 'Marcus Johnson',
    region: 'US East Coast',
    city: 'New York',
    country: 'USA',
    contact: '+1-555-0101',
    email: 'marcus.j@email.com',
    specialties: ['Streetwear', 'Sneakers', 'Vintage'],
    rating: 4.9,
    completedOrders: 127,
    responseTime: '2-4 hours',
    languages: ['English', 'Spanish'],
    availability: '24/7',
    verified: true,
    joinDate: '2023-01-15',
    lastActive: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    region: 'US East Coast',
    city: 'Boston',
    country: 'USA',
    contact: '+1-555-0102',
    email: 'sarah.c@email.com',
    specialties: ['Luxury', 'Designer', 'Handbags'],
    rating: 4.8,
    completedOrders: 89,
    responseTime: '1-3 hours',
    languages: ['English', 'Mandarin'],
    availability: 'Mon-Fri 9AM-6PM EST',
    verified: true,
    joinDate: '2023-03-22',
    lastActive: '2024-01-20T09:15:00Z'
  },
  {
    id: '3',
    name: 'David Rodriguez',
    region: 'US East Coast',
    city: 'Miami',
    country: 'USA',
    contact: '+1-555-0103',
    email: 'david.r@email.com',
    specialties: ['Streetwear', 'Sneakers', 'Urban'],
    rating: 4.7,
    completedOrders: 156,
    responseTime: '3-6 hours',
    languages: ['English', 'Spanish'],
    availability: '24/7',
    verified: true,
    joinDate: '2022-11-08',
    lastActive: '2024-01-20T14:45:00Z'
  },

  // US West Coast
  {
    id: '4',
    name: 'Alex Kim',
    region: 'US West Coast',
    city: 'Los Angeles',
    country: 'USA',
    contact: '+1-555-0201',
    email: 'alex.k@email.com',
    specialties: ['Streetwear', 'Sneakers', 'Vintage'],
    rating: 4.9,
    completedOrders: 203,
    responseTime: '1-2 hours',
    languages: ['English', 'Korean'],
    availability: '24/7',
    verified: true,
    joinDate: '2022-08-12',
    lastActive: '2024-01-20T12:20:00Z'
  },
  {
    id: '5',
    name: 'Emma Thompson',
    region: 'US West Coast',
    city: 'San Francisco',
    country: 'USA',
    contact: '+1-555-0202',
    email: 'emma.t@email.com',
    specialties: ['Luxury', 'Designer', 'Jewelry'],
    rating: 4.8,
    completedOrders: 134,
    responseTime: '2-4 hours',
    languages: ['English', 'French'],
    availability: 'Mon-Fri 8AM-5PM PST',
    verified: true,
    joinDate: '2023-02-14',
    lastActive: '2024-01-20T11:30:00Z'
  },
  {
    id: '6',
    name: 'Carlos Mendez',
    region: 'US West Coast',
    city: 'Seattle',
    country: 'USA',
    contact: '+1-555-0203',
    email: 'carlos.m@email.com',
    specialties: ['Outdoor', 'Tech', 'Casual'],
    rating: 4.6,
    completedOrders: 78,
    responseTime: '4-8 hours',
    languages: ['English', 'Spanish'],
    availability: 'Weekends only',
    verified: true,
    joinDate: '2023-06-30',
    lastActive: '2024-01-19T16:00:00Z'
  },

  // Europe
  {
    id: '7',
    name: 'Sophie Dubois',
    region: 'Europe',
    city: 'Paris',
    country: 'France',
    contact: '+33-1-5555-0101',
    email: 'sophie.d@email.com',
    specialties: ['Luxury', 'Designer', 'Fashion'],
    rating: 4.9,
    completedOrders: 189,
    responseTime: '1-3 hours',
    languages: ['French', 'English', 'Italian'],
    availability: 'Mon-Fri 9AM-7PM CET',
    verified: true,
    joinDate: '2022-05-18',
    lastActive: '2024-01-20T15:10:00Z'
  },
  {
    id: '8',
    name: 'James Wilson',
    region: 'Europe',
    city: 'London',
    country: 'UK',
    contact: '+44-20-5555-0101',
    email: 'james.w@email.com',
    specialties: ['Streetwear', 'Sneakers', 'Vintage'],
    rating: 4.7,
    completedOrders: 145,
    responseTime: '2-5 hours',
    languages: ['English', 'French'],
    availability: 'Mon-Fri 8AM-6PM GMT',
    verified: true,
    joinDate: '2023-01-10',
    lastActive: '2024-01-20T13:25:00Z'
  },
  {
    id: '9',
    name: 'Marco Rossi',
    region: 'Europe',
    city: 'Milan',
    country: 'Italy',
    contact: '+39-02-5555-0101',
    email: 'marco.r@email.com',
    specialties: ['Luxury', 'Designer', 'Fashion'],
    rating: 4.8,
    completedOrders: 167,
    responseTime: '1-4 hours',
    languages: ['Italian', 'English', 'Spanish'],
    availability: 'Mon-Fri 9AM-6PM CET',
    verified: true,
    joinDate: '2022-09-03',
    lastActive: '2024-01-20T14:40:00Z'
  },

  // Asia Pacific
  {
    id: '10',
    name: 'Yuki Tanaka',
    region: 'Asia Pacific',
    city: 'Tokyo',
    country: 'Japan',
    contact: '+81-3-5555-0101',
    email: 'yuki.t@email.com',
    specialties: ['Streetwear', 'Sneakers', 'Tech'],
    rating: 4.9,
    completedOrders: 234,
    responseTime: '1-2 hours',
    languages: ['Japanese', 'English', 'Korean'],
    availability: '24/7',
    verified: true,
    joinDate: '2022-04-12',
    lastActive: '2024-01-20T16:55:00Z'
  },
  {
    id: '11',
    name: 'Priya Patel',
    region: 'Asia Pacific',
    city: 'Mumbai',
    country: 'India',
    contact: '+91-22-5555-0101',
    email: 'priya.p@email.com',
    specialties: ['Luxury', 'Designer', 'Jewelry'],
    rating: 4.7,
    completedOrders: 112,
    responseTime: '2-6 hours',
    languages: ['Hindi', 'English', 'Gujarati'],
    availability: 'Mon-Sat 9AM-8PM IST',
    verified: true,
    joinDate: '2023-04-20',
    lastActive: '2024-01-20T10:15:00Z'
  },
  {
    id: '12',
    name: 'Liam O\'Connor',
    region: 'Asia Pacific',
    city: 'Sydney',
    country: 'Australia',
    contact: '+61-2-5555-0101',
    email: 'liam.o@email.com',
    specialties: ['Outdoor', 'Casual', 'Streetwear'],
    rating: 4.6,
    completedOrders: 98,
    responseTime: '3-6 hours',
    languages: ['English', 'Mandarin'],
    availability: 'Mon-Fri 8AM-5PM AEST',
    verified: true,
    joinDate: '2023-07-15',
    lastActive: '2024-01-20T08:30:00Z'
  }
];

// Regions data
const regions = [
  'US East Coast',
  'US West Coast', 
  'Europe',
  'Asia Pacific',
  'New York',
  'Boston',
  'Miami',
  'Los Angeles',
  'San Francisco',
  'Seattle',
  'Paris',
  'London',
  'Milan',
  'Tokyo',
  'Mumbai',
  'Sydney',
  'Toronto',
  'Sydney'
];

// GET /api/trappers - Get all trappers
router.get('/', async (req, res) => {
  try {
    const { region } = req.query;
    
    const cacheKey = `trappers-${region || 'all'}`;
    const filteredTrappers = await cacheService.cacheWithTTL(cacheKey, async () => {
      if (region && region !== 'All Regions') {
        return trappers.filter(trapper => trapper.region === region);
      }
      return trappers;
    }, CACHE_DURATION);

    // Add cache headers for client-side caching
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `"trappers-${Date.now()}"`
    });

    res.json({
      success: true,
      data: filteredTrappers,
      total: filteredTrappers.length,
      cached: true,
      cacheTime: Date.now()
    });

  } catch (error) {
    console.error('Error fetching trappers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trappers',
      message: error.message
    });
  }
});

// GET /api/trappers/regions - Get all regions
router.get('/regions', async (req, res) => {
  try {
    const cacheKey = 'trappers-regions';
    const regionsData = await cacheService.cacheWithTTL(cacheKey, async () => {
      return regions;
    }, CACHE_DURATION);

    // Add cache headers for client-side caching
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `"regions-${Date.now()}"`
    });

    res.json({
      success: true,
      data: regionsData,
      cached: true,
      cacheTime: Date.now()
    });

  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regions',
      message: error.message
    });
  }
});

// GET /api/trappers/:id - Get specific trapper by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cacheKey = `trapper-${id}`;
    const trapper = await cacheService.cacheWithTTL(cacheKey, async () => {
      return trappers.find(t => t.id === id);
    }, CACHE_DURATION);
    
    if (!trapper) {
      return res.status(404).json({
        success: false,
        error: 'Trapper not found'
      });
    }

    res.json({
      success: true,
      data: trapper
    });

  } catch (error) {
    console.error('Error fetching trapper:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trapper',
      message: error.message
    });
  }
});

module.exports = router;