const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Admin credentials to seed
const adminUsers = [
  {
    username: 'konstantinos193',
    email: 'konstantinos193@brandoutlet.com',
    password: 'Kk.25102002?',
    role: 'admin'
  },
  {
    username: 'JordanJoestar',
    email: 'jordanjoestar@brandoutlet.com', 
    password: 'KaswLocoBarbarossa',
    role: 'admin'
  }
];

// POST /api/seed/admins - Seed admin users
router.post('/admins', async (req, res) => {
  try {
    console.log('🌱 Starting admin seeding...');

    // Clear existing admins
    await Admin.deleteMany({});
    console.log('🗑️ Cleared existing admin users');

    const seededAdmins = [];

    // Hash passwords and create admin users
    for (const adminData of adminUsers) {
      const hashedPassword = await bcrypt.hash(adminData.password, 12);
      
      const admin = await Admin.create({
        ...adminData,
        password: hashedPassword
      });

      seededAdmins.push({
        username: admin.username,
        email: admin.email,
        role: admin.role
      });

      console.log(`✅ Created admin: ${adminData.username} (${adminData.role})`);
    }

    console.log('🎉 Admin seeding completed successfully!');

    res.json({
      success: true,
      message: 'Admin users seeded successfully',
      data: {
        count: seededAdmins.length,
        admins: seededAdmins
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed admin users',
      message: error.message
    });
  }
});

// GET /api/seed/admins - Check if admins exist
router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.findMany({});
    
    res.json({
      success: true,
      data: {
        count: admins.length,
        admins: admins.map(admin => ({
          username: admin.username,
          email: admin.email,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt
        }))
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching admins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin users',
      message: error.message
    });
  }
});

module.exports = router;
