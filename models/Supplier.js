const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Supplier {
  constructor(data) {
    this.id = data.id || null;
    this.name = data.name;
    this.contactEmail = data.contactEmail;
    this.phone = data.phone;
    this.address = data.address || {};
    this.website = data.website;
    this.leadTime = data.leadTime || 7; // days
    this.minimumOrderQuantity = data.minimumOrderQuantity || 1;
    this.paymentTerms = data.paymentTerms || 'net_30';
    this.currency = data.currency || 'USD';
    this.status = data.status || 'active';
    this.rating = data.rating || 0;
    this.notes = data.notes;
    this.products = data.products || []; // Array of product IDs
    this.performance = data.performance || {
      onTimeDelivery: 0,
      qualityScore: 0,
      communicationScore: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      lastOrderDate: null
    };
    this.contacts = data.contacts || [];
    this.documents = data.documents || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Save supplier to database
  async save() {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      
      this.updatedAt = new Date();
      
      const supplierData = {
        name: this.name,
        contactEmail: this.contactEmail,
        phone: this.phone,
        address: this.address,
        website: this.website,
        leadTime: this.leadTime,
        minimumOrderQuantity: this.minimumOrderQuantity,
        paymentTerms: this.paymentTerms,
        currency: this.currency,
        status: this.status,
        rating: this.rating,
        notes: this.notes,
        products: this.products,
        performance: this.performance,
        contacts: this.contacts,
        documents: this.documents,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };

      if (this.id) {
        // Update existing supplier
        await collection.updateOne(
          { _id: new ObjectId(this.id) },
          { $set: supplierData }
        );
      } else {
        // Create new supplier
        const result = await collection.insertOne(supplierData);
        this.id = result.insertedId.toString();
      }
      
      return this;
    } catch (error) {
      console.error('Error saving supplier:', error);
      throw error;
    }
  }

  // Get all suppliers
  static async findAll(filters = {}) {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      
      const query = {};
      
      // Apply filters
      if (filters.status) query.status = filters.status;
      if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
      if (filters.contactEmail) query.contactEmail = { $regex: filters.contactEmail, $options: 'i' };
      if (filters.minRating) query.rating = { $gte: filters.minRating };

      const suppliers = await collection.find(query).sort({ name: 1 }).toArray();
      return suppliers.map(supplier => new Supplier(supplier));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  // Get supplier by ID
  static async findById(id) {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      const supplier = await collection.findOne({ _id: new ObjectId(id) });
      return supplier ? new Supplier(supplier) : null;
    } catch (error) {
      console.error('Error fetching supplier by ID:', error);
      throw error;
    }
  }

  // Get supplier by email
  static async findByEmail(email) {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      const supplier = await collection.findOne({ contactEmail: email });
      return supplier ? new Supplier(supplier) : null;
    } catch (error) {
      console.error('Error fetching supplier by email:', error);
      throw error;
    }
  }

  // Update supplier performance
  async updatePerformance(performanceData) {
    try {
      this.performance = {
        ...this.performance,
        ...performanceData,
        lastUpdated: new Date()
      };
      
      return await this.save();
    } catch (error) {
      console.error('Error updating supplier performance:', error);
      throw error;
    }
  }

  // Add product to supplier
  async addProduct(productId) {
    try {
      if (!this.products.includes(productId)) {
        this.products.push(productId);
        return await this.save();
      }
      return this;
    } catch (error) {
      console.error('Error adding product to supplier:', error);
      throw error;
    }
  }

  // Remove product from supplier
  async removeProduct(productId) {
    try {
      this.products = this.products.filter(id => id !== productId);
      return await this.save();
    } catch (error) {
      console.error('Error removing product from supplier:', error);
      throw error;
    }
  }

  // Get supplier analytics
  static async getSupplierAnalytics() {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      
      const pipeline = [
        {
          $group: {
            _id: null,
            totalSuppliers: { $sum: 1 },
            activeSuppliers: {
              $sum: {
                $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
              }
            },
            averageRating: { $avg: '$rating' },
            averageLeadTime: { $avg: '$leadTime' },
            totalProducts: { $sum: { $size: '$products' } }
          }
        }
      ];
      
      const result = await collection.aggregate(pipeline).toArray();
      return result[0] || {};
    } catch (error) {
      console.error('Error fetching supplier analytics:', error);
      throw error;
    }
  }

  // Get top performing suppliers
  static async getTopPerformers(limit = 10) {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      
      const suppliers = await collection
        .find({ status: 'active' })
        .sort({ rating: -1, 'performance.onTimeDelivery': -1 })
        .limit(limit)
        .toArray();
      
      return suppliers.map(supplier => new Supplier(supplier));
    } catch (error) {
      console.error('Error fetching top performing suppliers:', error);
      throw error;
    }
  }

  // Update supplier
  async update(updateData) {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      
      updateData.updatedAt = new Date();
      
      await collection.updateOne(
        { _id: new ObjectId(this.id) },
        { $set: updateData }
      );
      
      // Update local instance
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  // Delete supplier
  async delete() {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      
      await collection.deleteOne({ _id: new ObjectId(this.id) });
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // Search suppliers
  static async search(searchTerm) {
    try {
      const db = getDB();
      const collection = db.collection('suppliers');
      
      const query = {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { contactEmail: { $regex: searchTerm, $options: 'i' } },
          { phone: { $regex: searchTerm, $options: 'i' } }
        ]
      };
      
      const suppliers = await collection.find(query).sort({ name: 1 }).toArray();
      return suppliers.map(supplier => new Supplier(supplier));
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw error;
    }
  }
}

module.exports = Supplier;
