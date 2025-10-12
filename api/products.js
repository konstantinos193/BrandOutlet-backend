const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { getDB } = require('../config/database');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cacheService = require('../services/cacheService');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage (for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// GET /api/products - Get products with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      brands,
      categories,
      minPrice,
      maxPrice,
      condition,
      size,
      color,
      inStock,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    console.log('🛍️ Fetching products with caching');

    // Create cache parameters
    const cacheParams = {
      search,
      brands,
      categories,
      minPrice,
      maxPrice,
      condition,
      size,
      color,
      inStock,
      sortBy,
      sortOrder,
      page,
      limit
    };

    // Use cache service to get products
    const result = await cacheService.cacheProducts(cacheParams, async () => {
      console.log('📦 Cache MISS - Fetching from database');

      // Build query filters
      let query = { isActive: true };

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'brand.name': { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      // Brand filter
      if (brands) {
        const brandArray = brands.split(',');
        query['brand.name'] = { $in: brandArray };
      }

      // Category filter
      if (categories) {
        const categoryArray = categories.split(',');
        query.category = { $in: categoryArray };
      }

      // Price range filter
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      // Condition filter
      if (condition) {
        query.condition = condition;
      }

      // Size filter
      if (size) {
        query.sizes = { $in: [size] };
      }

      // Color filter
      if (color) {
        query.colors = { $in: [color] };
      }

      // Stock filter
      if (inStock === 'true') {
        query.stock = { $gt: 0 };
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Get products from database
      const products = await Product.find(query)
        .populate('brand', 'name logo')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Product.countDocuments(query);

      // Transform products to match expected format
      const transformedProducts = products.map(product => ({
        id: product._id.toString(),
        name: product.name,
        brand: {
          name: product.brand?.name || 'Unknown',
          logo: product.brand?.logo || '/brands/default.png'
        },
        price: product.price || 0,
        originalPrice: product.originalPrice || product.price || 0,
        discount: product.discount || 0,
        images: product.images || ['/products/placeholder.jpg'],
        category: product.category || 'Other',
        condition: product.condition || 'New',
        sizes: product.sizes || [],
        colors: product.colors || [],
        stock: product.stock || 0,
        description: product.description || '',
        features: product.features || [],
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        salesCount: product.salesCount || 0,
        createdAt: product.createdAt || new Date(),
        updatedAt: product.updatedAt || new Date()
      }));

      return {
        products: transformedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        filters: {
          search,
          brands: brands ? brands.split(',') : [],
          categories: categories ? categories.split(',') : [],
          minPrice: minPrice ? parseFloat(minPrice) : null,
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          condition,
          size,
          color,
          inStock: inStock === 'true'
        }
      };
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching products from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🛍️ Fetching product ${id} from database`);

    const product = await Product.findById(id).populate('brand', 'name logo');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const transformedProduct = {
      id: product._id.toString(),
      name: product.name,
      brand: {
        name: product.brand?.name || 'Unknown',
        logo: product.brand?.logo || '/brands/default.png'
      },
      price: product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      images: product.images || ['/products/placeholder.jpg'],
      category: product.category || 'Other',
      condition: product.condition || 'New',
      sizes: product.sizes || [],
      colors: product.colors || [],
      stock: product.stock || 0,
      description: product.description || '',
      features: product.features || [],
      isActive: product.isActive !== false,
      isFeatured: product.isFeatured || false,
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      salesCount: product.salesCount || 0,
      createdAt: product.createdAt || new Date(),
      updatedAt: product.updatedAt || new Date()
    };

    res.json({
      success: true,
      data: transformedProduct
    });

  } catch (error) {
    console.error('Error fetching product from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
      message: error.message
    });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    console.log('⭐ Fetching featured products from database');

    const products = await Product.find({ 
      isActive: true, 
      isFeatured: true 
    })
      .populate('brand', 'name logo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const transformedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      brand: {
        name: product.brand?.name || 'Unknown',
        logo: product.brand?.logo || '/brands/default.png'
      },
      price: product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      images: product.images || ['/products/placeholder.jpg'],
      category: product.category || 'Other',
      condition: product.condition || 'New',
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      salesCount: product.salesCount || 0
    }));

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        total: transformedProducts.length
      }
    });

  } catch (error) {
    console.error('Error fetching featured products from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured products',
      message: error.message
    });
  }
});

// GET /api/products/trending - Get trending products
router.get('/trending', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    console.log('🔥 Fetching trending products from database');

    const products = await Product.find({ 
      isActive: true 
    })
      .populate('brand', 'name logo')
      .sort({ salesCount: -1, rating: -1 })
      .limit(parseInt(limit));

    const transformedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      brand: {
        name: product.brand?.name || 'Unknown',
        logo: product.brand?.logo || '/brands/default.png'
      },
      price: product.price || 0,
      originalPrice: product.originalPrice || product.price || 0,
      discount: product.discount || 0,
      images: product.images || ['/products/placeholder.jpg'],
      category: product.category || 'Other',
      condition: product.condition || 'New',
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      salesCount: product.salesCount || 0
    }));

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        total: transformedProducts.length
      }
    });

  } catch (error) {
    console.error('Error fetching trending products from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending products',
      message: error.message
    });
  }
});

// GET /api/products/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    console.log('📂 Fetching product categories from database');

    const categories = await Product.distinct('category', { isActive: true });

    res.json({
      success: true,
      data: {
        categories: categories.filter(cat => cat).map(category => ({
          name: category,
          count: 0 // Would need to calculate this separately
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching categories from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// GET /api/products/brands - Get all brands
router.get('/brands', async (req, res) => {
  try {
    console.log('🏷️ Fetching product brands from database');

    const brands = await Product.distinct('brand.name', { isActive: true });

    res.json({
      success: true,
      data: {
        brands: brands.filter(brand => brand).map(brand => ({
          name: brand,
          count: 0 // Would need to calculate this separately
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching brands from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands',
      message: error.message
    });
  }
});

// POST /api/products - Create a new product
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      price,
      description,
      condition,
      featured = false,
      sizes = [],
      colors = []
    } = req.body;

    // Validate required fields
    if (!name || !brand || !category || !price || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, brand, category, price, description'
      });
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              folder: 'resellhub/products',
              resource_type: 'auto',
              transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                { format: 'auto' }
              ]
            }
          );
          imageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Error uploading image to Cloudinary:', uploadError);
          // Continue with other images even if one fails
        }
      }
    }

    // Create product data
    const productData = {
      name: name.trim(),
      brand: {
        name: brand.trim(),
        logo: '' // Will be set later if needed
      },
      category: category.trim(),
      subcategory: '',
      price: parseFloat(price),
      originalPrice: parseFloat(price),
      discount: 0,
      images: imageUrls.length > 0 ? imageUrls : ['/products/placeholder.jpg'],
      description: description.trim(),
      condition: condition || 'new',
      sizes: Array.isArray(sizes) ? sizes : [],
      colors: Array.isArray(colors) ? colors : [],
      isActive: true,
      isFeatured: featured === 'true' || featured === true,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      seller: {
        id: 'admin',
        name: 'Admin',
        email: 'admin@brandoutlet.com'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    const db = getDB();
    const collection = db.collection('products');
    const result = await collection.insertOne(productData);

    console.log('✅ Product created successfully:', result.insertedId);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        id: result.insertedId,
        ...productData
      }
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error.message
    });
  }
});

// POST /api/products/upload-images - Upload images only
router.post('/upload-images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No images provided'
      });
    }

    const imageUrls = [];
    for (const file of req.files) {
      try {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          {
            folder: 'resellhub/products',
            resource_type: 'auto',
            transformation: [
              { width: 800, height: 800, crop: 'limit', quality: 'auto' },
              { format: 'auto' }
            ]
          }
        );
        imageUrls.push({
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height
        });
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload images',
          message: uploadError.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: imageUrls
      }
    });

  } catch (error) {
    console.error('❌ Error uploading images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload images',
      message: error.message
    });
  }
});

module.exports = router;