/**
 * Centralized Validation API
 * 
 * Handles all data validation, sanitization, and business rule validation
 * that was previously done in the frontend
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Validation schemas
const validationSchemas = {
  // Custom order validation
  customOrder: [
    body('customerName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('customerEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    
    body('customerPhone')
      .optional()
      .isMobilePhone()
      .withMessage('Valid phone number is required'),
    
    body('instagramHandle')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z0-9._]+$/)
      .withMessage('Instagram handle can only contain letters, numbers, dots, and underscores'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
      .escape(),
    
    body('budget')
      .optional()
      .isNumeric()
      .isFloat({ min: 0, max: 10000 })
      .withMessage('Budget must be between 0 and 10000'),
    
    body('preferredBrands')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Preferred brands must be less than 200 characters'),
    
    body('size')
      .optional()
      .trim()
      .isLength({ max: 20 })
      .withMessage('Size must be less than 20 characters'),
    
    body('color')
      .optional()
      .trim()
      .isLength({ max: 30 })
      .withMessage('Color must be less than 30 characters'),
    
    body('condition')
      .optional()
      .isIn(['new', 'like-new', 'good', 'fair', 'poor', 'any'])
      .withMessage('Invalid condition value'),
    
    body('urgency')
      .optional()
      .isIn(['low', 'normal', 'high', 'urgent'])
      .withMessage('Invalid urgency value'),
    
    body('additionalNotes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Additional notes must be less than 500 characters')
      .escape()
  ],

  // Product creation validation
  product: [
    body('name')
      .trim()
      .isLength({ min: 3, max: 200 })
      .withMessage('Product name must be between 3 and 200 characters')
      .escape(),
    
    body('brand')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Brand must be between 2 and 50 characters')
      .escape(),
    
    body('category')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters')
      .escape(),
    
    body('price')
      .isNumeric()
      .isFloat({ min: 0.01, max: 100000 })
      .withMessage('Price must be between 0.01 and 100000'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters')
      .escape(),
    
    body('condition')
      .isIn(['new', 'like-new', 'good', 'fair', 'poor'])
      .withMessage('Invalid condition value'),
    
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean value')
  ],

  // File validation
  file: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 10
  }
};

// Business rule validations
const businessRules = {
  // Validate budget ranges based on product category
  validateBudgetForCategory: (budget, category) => {
    const categoryLimits = {
      'sneakers': { min: 50, max: 2000 },
      'clothing': { min: 20, max: 1000 },
      'accessories': { min: 10, max: 500 },
      'electronics': { min: 100, max: 5000 }
    };
    
    const limits = categoryLimits[category] || { min: 10, max: 10000 };
    return budget >= limits.min && budget <= limits.max;
  },

  // Validate product categories
  validateProductCategory: (category) => {
    const validCategories = [
      'sneakers', 'clothing', 'accessories', 'electronics', 
      'bags', 'watches', 'jewelry', 'home', 'sports'
    ];
    return validCategories.includes(category.toLowerCase());
  },

  // Validate brand names
  validateBrand: (brand) => {
    const validBrands = [
      'Nike', 'Adidas', 'Supreme', 'Jordan', 'Yeezy', 'Off-White',
      'Gucci', 'Louis Vuitton', 'Chanel', 'Hermes', 'Prada',
      'Balenciaga', 'Versace', 'Dior', 'Fendi', 'Givenchy'
    ];
    return validBrands.includes(brand);
  }
};

// POST /api/validation/custom-order - Validate custom order data
router.post('/custom-order', validationSchemas.customOrder, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { budget, preferredBrands, category } = req.body;

    // Apply business rules
    const businessRuleErrors = [];

    // Validate budget if provided
    if (budget && category) {
      if (!businessRules.validateBudgetForCategory(parseFloat(budget), category)) {
        businessRuleErrors.push({
          field: 'budget',
          message: `Budget for ${category} must be between $50-$2000`
        });
      }
    }

    // Validate preferred brands format
    if (preferredBrands) {
      const brands = preferredBrands.split(',').map(b => b.trim());
      const invalidBrands = brands.filter(brand => 
        brand.length > 0 && !businessRules.validateBrand(brand)
      );
      
      if (invalidBrands.length > 0) {
        businessRuleErrors.push({
          field: 'preferredBrands',
          message: `Invalid brands: ${invalidBrands.join(', ')}`
        });
      }
    }

    if (businessRuleErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Business rule validation failed',
        details: businessRuleErrors
      });
    }

    // Sanitize and return validated data
    const validatedData = {
      customerName: req.body.customerName.trim(),
      customerEmail: req.body.customerEmail.toLowerCase(),
      customerPhone: req.body.customerPhone?.trim() || null,
      instagramHandle: req.body.instagramHandle?.trim() || null,
      description: req.body.description.trim(),
      budget: req.body.budget ? parseFloat(req.body.budget) : null,
      preferredBrands: req.body.preferredBrands?.trim() || null,
      size: req.body.size?.trim() || null,
      color: req.body.color?.trim() || null,
      condition: req.body.condition || 'any',
      urgency: req.body.urgency || 'normal',
      additionalNotes: req.body.additionalNotes?.trim() || null
    };

    res.json({
      success: true,
      message: 'Validation passed',
      data: validatedData
    });

  } catch (error) {
    console.error('Error validating custom order:', error);
    res.status(500).json({
      success: false,
      error: 'Validation service error',
      message: error.message
    });
  }
});

// POST /api/validation/product - Validate product data
router.post('/product', validationSchemas.product, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { category, brand, price } = req.body;

    // Apply business rules
    const businessRuleErrors = [];

    // Validate category
    if (!businessRules.validateProductCategory(category)) {
      businessRuleErrors.push({
        field: 'category',
        message: `Invalid category. Must be one of: sneakers, clothing, accessories, electronics, bags, watches, jewelry, home, sports`
      });
    }

    // Validate brand
    if (!businessRules.validateBrand(brand)) {
      businessRuleErrors.push({
        field: 'brand',
        message: `Invalid brand. Must be a recognized brand name`
      });
    }

    // Validate price ranges based on category
    const categoryPriceRanges = {
      'sneakers': { min: 50, max: 5000 },
      'clothing': { min: 20, max: 2000 },
      'accessories': { min: 10, max: 1000 },
      'electronics': { min: 100, max: 10000 }
    };

    const priceRange = categoryPriceRanges[category.toLowerCase()];
    if (priceRange && (price < priceRange.min || price > priceRange.max)) {
      businessRuleErrors.push({
        field: 'price',
        message: `Price for ${category} must be between $${priceRange.min} and $${priceRange.max}`
      });
    }

    if (businessRuleErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Business rule validation failed',
        details: businessRuleErrors
      });
    }

    // Sanitize and return validated data
    const validatedData = {
      name: req.body.name.trim(),
      brand: req.body.brand.trim(),
      category: req.body.category.toLowerCase(),
      price: parseFloat(req.body.price),
      description: req.body.description.trim(),
      condition: req.body.condition,
      featured: req.body.featured === 'true' || req.body.featured === true
    };

    res.json({
      success: true,
      message: 'Validation passed',
      data: validatedData
    });

  } catch (error) {
    console.error('Error validating product:', error);
    res.status(500).json({
      success: false,
      error: 'Validation service error',
      message: error.message
    });
  }
});

// POST /api/validation/file - Validate file upload
router.post('/file', async (req, res) => {
  try {
    const { fileSize, fileType, fileName } = req.body;

    const validationErrors = [];

    // Check file size
    if (fileSize > validationSchemas.file.maxSize) {
      validationErrors.push({
        field: 'fileSize',
        message: `File size must be less than ${validationSchemas.file.maxSize / (1024 * 1024)}MB`
      });
    }

    // Check file type
    if (!validationSchemas.file.allowedTypes.includes(fileType)) {
      validationErrors.push({
        field: 'fileType',
        message: `File type must be one of: ${validationSchemas.file.allowedTypes.join(', ')}`
      });
    }

    // Check file name
    if (fileName && fileName.length > 255) {
      validationErrors.push({
        field: 'fileName',
        message: 'File name must be less than 255 characters'
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'File validation failed',
        details: validationErrors
      });
    }

    res.json({
      success: true,
      message: 'File validation passed',
      data: {
        maxSize: validationSchemas.file.maxSize,
        allowedTypes: validationSchemas.file.allowedTypes,
        maxFiles: validationSchemas.file.maxFiles
      }
    });

  } catch (error) {
    console.error('Error validating file:', error);
    res.status(500).json({
      success: false,
      error: 'File validation service error',
      message: error.message
    });
  }
});

// GET /api/validation/rules - Get validation rules for frontend
router.get('/rules', (req, res) => {
  try {
    const rules = {
      customOrder: {
        customerName: { minLength: 2, maxLength: 100, pattern: '^[a-zA-Z\\s]+$' },
        customerEmail: { type: 'email', required: true },
        customerPhone: { type: 'phone', required: false },
        instagramHandle: { minLength: 1, maxLength: 50, pattern: '^[a-zA-Z0-9._]+$' },
        description: { minLength: 10, maxLength: 1000, required: true },
        budget: { type: 'number', min: 0, max: 10000, required: false },
        preferredBrands: { maxLength: 200, required: false },
        size: { maxLength: 20, required: false },
        color: { maxLength: 30, required: false },
        condition: { 
          allowedValues: ['new', 'like-new', 'good', 'fair', 'poor', 'any'],
          required: false 
        },
        urgency: { 
          allowedValues: ['low', 'normal', 'high', 'urgent'],
          required: false 
        },
        additionalNotes: { maxLength: 500, required: false }
      },
      product: {
        name: { minLength: 3, maxLength: 200, required: true },
        brand: { minLength: 2, maxLength: 50, required: true },
        category: { 
          allowedValues: ['sneakers', 'clothing', 'accessories', 'electronics', 'bags', 'watches', 'jewelry', 'home', 'sports'],
          required: true 
        },
        price: { type: 'number', min: 0.01, max: 100000, required: true },
        description: { minLength: 10, maxLength: 2000, required: true },
        condition: { 
          allowedValues: ['new', 'like-new', 'good', 'fair', 'poor'],
          required: true 
        },
        featured: { type: 'boolean', required: false }
      },
      file: {
        maxSize: validationSchemas.file.maxSize,
        allowedTypes: validationSchemas.file.allowedTypes,
        maxFiles: validationSchemas.file.maxFiles
      }
    };

    res.json({
      success: true,
      data: rules
    });

  } catch (error) {
    console.error('Error getting validation rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get validation rules',
      message: error.message
    });
  }
});

module.exports = router;
