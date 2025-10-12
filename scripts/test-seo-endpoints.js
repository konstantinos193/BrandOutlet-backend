#!/usr/bin/env node

/**
 * Simple test script to verify SEO endpoints are working
 * This tests the API endpoints without database dependencies
 */

const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';

async function testSEPEndpoints() {
  console.log('🧪 Testing SEO API Endpoints...\n');
  console.log(`🌐 Testing against: ${baseUrl}\n`);

  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/seo/health`,
      method: 'GET'
    },
    {
      name: 'Analytics (7d)',
      url: `${baseUrl}/api/seo/analytics?timeframe=7d`,
      method: 'GET'
    },
    {
      name: 'Core Web Vitals',
      url: `${baseUrl}/api/seo/core-web-vitals?timeframe=7d`,
      method: 'GET'
    },
    {
      name: 'Performance Metrics',
      url: `${baseUrl}/api/seo/performance?timeframe=7d`,
      method: 'GET'
    },
    {
      name: 'Engagement Metrics',
      url: `${baseUrl}/api/seo/engagement?timeframe=7d`,
      method: 'GET'
    },
    {
      name: 'Insights',
      url: `${baseUrl}/api/seo/insights?timeframe=7d`,
      method: 'GET'
    },
    {
      name: 'Recommendations',
      url: `${baseUrl}/api/seo/recommendations?timeframe=7d`,
      method: 'GET'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing ${test.name}...`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name} - Status: ${response.status}`);
        
        if (data.success !== undefined) {
          console.log(`   Success: ${data.success}`);
        }
        if (data.data) {
          console.log(`   Data keys: ${Object.keys(data.data).join(', ')}`);
        }
        passed++;
      } else {
        console.log(`❌ ${test.name} - Status: ${response.status}`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All SEO endpoints are working correctly!');
    console.log('\n✨ SEO tracking is ready to collect real data from your frontend.');
  } else {
    console.log('\n⚠️  Some endpoints failed. Check the backend logs for details.');
  }
}

// Run the tests
testSEPEndpoints().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
