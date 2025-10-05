const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/custom-orders';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'custom-order-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// POST /api/custom-orders - Create a new custom order
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      instagramHandle,
      description,
      budget,
      preferredBrands,
      size,
      color,
      condition,
      urgency,
      additionalNotes
    } = req.body;

    console.log('📝 Creating custom order in database');

    // Validate required fields
    if (!customerName || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Customer name and description are required'
      });
    }

    // Require at least one contact method
    const hasContact = Boolean(
      (customerEmail && customerEmail.trim()) ||
      (instagramHandle && instagramHandle.trim()) ||
      (customerPhone && customerPhone.trim())
    );
    if (!hasContact) {
      return res.status(400).json({
        success: false,
        error: 'Missing contact information',
        message: 'Provide at least one contact: email, Instagram handle, or phone'
      });
    }

    const db = await getDB();
    const customOrdersCollection = db.collection('customOrders');

    // Generate order number
    const orderNumber = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    })) : [];

    // Create custom order document
    const customOrder = {
      orderNumber,
      customer: {
        name: customerName,
        email: customerEmail || '',
        phone: customerPhone || '',
        instagramHandle: instagramHandle || ''
      },
      orderDetails: {
        description,
        budget: budget ? parseFloat(budget) : null,
        preferredBrands: preferredBrands ? preferredBrands.split(',').map(brand => brand.trim()) : [],
        size: size || '',
        color: color || '',
        condition: condition || 'any',
        urgency: urgency || 'normal'
      },
      images,
      additionalNotes: additionalNotes || '',
      status: 'pending',
      priority: urgency === 'urgent' ? 'high' : 'normal',
      estimatedResponseTime: urgency === 'urgent' ? '24 hours' : '48-72 hours',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTo: null,
      response: null,
      quote: null
    };

    // Insert into database
    const result = await customOrdersCollection.insertOne(customOrder);

    console.log(`✅ Custom order created with ID: ${result.insertedId}`);

    res.status(201).json({
      success: true,
      message: 'Custom order submitted successfully',
      data: {
        id: result.insertedId.toString(),
        orderNumber,
        status: 'pending',
        estimatedResponseTime: customOrder.estimatedResponseTime
      }
    });

  } catch (error) {
    console.error('Error creating custom order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create custom order',
      message: error.message
    });
  }
});

// GET /api/custom-orders - Get all custom orders with filtering
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    console.log('📝 Fetching custom orders from database');

    const db = await getDB();
    const customOrdersCollection = db.collection('customOrders');

    // Build query filters
    let query = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.instagramHandle': { $regex: search, $options: 'i' } },
        { 'orderDetails.description': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get orders from database
    const orders = await customOrdersCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count for pagination
    const total = await customOrdersCollection.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching custom orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom orders',
      message: error.message
    });
  }
});

// GET /api/custom-orders/:id - Get custom order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📝 Fetching custom order ${id} from database`);

    const db = await getDB();
    const customOrdersCollection = db.collection('customOrders');

    const order = await customOrdersCollection.findOne({ _id: new ObjectId(id) });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Custom order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching custom order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom order',
      message: error.message
    });
  }
});

// PUT /api/custom-orders/:id/status - Update custom order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    console.log(`📝 Updating custom order ${id} status to ${status}`);

    if (!['pending', 'reviewing', 'quoted', 'accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const db = await getDB();
    const customOrdersCollection = db.collection('customOrders');

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (notes) {
      updateData.adminNotes = notes;
    }

    const result = await customOrdersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Custom order not found'
      });
    }

    res.json({
      success: true,
      message: `Custom order status updated to ${status}`,
      data: { status }
    });

  } catch (error) {
    console.error('Error updating custom order status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update custom order status',
      message: error.message
    });
  }
});

// PUT /api/custom-orders/:id/response - Add response to custom order
router.put('/:id/response', async (req, res) => {
  try {
    const { id } = req.params;
    const { response, quote, estimatedDelivery } = req.body;

    console.log(`📝 Adding response to custom order ${id}`);

    const db = await getDB();
    const customOrdersCollection = db.collection('customOrders');

    const updateData = {
      response: {
        message: response,
        quote: quote ? parseFloat(quote) : null,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        respondedAt: new Date()
      },
      status: 'quoted',
      updatedAt: new Date()
    };

    const result = await customOrdersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Custom order not found'
      });
    }

    res.json({
      success: true,
      message: 'Response added successfully',
      data: updateData.response
    });

  } catch (error) {
    console.error('Error adding response to custom order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add response',
      message: error.message
    });
  }
});

// GET /api/custom-orders/stats - Get custom orders statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching custom orders statistics');

    const db = await getDB();
    const customOrdersCollection = db.collection('customOrders');

    // Get total orders
    const total = await customOrdersCollection.countDocuments();

    // Get orders by status
    const pending = await customOrdersCollection.countDocuments({ status: 'pending' });
    const reviewing = await customOrdersCollection.countDocuments({ status: 'reviewing' });
    const quoted = await customOrdersCollection.countDocuments({ status: 'quoted' });
    const accepted = await customOrdersCollection.countDocuments({ status: 'accepted' });
    const rejected = await customOrdersCollection.countDocuments({ status: 'rejected' });
    const completed = await customOrdersCollection.countDocuments({ status: 'completed' });

    // Get orders by priority
    const highPriority = await customOrdersCollection.countDocuments({ priority: 'high' });
    const normalPriority = await customOrdersCollection.countDocuments({ priority: 'normal' });

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = await customOrdersCollection.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          reviewing,
          quoted,
          accepted,
          rejected,
          completed
        },
        byPriority: {
          high: highPriority,
          normal: normalPriority
        },
        recentOrders
      }
    });

  } catch (error) {
    console.error('Error fetching custom orders statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom orders statistics',
      message: error.message
    });
  }
});

// GET /api/custom-orders/:id/images/:filename - Serve uploaded images
router.get('/:id/images/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../uploads/custom-orders', filename);
    
    if (fs.existsSync(imagePath)) {
      res.sendFile(path.resolve(imagePath));
    } else {
      res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve image'
    });
  }
});

module.exports = router;
