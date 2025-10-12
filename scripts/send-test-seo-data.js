#!/usr/bin/env node

/**
 * Send test SEO data to verify the tracking system is working
 */

const baseUrl = 'https://resellapi.onrender.com';

async function sendTestSEOData() {
  console.log('📊 Sending test SEO data to verify tracking...\n');

  const testMetrics = [
    // Core Web Vitals
    {
      metricType: 'core-web-vitals',
      metricName: 'LCP',
      value: 2500,
      page: 'Home',
      path: '/',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true }
    },
    {
      metricType: 'core-web-vitals',
      metricName: 'FID',
      value: 100,
      page: 'Home',
      path: '/',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true }
    },
    {
      metricType: 'core-web-vitals',
      metricName: 'CLS',
      value: 0.1,
      page: 'Home',
      path: '/',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true }
    },
    // Page Performance
    {
      metricType: 'page-performance',
      metricName: 'page_load_time',
      value: 1500,
      page: 'Home',
      path: '/',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true }
    },
    {
      metricType: 'page-performance',
      metricName: 'image_load',
      value: 800,
      page: 'Home',
      path: '/',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true, imageIndex: 0 }
    },
    // SEO Events
    {
      metricType: 'seo-event',
      metricName: 'page_view',
      value: 1,
      page: 'Home',
      path: '/',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true }
    },
    {
      metricType: 'seo-event',
      metricName: 'internal_link_click',
      value: 1,
      page: 'Home',
      path: '/',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true, link: '/products' }
    },
    {
      metricType: 'seo-event',
      metricName: 'search',
      value: 1,
      page: 'Home',
      path: '/',
      sessionId: 'test_session_' + Date.now(),
      additionalData: { test: true, search_term: 'nike shoes' }
    }
  ];

  try {
    console.log('🚀 Sending batch metrics...');
    const response = await fetch(`${baseUrl}/api/seo/batch-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metrics: testMetrics })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test data sent successfully!');
      console.log(`   Processed: ${result.data.processed} metrics`);
      console.log(`   Errors: ${result.data.errors}`);
      
      // Wait a moment for data to be processed
      console.log('\n⏳ Waiting 3 seconds for data to be processed...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test analytics endpoint
      console.log('\n📈 Testing analytics endpoint...');
      const analyticsResponse = await fetch(`${baseUrl}/api/seo/analytics?timeframe=7d`);
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        console.log('✅ Analytics working!');
        console.log(`   Total metrics: ${analyticsData.data.totalMetrics}`);
        console.log(`   Unique pages: ${analyticsData.data.uniquePages}`);
        
        // Show Core Web Vitals data
        const cwv = analyticsData.data.coreWebVitals;
        console.log('\n📊 Core Web Vitals:');
        Object.keys(cwv).forEach(metric => {
          const data = cwv[metric];
          if (data.values.length > 0) {
            console.log(`   ${metric}: ${Math.round(data.average)}ms (${data.values.length} measurements)`);
          }
        });
        
        console.log('\n🎉 SEO tracking is working perfectly!');
        console.log('💡 You can now check the admin dashboard to see the data.');
        
      } else {
        console.log('❌ Analytics endpoint failed:', analyticsResponse.status);
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ Failed to send test data:', response.status);
      console.log('Error:', errorData);
    }

  } catch (error) {
    console.error('💥 Error sending test data:', error.message);
  }
}

// Run the test
sendTestSEOData().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
