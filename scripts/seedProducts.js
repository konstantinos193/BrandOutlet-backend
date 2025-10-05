const { connectDB, getDB } = require('../config/database');
const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Air Jordan 1 Retro High OG',
    brandId: 'nike',
    brand: { id: 'nike', name: 'Nike', category: 'mainstream' },
    price: 180.00,
    originalPrice: 220.00,
    discount: 18,
    images: ['/api/placeholder/400/400'],
    description: 'Classic Air Jordan 1 in the iconic Chicago colorway',
    category: 'Sneakers',
    subcategory: 'Basketball',
    size: '10',
    color: 'Red/White/Black',
    condition: 'new',
    stock: 5,
    isActive: true,
    tags: ['jordan', 'basketball', 'retro', 'og'],
    sku: 'AJ1-CHI-10',
    weight: 1.2,
    dimensions: { length: 35, width: 25, height: 15 },
    authenticity: {
      isVerified: true,
      verifiedBy: 'Nike Expert',
      verifiedAt: new Date(),
      certificateUrl: '/certificates/aj1-chi-10.pdf'
    }
  },
  {
    name: 'Supreme Box Logo Hoodie',
    brandId: 'supreme',
    brand: { id: 'supreme', name: 'Supreme', category: 'mainstream' },
    price: 450.00,
    originalPrice: 500.00,
    discount: 10,
    images: ['/api/placeholder/400/400'],
    description: 'Iconic Supreme Box Logo hoodie in black',
    category: 'Clothing',
    subcategory: 'Hoodies',
    size: 'L',
    color: 'Black',
    condition: 'like-new',
    stock: 2,
    isActive: true,
    tags: ['supreme', 'streetwear', 'box-logo', 'hoodie'],
    sku: 'SUP-BLH-L',
    weight: 0.8,
    dimensions: { length: 70, width: 60, height: 5 },
    authenticity: {
      isVerified: true,
      verifiedBy: 'Supreme Expert',
      verifiedAt: new Date(),
      certificateUrl: '/certificates/sup-blh-l.pdf'
    }
  },
  {
    name: 'Louis Vuitton Neverfull MM',
    brandId: 'lv',
    brand: { id: 'lv', name: 'Louis Vuitton', category: 'luxury' },
    price: 1200.00,
    originalPrice: 1500.00,
    discount: 20,
    images: ['/api/placeholder/400/400'],
    description: 'Classic Louis Vuitton Neverfull handbag in monogram canvas',
    category: 'Bags',
    subcategory: 'Handbags',
    size: 'MM',
    color: 'Brown',
    condition: 'good',
    stock: 1,
    isActive: true,
    tags: ['louis-vuitton', 'luxury', 'handbag', 'monogram'],
    sku: 'LV-NF-MM-BR',
    weight: 0.6,
    dimensions: { length: 40, width: 30, height: 20 },
    authenticity: {
      isVerified: true,
      verifiedBy: 'LV Expert',
      verifiedAt: new Date(),
      certificateUrl: '/certificates/lv-nf-mm-br.pdf'
    }
  },
  {
    name: 'Gucci Ace Sneakers',
    brandId: 'gucci',
    brand: { id: 'gucci', name: 'Gucci', category: 'luxury' },
    price: 650.00,
    originalPrice: 750.00,
    discount: 13,
    images: ['/api/placeholder/400/400'],
    description: 'Gucci Ace sneakers with bee embroidery',
    category: 'Sneakers',
    subcategory: 'Luxury',
    size: '9',
    color: 'White/Red',
    condition: 'new',
    stock: 3,
    isActive: true,
    tags: ['gucci', 'luxury', 'sneakers', 'ace'],
    sku: 'GUC-ACE-9',
    weight: 0.9,
    dimensions: { length: 32, width: 22, height: 12 },
    authenticity: {
      isVerified: false, // This one needs verification
      verifiedBy: null,
      verifiedAt: null,
      certificateUrl: null
    }
  },
  {
    name: 'Off-White Air Max 90',
    brandId: 'nike',
    brand: { id: 'nike', name: 'Nike', category: 'mainstream' },
    price: 320.00,
    originalPrice: 400.00,
    discount: 20,
    images: ['/api/placeholder/400/400'],
    description: 'Off-White x Nike Air Max 90 in Desert Ore colorway',
    category: 'Sneakers',
    subcategory: 'Collaboration',
    size: '10.5',
    color: 'Desert Ore',
    condition: 'like-new',
    stock: 1,
    isActive: true,
    tags: ['off-white', 'nike', 'collaboration', 'air-max'],
    sku: 'OW-AM90-10.5',
    weight: 1.1,
    dimensions: { length: 34, width: 24, height: 14 },
    authenticity: {
      isVerified: false, // This one needs verification
      verifiedBy: null,
      verifiedAt: null,
      certificateUrl: null
    }
  },
  {
    name: 'Chanel Classic Flap Bag',
    brandId: 'chanel',
    brand: { id: 'chanel', name: 'Chanel', category: 'luxury' },
    price: 2800.00,
    originalPrice: 3500.00,
    discount: 20,
    images: ['/api/placeholder/400/400'],
    description: 'Chanel Classic Flap Bag in black caviar leather',
    category: 'Bags',
    subcategory: 'Luxury',
    size: 'Medium',
    color: 'Black',
    condition: 'good',
    stock: 1,
    isActive: true,
    tags: ['chanel', 'luxury', 'classic-flap', 'caviar'],
    sku: 'CHN-CFB-M-BLK',
    weight: 0.8,
    dimensions: { length: 25, width: 15, height: 8 },
    authenticity: {
      isVerified: false, // This one needs verification
      verifiedBy: null,
      verifiedAt: null,
      certificateUrl: null
    }
  }
];

const seedProducts = async () => {
  try {
    console.log('🌱 Starting product seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing products (optional - remove this if you want to keep existing data)
    const db = getDB();
    const collection = db.collection('products');
    await collection.deleteMany({});
    console.log('🗑️ Cleared existing products');
    
    // Insert sample products
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Created product: ${product.name}`);
    }
    
    console.log('🎉 Product seeding completed successfully!');
    console.log(`📊 Created ${sampleProducts.length} products`);
    
    // Show some stats
    const totalProducts = await collection.countDocuments();
    const verifiedProducts = await collection.countDocuments({ 'authenticity.isVerified': true });
    const pendingVerification = await collection.countDocuments({ 'authenticity.isVerified': false });
    
    console.log('\n📈 Database Stats:');
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Verified Products: ${verifiedProducts}`);
    console.log(`Pending Verification: ${pendingVerification}`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    process.exit(0);
  }
};

// Run the seeding
seedProducts();
