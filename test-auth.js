const jwt = require('jsonwebtoken');

// Test JWT functionality
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

// Test token creation
const testUser = {
  id: 'admin',
  username: 'admin',
  email: 'admin@brandoutlet.com',
  role: 'admin'
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });
console.log('✅ JWT token created successfully');
console.log('Token:', token);

// Test token verification
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ JWT token verified successfully');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.error('❌ JWT token verification failed:', error.message);
}

console.log('🔐 Authentication system test completed');
