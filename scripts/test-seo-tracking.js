#!/usr/bin/env node

/**
 * Test script to verify SEO tracking is working properly
 * This script tests the real SEO data collection endpoints
 */

const { connectDB } = require('../config/database');

async function testSEOTracking() {
  console.log('🧪 Testing SEO Tracking System...\n');

  try {
    // Connect to database
    const db = await connectDB();
    console.log('✅ Database connected successfully');

    // Test 1: Check if seoMetrics collection exists and is accessible
    console.log('\n📊 Testing database collection...');
    const seoCollection = db.collection('seoMetrics');
    const totalMetrics = await seoCollection.countDocuments();
    console.log(`✅ Found ${totalMetrics} existing SEO metrics in database`);

    // Test 2: Test the SEO API endpoints
    console.log('\n🌐 Testing SEO API endpoints...');
    
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const testMetric = {
      metricType: 'seo-event',
      metricName: 'test_metric',
      value: 1,
      page: 'Test Page',
      path: '/test',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true }
    };

    // Test single metric endpoint
    try {
      const singleResponse = await fetch(`${baseUrl}/api/seo/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMetric)
      });

      if (singleResponse.ok) {
        console.log('✅ Single metric endpoint working');
      } else {
        console.log('❌ Single metric endpoint failed:', singleResponse.status);
      }
    } catch (error) {
      console.log('❌ Single metric endpoint error:', error.message);
    }

    // Test batch metrics endpoint
    try {
      const batchResponse = await fetch(`${baseUrl}/api/seo/batch-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: [
            {
              metricType: 'core-web-vitals',
              metricName: 'LCP',
              value: 2500,
              page: 'Test Page',
              path: '/test',
              sessionId: 'test_session_' + Date.now()
            },
            {
              metricType: 'page-performance',
              metricName: 'page_load_time',
              value: 1500,
              page: 'Test Page',
              path: '/test',
              sessionId: 'test_session_' + Date.now()
            }
          ]
        })
      });

      if (batchResponse.ok) {
        console.log('✅ Batch metrics endpoint working');
      } else {
        console.log('❌ Batch metrics endpoint failed:', batchResponse.status);
      }
    } catch (error) {
      console.log('❌ Batch metrics endpoint error:', error.message);
    }

    // Test analytics endpoint
    try {
      const analyticsResponse = await fetch(`${baseUrl}/api/seo/analytics?timeframe=7d`);
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        console.log('✅ Analytics endpoint working');
        console.log(`   - Total metrics: ${analyticsData.data?.totalMetrics || 0}`);
        console.log(`   - Unique pages: ${analyticsData.data?.uniquePages || 0}`);
      } else {
        console.log('❌ Analytics endpoint failed:', analyticsResponse.status);
      }
    } catch (error) {
      console.log('❌ Analytics endpoint error:', error.message);
    }

    // Test health endpoint
    try {
      const healthResponse = await fetch(`${baseUrl}/api/seo/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Health endpoint working');
        console.log(`   - Total metrics in DB: ${healthData.stats?.totalMetrics || 0}`);
      } else {
        console.log('❌ Health endpoint failed:', healthResponse.status);
      }
    } catch (error) {
      console.log('❌ Health endpoint error:', error.message);
    }

    // Test 3: Check recent metrics in database
    console.log('\n📈 Checking recent metrics...');
    const recentMetrics = await seoCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    if (recentMetrics.length > 0) {
      console.log('✅ Recent metrics found:');
      recentMetrics.forEach((metric, index) => {
        console.log(`   ${index + 1}. ${metric.metricType} - ${metric.metricName}: ${metric.value} (${metric.page})`);
      });
    } else {
      console.log('⚠️  No recent metrics found - this is normal if no real traffic has been tracked yet');
    }

    console.log('\n🎉 SEO Tracking Test Complete!');
    console.log('\nTo generate real data:');
    console.log('1. Start your frontend application');
    console.log('2. Visit public pages (not admin pages)');
    console.log('3. The SEO tracking will automatically collect Core Web Vitals and performance metrics');
    console.log('4. Check the admin dashboard to view the collected data');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSEOTracking().then(() => {
  console.log('\n✨ Test completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
