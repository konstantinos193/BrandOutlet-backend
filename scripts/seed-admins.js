const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

// Admin credentials to seed
const adminUsers = [
  {
    username: 'konstantinos193',
    email: 'konstantinos193@brandoutlet.com',
    password: 'Kk.25102002?',
    role: 'super_admin'
  },
  {
    username: 'JordanJoestar',
    email: 'jordanjoestar@brandoutlet.com', 
    password: 'KaswLocoBarbarossa',
    role: 'admin'
  }
];

async function seedAdmins() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brandoutlet';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing admins
    await Admin.deleteMany({});
    console.log('🗑️ Cleared existing admin users');

    // Hash passwords and create admin users
    for (const adminData of adminUsers) {
      const hashedPassword = await bcrypt.hash(adminData.password, 12);
      
      const admin = new Admin({
        ...adminData,
        password: hashedPassword
      });

      await admin.save();
      console.log(`✅ Created admin: ${adminData.username} (${adminData.role})`);
    }

    console.log('🎉 Admin seeding completed successfully!');
    console.log('📋 Seeded admins:');
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.username} (${admin.email}) - ${admin.role}`);
    });

  } catch (error) {
    console.error('❌ Error seeding admins:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding function
seedAdmins();
