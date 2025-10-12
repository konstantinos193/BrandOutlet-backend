const express = require('express');
const router = express.Router();

// Simple in-memory cache for trappers data
let trappersCache = null;
let regionsCache = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let lastCacheTime = 0;

// Cache helper functions
const isCacheValid = () => {
  return trappersCache && regionsCache && (Date.now() - lastCacheTime) < CACHE_DURATION;
};

const updateCache = () => {
  trappersCache = trappers;
  regionsCache = regions;
  lastCacheTime = Date.now();
};

// Trapper data - in a real app this would come from a database
const trappers = [
  // US East Coast
  {
    id: 'trapper-1',
    name: 'Marcus "Flex" Johnson',
    region: 'New York',
    image: '/images/trappers/marcus-flex.jpg',
    description: 'Brooklyn-born trapper known for his oversized fits and luxury streetwear combinations.',
    style: ['Oversized Fits', 'Luxury Streetwear', 'Bold Graphics'],
    socialMedia: {
      instagram: '@marcusflex_ny',
      twitter: '@marcusflex'
    }
  },
  {
    id: 'trapper-2',
    name: 'Jaden "Stylez" Williams',
    region: 'Atlanta',
    image: '/images/trappers/jaden-stylez.jpg',
    description: 'ATL trapper with a signature mix of trap culture and high fashion.',
    style: ['Trap Fashion', 'Designer Pieces', 'Street Cred'],
    socialMedia: {
      instagram: '@jadenstylez_atl',
      youtube: 'JadenStylez'
    }
  },
  {
    id: 'trapper-3',
    name: 'Carlos "El Rey" Rodriguez',
    region: 'Miami',
    image: '/images/trappers/carlos-elrey.jpg',
    description: 'Miami trapper bringing Latin flair to streetwear with vibrant colors and bold statements.',
    style: ['Vibrant Colors', 'Latin Streetwear', 'Bold Statements'],
    socialMedia: {
      instagram: '@carloselrey_mia',
      twitter: '@carloselrey'
    }
  },

  // US West Coast
  {
    id: 'trapper-4',
    name: 'Tyler "West Coast" Chen',
    region: 'Los Angeles',
    image: '/images/trappers/tyler-westcoast.jpg',
    description: 'LA trapper known for his minimalist approach and premium streetwear selections.',
    style: ['Minimalist', 'Premium Streetwear', 'Clean Fits'],
    socialMedia: {
      instagram: '@tylerwestcoast_la',
      twitter: '@tylerwestcoast'
    }
  },
  {
    id: 'trapper-5',
    name: 'Marcus "Bay Area" Thompson',
    region: 'San Francisco',
    image: '/images/trappers/marcus-bayarea.jpg',
    description: 'Bay Area trapper mixing tech culture with streetwear aesthetics.',
    style: ['Tech Streetwear', 'Innovative Fits', 'Limited Drops'],
    socialMedia: {
      instagram: '@marcusbayarea_sf',
      youtube: 'MarcusBayArea'
    }
  },

  // International
  {
    id: 'trapper-6',
    name: 'James "UK Trap" Mitchell',
    region: 'London',
    image: '/images/trappers/james-uktrap.jpg',
    description: 'London trapper bringing British street culture to the global stage.',
    style: ['UK Streetwear', 'International Style', 'Cultural Fusion'],
    socialMedia: {
      instagram: '@jamesuktrap_london',
      twitter: '@jamesuktrap'
    }
  },
  {
    id: 'trapper-7',
    name: 'Pierre "Paris Trap" Dubois',
    region: 'Paris',
    image: '/images/trappers/pierre-paristrap.jpg',
    description: 'Parisian trapper combining French elegance with streetwear culture.',
    style: ['French Elegance', 'Street Sophistication', 'Artistic Fits'],
    socialMedia: {
      instagram: '@pierreparistrap',
      twitter: '@pierreparistrap'
    }
  },
  {
    id: 'trapper-8',
    name: 'Hiroshi "Tokyo Style" Nakamura',
    region: 'Tokyo',
    image: '/images/trappers/hiroshi-tokyostyle.jpg',
    description: 'Tokyo trapper known for avant-garde streetwear and unique styling.',
    style: ['Avant-garde', 'Unique Styling', 'Japanese Streetwear'],
    socialMedia: {
      instagram: '@hiroshitokyostyle',
      youtube: 'HiroshiTokyoStyle'
    }
  },

  // Canada
  {
    id: 'trapper-9',
    name: 'Devon "North Style" Campbell',
    region: 'Toronto',
    image: '/images/trappers/devon-northstyle.jpg',
    description: 'Toronto trapper bringing Canadian street culture to the forefront.',
    style: ['Canadian Streetwear', 'Winter Fits', 'Cultural Pride'],
    socialMedia: {
      instagram: '@devonnorthstyle_toronto',
      twitter: '@devonnorthstyle'
    }
  },

  // Australia
  {
    id: 'trapper-10',
    name: 'Liam "Down Under" O\'Connor',
    region: 'Sydney',
    image: '/images/trappers/liam-downunder.jpg',
    description: 'Sydney trapper with a unique Australian take on global streetwear trends.',
    style: ['Australian Streetwear', 'Beach Culture', 'Global Trends'],
    socialMedia: {
      instagram: '@liamdownunder_sydney',
      youtube: 'LiamDownUnder'
    }
  }
];

const regions = [
  'All Regions',
  'New York',
  'Atlanta', 
  'Miami',
  'Los Angeles',
  'San Francisco',
  'London',
  'Paris',
  'Tokyo',
  'Toronto',
  'Sydney'
];

// GET /api/trappers - Get all trappers
router.get('/', (req, res) => {
  try {
    // Update cache if needed
    if (!isCacheValid()) {
      updateCache();
    }

    const { region } = req.query;
    
    let filteredTrappers = trappersCache;
    if (region && region !== 'All Regions') {
      filteredTrappers = trappersCache.filter(trapper => trapper.region === region);
    }

    // Add cache headers for client-side caching
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `"trappers-${lastCacheTime}"`
    });

    res.json({
      success: true,
      data: filteredTrappers,
      total: filteredTrappers.length,
      cached: true,
      cacheTime: lastCacheTime
    });
  } catch (error) {
    console.error('Error fetching trappers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trappers',
      error: error.message
    });
  }
});

// GET /api/trappers/regions - Get all regions
router.get('/regions', (req, res) => {
  try {
    // Update cache if needed
    if (!isCacheValid()) {
      updateCache();
    }

    // Add cache headers for client-side caching
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `"regions-${lastCacheTime}"`
    });

    res.json({
      success: true,
      data: regionsCache,
      cached: true,
      cacheTime: lastCacheTime
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regions',
      error: error.message
    });
  }
});

// GET /api/trappers/:id - Get specific trapper
router.get('/:id', (req, res) => {
  try {
    // Update cache if needed
    if (!isCacheValid()) {
      updateCache();
    }

    const { id } = req.params;
    const trapper = trappersCache.find(t => t.id === id);
    
    if (!trapper) {
      return res.status(404).json({
        success: false,
        message: 'Trapper not found'
      });
    }

    // Add cache headers for client-side caching
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `"trapper-${id}-${lastCacheTime}"`
    });

    res.json({
      success: true,
      data: trapper,
      cached: true,
      cacheTime: lastCacheTime
    });
  } catch (error) {
    console.error('Error fetching trapper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trapper',
      error: error.message
    });
  }
});

module.exports = router;
