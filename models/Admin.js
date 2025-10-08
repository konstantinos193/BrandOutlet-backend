const { getCollection } = require('../config/database');

class Admin {
  constructor(data) {
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'admin';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastLogin = data.lastLogin || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static async create(adminData) {
    const collection = getCollection('admins');
    const admin = new Admin(adminData);
    const result = await collection.insertOne(admin);
    return { ...admin, _id: result.insertedId };
  }

  static async findOne(query) {
    const collection = getCollection('admins');
    return await collection.findOne(query);
  }

  static async findById(id) {
    const collection = getCollection('admins');
    return await collection.findOne({ _id: id });
  }

  static async updateOne(query, update) {
    const collection = getCollection('admins');
    update.updatedAt = new Date();
    return await collection.updateOne(query, { $set: update });
  }

  static async deleteMany(query) {
    const collection = getCollection('admins');
    return await collection.deleteMany(query);
  }

  async updateLastLogin() {
    const collection = getCollection('admins');
    this.lastLogin = new Date();
    this.updatedAt = new Date();
    return await collection.updateOne(
      { _id: this._id },
      { $set: { lastLogin: this.lastLogin, updatedAt: this.updatedAt } }
    );
  }
}

module.exports = Admin;
