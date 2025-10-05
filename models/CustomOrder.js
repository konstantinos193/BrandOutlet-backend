const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class CustomOrder {
  constructor(data) {
    this.id = data.id || null;
    this.customerName = data.customerName;
    this.customerEmail = data.customerEmail;
    this.instagramHandle = data.instagramHandle;
    this.description = data.description;
    this.budget = data.budget;
    this.brands = data.brands || [];
    this.sizes = data.sizes || [];
    this.colors = data.colors || [];
    this.condition = data.condition || 'any';
    this.urgency = data.urgency || 'normal';
    this.imageUrls = data.imageUrls || [];
    this.status = data.status || 'pending';
    this.adminResponse = data.adminResponse;
    this.quote = data.quote;
    this.orderNumber = data.orderNumber;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Generate order number
  static async generateOrderNumber() {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      const count = await collection.countDocuments();
      return `CO-${String(count + 1).padStart(6, '0')}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      throw error;
    }
  }

  // Save custom order to database
  async save() {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      // Generate order number if not provided
      if (!this.orderNumber) {
        this.orderNumber = await CustomOrder.generateOrderNumber();
      }

      const orderData = {
        customerName: this.customerName,
        customerEmail: this.customerEmail,
        instagramHandle: this.instagramHandle,
        description: this.description,
        budget: this.budget,
        brands: this.brands,
        sizes: this.sizes,
        colors: this.colors,
        condition: this.condition,
        urgency: this.urgency,
        imageUrls: this.imageUrls,
        status: this.status,
        adminResponse: this.adminResponse,
        quote: this.quote,
        orderNumber: this.orderNumber,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };

      const result = await collection.insertOne(orderData);
      this.id = result.insertedId.toString();
      return this;
    } catch (error) {
      console.error('Error saving custom order:', error);
      throw error;
    }
  }

  // Get all custom orders
  static async findAll(filters = {}) {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      const query = {};
      
      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.urgency) query.urgency = filters.urgency;
      if (filters.customerName) {
        query.customerName = { $regex: filters.customerName, $options: 'i' };
      }
      if (filters.instagramHandle) {
        query.instagramHandle = { $regex: filters.instagramHandle, $options: 'i' };
      }
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const orders = await collection.find(query).sort({ createdAt: -1 }).toArray();
      return orders.map(order => new CustomOrder(order));
    } catch (error) {
      console.error('Error fetching custom orders:', error);
      throw error;
    }
  }

  // Get custom order by ID
  static async findById(id) {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      const order = await collection.findOne({ _id: new ObjectId(id) });
      return order ? new CustomOrder(order) : null;
    } catch (error) {
      console.error('Error fetching custom order by ID:', error);
      throw error;
    }
  }

  // Get custom order by order number
  static async findByOrderNumber(orderNumber) {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      const order = await collection.findOne({ orderNumber: orderNumber });
      return order ? new CustomOrder(order) : null;
    } catch (error) {
      console.error('Error fetching custom order by order number:', error);
      throw error;
    }
  }

  // Update custom order
  async update(updateData) {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      updateData.updatedAt = new Date();
      
      await collection.updateOne(
        { _id: new ObjectId(this.id) },
        { $set: updateData }
      );
      
      // Update local instance
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      console.error('Error updating custom order:', error);
      throw error;
    }
  }

  // Delete custom order
  async delete() {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      await collection.deleteOne({ _id: new ObjectId(this.id) });
      return true;
    } catch (error) {
      console.error('Error deleting custom order:', error);
      throw error;
    }
  }

  // Get dashboard stats
  static async getDashboardStats() {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      const totalOrders = await collection.countDocuments();
      const pendingOrders = await collection.countDocuments({ status: 'pending' });
      const inProgressOrders = await collection.countDocuments({ status: 'in_progress' });
      const completedOrders = await collection.countDocuments({ status: 'completed' });
      const cancelledOrders = await collection.countDocuments({ status: 'cancelled' });
      
      // Get recent orders (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentOrders = await collection.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      // Get urgent orders
      const urgentOrders = await collection.countDocuments({ urgency: 'urgent' });

      // Get orders with quotes
      const ordersWithQuotes = await collection.countDocuments({ 
        quote: { $exists: true, $ne: null } 
      });

      return {
        totalOrders,
        pendingOrders,
        inProgressOrders,
        completedOrders,
        cancelledOrders,
        recentOrders,
        urgentOrders,
        ordersWithQuotes
      };
    } catch (error) {
      console.error('Error fetching custom orders dashboard stats:', error);
      throw error;
    }
  }

  // Get recent orders
  static async getRecentOrders(limit = 10) {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      const orders = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return orders.map(order => new CustomOrder(order));
    } catch (error) {
      console.error('Error fetching recent custom orders:', error);
      throw error;
    }
  }

  // Count orders with filters
  static async count(filters = {}) {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      const query = {};
      
      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.urgency) query.urgency = filters.urgency;
      if (filters.customerName) {
        query.customerName = { $regex: filters.customerName, $options: 'i' };
      }
      if (filters.instagramHandle) {
        query.instagramHandle = { $regex: filters.instagramHandle, $options: 'i' };
      }
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      return await collection.countDocuments(query);
    } catch (error) {
      console.error('Error counting custom orders:', error);
      throw error;
    }
  }

  // Get orders by status
  static async findByStatus(status) {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      const orders = await collection
        .find({ status: status })
        .sort({ createdAt: -1 })
        .toArray();
      
      return orders.map(order => new CustomOrder(order));
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  }

  // Get urgent orders
  static async findUrgentOrders() {
    try {
      const db = getDB();
      const collection = db.collection('customOrders');
      
      const orders = await collection
        .find({ urgency: 'urgent' })
        .sort({ createdAt: -1 })
        .toArray();
      
      return orders.map(order => new CustomOrder(order));
    } catch (error) {
      console.error('Error fetching urgent orders:', error);
      throw error;
    }
  }
}

module.exports = CustomOrder;