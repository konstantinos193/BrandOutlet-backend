const express = require('express');
const router = express.Router();

// Size conversion mapping from user region to EU (admin standard)
const sizeConversionMap = {
  // Female clothing sizes
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
  // Male clothing sizes (same across regions)
  male: {
    'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', 'XXL': 'XXL'
  }
};

// Shoe size conversion mapping from user region to EU (admin standard) - Adult only
const shoeSizeConversionMap = {
  // Female shoe sizes (adult only)
  female: {
    // US to EU
    '6': '37', '6.5': '37.5', '7': '38', '7.5': '38.5', '8': '39', '8.5': '39.5', 
    '9': '40', '9.5': '40.5', '10': '41', '10.5': '41.5', '11': '42', '11.5': '42.5', '12': '43', '12.5': '43.5', '13': '44',
    // UK to EU
    '4': '37', '4.5': '37.5', '5': '38', '5.5': '38.5', 
    '6': '39', '6.5': '39.5', '7': '40', '7.5': '40.5', '8': '41', '8.5': '41.5', '9': '42', '9.5': '42.5', '10': '43', '10.5': '43.5', '11': '44',
    // EU to EU (same)
    '36': '36', '37': '37', '38': '38', '39': '39', '40': '40', '41': '41', '42': '42', '43': '43', '44': '44', '45': '45', '46': '46', '47': '47', '48': '48'
  },
  // Male shoe sizes (adult only)
  male: {
    // US to EU
    '7': '40', '7.5': '40.5', '8': '41', '8.5': '41.5', '9': '42', '9.5': '42.5', 
    '10': '43', '10.5': '43.5', '11': '44', '11.5': '44.5', '12': '45', '12.5': '45.5', '13': '46', '13.5': '46.5', '14': '47',
    // UK to EU
    '5': '40', '5.5': '40.5', '6': '41', '6.5': '41.5', 
    '7': '42', '7.5': '42.5', '8': '43', '8.5': '43.5', '9': '44', '9.5': '44.5', '10': '45', '10.5': '45.5', '11': '46', '11.5': '46.5', '12': '47',
    // EU to EU (same)
    '39': '39', '40': '40', '41': '41', '42': '42', '43': '43', '44': '44', '45': '45', '46': '46', '47': '47', '48': '48', '49': '49'
  }
};

// POST /api/sizeConversion - Convert user size to EU size for admin
router.post('/', async (req, res) => {
  try {
    const { gender, size, region, type = 'clothing' } = req.body;

    if (!gender || !size || !region) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gender, size, region'
      });
    }

    // Choose the appropriate conversion map based on type
    const conversionMap = type === 'shoe' ? shoeSizeConversionMap : sizeConversionMap;
    
    // Get conversion mapping for the gender
    const genderMap = conversionMap[gender];
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
        type: type,
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
        clothing: {
          femaleSizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
          maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        },
        shoes: {
          femaleSizes: ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13'],
          maleSizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14']
        }
      },
      UK: {
        name: 'United Kingdom',
        clothing: {
          femaleSizes: ['4', '6', '8', '10', '12', '14', '16'],
          maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        },
        shoes: {
          femaleSizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
          maleSizes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12']
        }
      },
      EU: {
        name: 'European Union',
        clothing: {
          femaleSizes: ['32', '34', '36', '38', '40', '42', '44'],
          maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        },
        shoes: {
          femaleSizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
          maleSizes: ['39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49']
        }
      },
      FR: {
        name: 'France',
        clothing: {
          femaleSizes: ['32', '34', '36', '38', '40', '42', '44'],
          maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        },
        shoes: {
          femaleSizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
          maleSizes: ['39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49']
        }
      },
      IT: {
        name: 'Italy',
        clothing: {
          femaleSizes: ['36', '38', '40', '42', '44', '46', '48'],
          maleSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        },
        shoes: {
          femaleSizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'],
          maleSizes: ['39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49']
        }
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
