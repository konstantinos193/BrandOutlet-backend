const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// GET /api/user-management/users - Get all users from database
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      role = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    console.log('👥 Fetching users from database');
    
    const db = await getDB();
    const usersCollection = db.collection('users');
    
    // Build query filters
    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Get users from database
    const users = await usersCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    // Get total count for pagination
    const total = await usersCollection.countDocuments(query);
    
    // Transform users to match expected format
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username || 'Unknown',
      email: user.email || '',
      role: user.role || 'buyer',
      status: user.status || 'active',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLogin: user.lastLogin || null,
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        avatar: user.profile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        phone: user.profile?.phone || ''
      },
      stats: {
        totalOrders: user.stats?.totalOrders || 0,
        totalSpent: user.stats?.totalSpent || 0,
        averageOrderValue: user.stats?.averageOrderValue || 0
      }
    }));
    
    res.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching users from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /api/user-management/users/:id - Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`👤 Fetching user ${id} from database`);
    
    const db = await getDB();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const transformedUser = {
      id: user._id.toString(),
      username: user.username || 'Unknown',
      email: user.email || '',
      role: user.role || 'buyer',
      status: user.status || 'active',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLogin: user.lastLogin || null,
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        avatar: user.profile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        phone: user.profile?.phone || ''
      },
      stats: {
        totalOrders: user.stats?.totalOrders || 0,
        totalSpent: user.stats?.totalSpent || 0,
        averageOrderValue: user.stats?.averageOrderValue || 0
      }
    };
    
    res.json({
      success: true,
      data: transformedUser
    });
    
  } catch (error) {
    console.error('Error fetching user from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// PUT /api/user-management/users/:id - Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`✏️ Updating user ${id} in database`);
    
    const db = await getDB();
    const usersCollection = db.collection('users');
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData._id;
    delete updateData.createdAt;
    
    // Add updatedAt timestamp
    updateData.updatedAt = new Date();
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get updated user
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser._id.toString(),
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status
      }
    });
    
  } catch (error) {
    console.error('Error updating user in database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// DELETE /api/user-management/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting user ${id} from database`);
    
    const db = await getDB();
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// PUT /api/user-management/users/:id/status - Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating user ${id} status to ${status} in database`);
    
    if (!['active', 'pending', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be active, pending, suspended, or banned'
      });
    }
    
    const db = await getDB();
    const usersCollection = db.collection('users');
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { status }
    });
    
  } catch (error) {
    console.error('Error updating user status in database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      message: error.message
    });
  }
});

// GET /api/user-management/stats - Get user statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching user statistics from database');
    
    const db = await getDB();
    const usersCollection = db.collection('users');
    
    // Get total users
    const total = await usersCollection.countDocuments();
    
    // Get users by status
    const active = await usersCollection.countDocuments({ status: 'active' });
    const pending = await usersCollection.countDocuments({ status: 'pending' });
    const suspended = await usersCollection.countDocuments({ status: 'suspended' });
    
    // Get users by role
    const admin = await usersCollection.countDocuments({ role: 'admin' });
    const seller = await usersCollection.countDocuments({ role: 'seller' });
    const buyer = await usersCollection.countDocuments({ role: 'buyer' });
    const moderator = await usersCollection.countDocuments({ role: 'moderator' });
    
    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await usersCollection
      .find({ createdAt: { $gte: sevenDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Calculate average order value (mock for now - would need orders collection)
    const averageOrderValue = 175.65; // This would be calculated from orders collection
    
    res.json({
      success: true,
      data: {
        total,
        active,
        pending,
        suspended,
        roles: {
          admin,
          seller,
          buyer,
          moderator
        },
        recentRegistrations: recentRegistrations.map(user => ({
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        })),
        averageOrderValue
      }
    });
    
  } catch (error) {
    console.error('Error fetching user statistics from database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: error.message
    });
  }
});

module.exports = router;