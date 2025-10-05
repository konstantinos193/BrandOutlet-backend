const express = require('express');
const router = express.Router();

// Mock user data - in production, this would come from a database
const mockUsers = [
  {
    id: '1',
    username: 'admin_user',
    email: 'admin@jordiresell.com',
    role: 'admin',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    lastLogin: '2024-01-20T14:22:00Z',
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      phone: '+1-555-0123'
    },
    stats: {
      totalOrders: 45,
      totalSpent: 12500,
      averageOrderValue: 277.78
    }
  },
  {
    id: '2',
    username: 'seller_john',
    email: 'john@seller.com',
    role: 'seller',
    status: 'active',
    createdAt: '2024-01-10T09:15:00Z',
    lastLogin: '2024-01-19T16:45:00Z',
    profile: {
      firstName: 'John',
      lastName: 'Smith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      phone: '+1-555-0124'
    },
    stats: {
      totalOrders: 23,
      totalSpent: 8900,
      averageOrderValue: 386.96
    }
  },
  {
    id: '3',
    username: 'buyer_sarah',
    email: 'sarah@buyer.com',
    role: 'buyer',
    status: 'active',
    createdAt: '2024-01-12T11:20:00Z',
    lastLogin: '2024-01-20T09:30:00Z',
    profile: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
      phone: '+1-555-0125'
    },
    stats: {
      totalOrders: 67,
      totalSpent: 15600,
      averageOrderValue: 232.84
    }
  },
  {
    id: '4',
    username: 'moderator_mike',
    email: 'mike@moderator.com',
    role: 'moderator',
    status: 'active',
    createdAt: '2024-01-08T14:10:00Z',
    lastLogin: '2024-01-18T13:15:00Z',
    profile: {
      firstName: 'Mike',
      lastName: 'Wilson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
      phone: '+1-555-0126'
    },
    stats: {
      totalOrders: 12,
      totalSpent: 3200,
      averageOrderValue: 266.67
    }
  },
  {
    id: '5',
    username: 'seller_emma',
    email: 'emma@seller.com',
    role: 'seller',
    status: 'pending',
    createdAt: '2024-01-20T08:45:00Z',
    lastLogin: null,
    profile: {
      firstName: 'Emma',
      lastName: 'Davis',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
      phone: '+1-555-0127'
    },
    stats: {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0
    }
  },
  {
    id: '6',
    username: 'buyer_alex',
    email: 'alex@buyer.com',
    role: 'buyer',
    status: 'suspended',
    createdAt: '2024-01-05T16:30:00Z',
    lastLogin: '2024-01-15T10:20:00Z',
    profile: {
      firstName: 'Alex',
      lastName: 'Brown',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      phone: '+1-555-0128'
    },
    stats: {
      totalOrders: 8,
      totalSpent: 2100,
      averageOrderValue: 262.50
    }
  }
];

// GET /api/user-management/users - Get all users with filtering and pagination
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let filteredUsers = [...mockUsers];

    // Apply filters
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.profile.firstName.toLowerCase().includes(searchTerm) ||
        user.profile.lastName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    filteredUsers.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'profile') {
        aValue = a.profile.firstName + ' ' + a.profile.lastName;
        bValue = b.profile.firstName + ' ' + b.profile.lastName;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      total: filteredUsers.length,
      active: filteredUsers.filter(u => u.status === 'active').length,
      pending: filteredUsers.filter(u => u.status === 'pending').length,
      suspended: filteredUsers.filter(u => u.status === 'suspended').length,
      byRole: {
        admin: filteredUsers.filter(u => u.role === 'admin').length,
        seller: filteredUsers.filter(u => u.role === 'seller').length,
        buyer: filteredUsers.filter(u => u.role === 'buyer').length,
        moderator: filteredUsers.filter(u => u.role === 'moderator').length
      }
    };

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / parseInt(limit))
        },
        stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching users:', error);
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
    const user = mockUsers.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
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
    const updates = req.body;

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockUsers[userIndex],
      message: 'User updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
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
    const userIndex = mockUsers.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    mockUsers.splice(userIndex, 1);

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// POST /api/user-management/users/:id/status - Update user status
router.post('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    mockUsers[userIndex].status = status;
    mockUsers[userIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      data: mockUsers[userIndex],
      message: `User status updated to ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
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
    const stats = {
      total: mockUsers.length,
      active: mockUsers.filter(u => u.status === 'active').length,
      pending: mockUsers.filter(u => u.status === 'pending').length,
      suspended: mockUsers.filter(u => u.status === 'suspended').length,
      byRole: {
        admin: mockUsers.filter(u => u.role === 'admin').length,
        seller: mockUsers.filter(u => u.role === 'seller').length,
        buyer: mockUsers.filter(u => u.role === 'buyer').length,
        moderator: mockUsers.filter(u => u.role === 'moderator').length
      },
      recentRegistrations: mockUsers
        .filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length,
      averageOrderValue: mockUsers.reduce((sum, u) => sum + u.stats.averageOrderValue, 0) / mockUsers.length
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: error.message
    });
  }
});

module.exports = router;
