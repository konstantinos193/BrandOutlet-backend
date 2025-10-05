#!/usr/bin/env node

const fetch = require('node-fetch');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const testNotifications = [
  {
    type: 'order',
    title: 'New High-Value Order',
    message: 'Order #ORD-2024-001 from Sarah Johnson for €1,299.99',
    priority: 'high',
    data: {
      orderId: 'ORD-2024-001',
      customerName: 'Sarah Johnson',
      amount: 1299.99,
      status: 'pending',
      items: ['Nike Air Jordan 1 Retro', 'Adidas Ultraboost 22']
    }
  },
  {
    type: 'verification',
    title: 'Urgent Verification Required',
    message: 'Premium product "Rolex Submariner" needs immediate verification',
    priority: 'high',
    data: {
      productName: 'Rolex Submariner',
      value: 8500,
      submittedBy: 'luxury_seller_123',
      urgency: 'high'
    }
  },
  {
    type: 'inventory',
    title: 'Stock Alert',
    message: 'Nike Air Max 270 - Only 2 items left in stock',
    priority: 'medium',
    data: {
      productName: 'Nike Air Max 270',
      currentStock: 2,
      minThreshold: 10,
      sku: 'NK-AM270-001'
    }
  },
  {
    type: 'system',
    title: 'Performance Update',
    message: 'Dashboard load time improved by 40% with latest optimizations',
    priority: 'low',
    data: {
      improvement: '40%',
      metric: 'load_time',
      version: '2.1.1'
    }
  },
  {
    type: 'user',
    title: 'New Premium Seller',
    message: 'Elite seller "FashionForward" has joined with 500+ verified products',
    priority: 'medium',
    data: {
      sellerName: 'FashionForward',
      verifiedProducts: 500,
      joinDate: new Date().toISOString()
    }
  }
];

async function generateTestNotifications() {
  console.log('🚀 Generating test notifications...');
  
  for (let i = 0; i < testNotifications.length; i++) {
    const notification = testNotifications[i];
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created notification: ${notification.title}`);
      } else {
        console.error(`❌ Failed to create notification: ${notification.title}`);
        console.error(await response.text());
      }
    } catch (error) {
      console.error(`❌ Error creating notification: ${notification.title}`, error.message);
    }
    
    // Add delay between notifications
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('🎉 Test notifications generation complete!');
}

// Run if called directly
if (require.main === module) {
  generateTestNotifications().catch(console.error);
}

module.exports = { generateTestNotifications };
