const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { connectDB } = require('../config/database');
require('dotenv').config();

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

async function seedAdmins() {
  try {
    // Connect to MongoDB using existing database config
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing admins
    await Admin.deleteMany({});
    console.log('🗑️ Cleared existing admin users');

    // Hash passwords and create admin users
    for (const adminData of adminUsers) {
      const hashedPassword = await bcrypt.hash(adminData.password, 12);
      
      const admin = await Admin.create({
        ...adminData,
        password: hashedPassword
      });

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
    console.log('🔌 Seeding completed');
    process.exit(0);
  }
}

// Run the seeding function
seedAdmins();
