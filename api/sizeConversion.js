const express = require('express');
const router = express.Router();

// Size conversion mapping from user region to EU (admin standard)
const sizeConversionMap = {
  // Female sizes
  female: {
    // US to EU
    'XXS': '32', 'XS': '34', 'S': '36', 'M': '38', 'L': '40', 'XL': '42', 'XXL': '44',
    // UK to EU  
    '4': '32', '6': '34', '8': '36', '10': '38', '12': '40', '14': '42', '16': '44',
    // EU to EU (same)
    '32': '32', '34': '34', '36': '36', '38': '38', '40': '40', '42': '42', '44': '44',
    // IT to EU
    '36': '36', '38': '38', '40': '40', '42': '42', '44': '44', '46': '46', '48': '48'
  },
  // Male sizes (same across regions)
  male: {
    'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', 'XXL': 'XXL'
  }
};

// POST /api/sizeConversion - Convert user size to EU size for admin
router.post('/', async (req, res) => {
  try {
    const { gender, size, region } = req.body;

    if (!gender || !size || !region) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gender, size, region'
      });
    }

    // Get conversion mapping for the gender
    const genderMap = sizeConversionMap[gender];
    if (!genderMap) {
      return res.status(400).json({
        success: false,
        error: 'Invalid gender provided'
      });
    }

    // Convert size to EU standard
    const euSize = genderMap[size] || size; // Fallback to original if no conversion found

    res.json({
      success: true,
      data: {
        originalSize: size,
        originalRegion: region,
        euSize: euSize,
        gender: gender,
        convertedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error converting size:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert size',
      message: error.message
    });
  }
});

// GET /api/sizeConversion/regions - Get available regions and their size formats
router.get('/regions', async (req, res) => {
  try {
    const regions = {
      US: {
        name: 'United States',
        femaleSizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
        maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      UK: {
        name: 'United Kingdom',
        femaleSizes: ['4', '6', '8', '10', '12', '14', '16'],
        maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      EU: {
        name: 'European Union',
        femaleSizes: ['32', '34', '36', '38', '40', '42', '44'],
        maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      FR: {
        name: 'France',
        femaleSizes: ['32', '34', '36', '38', '40', '42', '44'],
        maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      },
      IT: {
        name: 'Italy',
        femaleSizes: ['36', '38', '40', '42', '44', '46', '48'],
        maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      }
    };

    res.json({
      success: true,
      data: regions
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

module.exports = router;
