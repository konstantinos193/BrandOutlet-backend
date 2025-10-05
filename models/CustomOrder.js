const mongoose = require('mongoose');

const customOrderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  customerEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    maxlength: 255
  },
  instagramHandle: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  budget: {
    type: Number,
    required: false,
    min: 0
  },
  brands: [{
    type: String,
    trim: true
  }],
  sizes: [{
    type: String,
    trim: true
  }],
  colors: [{
    type: String,
    trim: true
  }],
  condition: {
    type: String,
    enum: ['new', 'used', 'any'],
    default: 'any'
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent'],
    default: 'normal'
  },
  imageUrls: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  quote: {
    type: Number,
    min: 0
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true
});

// Generate order number before saving
customOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `CO-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for better query performance
customOrderSchema.index({ status: 1, createdAt: -1 });
customOrderSchema.index({ instagramHandle: 1 });
customOrderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('CustomOrder', customOrderSchema);
