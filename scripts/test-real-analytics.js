const analyticsDataService = require('../services/analyticsDataService');

async function testRealAnalytics() {
  try {
    console.log('🧪 Testing Real Analytics Data...\n');

    // Test the unified analytics data
    const analyticsData = await analyticsDataService.generateUnifiedAnalyticsData();
    
    console.log('✅ Analytics Data Retrieved Successfully!');
    console.log('📊 Data Summary:');
    console.log(`   - Revenue Data Points: ${analyticsData.revenue.length}`);
    console.log(`   - Sales Distribution Categories: ${analyticsData.salesDistribution.length}`);
    console.log(`   - User Growth Data Points: ${analyticsData.userGrowth.length}`);
    console.log(`   - Performance Metrics Points: ${analyticsData.performanceMetrics.length}`);
    console.log(`   - User Funnel Steps: ${analyticsData.userFunnel.length}`);
    console.log(`   - Cohort Analysis Cohorts: ${analyticsData.cohortAnalysis.length}`);
    console.log(`   - LTV/CAC Data Points: ${analyticsData.ltvCacMetrics.length}`);
    console.log(`   - Geographic Sales Locations: ${analyticsData.geographicSales.length}`);
    console.log(`   - Seasonal Trends Points: ${analyticsData.seasonalTrends.length}`);
    
    // Show sample revenue data
    if (analyticsData.revenue.length > 0) {
      console.log('\n💰 Sample Revenue Data (Last 5 days):');
      const recentRevenue = analyticsData.revenue.slice(-5);
      recentRevenue.forEach(day => {
        console.log(`   ${day.date}: $${day.revenue.toLocaleString()} (${day.sales} sales, ${day.users} users)`);
      });
    }
    
    // Show sample sales distribution
    if (analyticsData.salesDistribution.length > 0) {
      console.log('\n📈 Sales Distribution:');
      analyticsData.salesDistribution.forEach(category => {
        console.log(`   ${category.name}: ${category.value} units`);
      });
    }
    
    // Show sample user growth
    if (analyticsData.userGrowth.length > 0) {
      console.log('\n👥 User Growth (Last 5 days):');
      const recentUsers = analyticsData.userGrowth.slice(-5);
      recentUsers.forEach(day => {
        console.log(`   ${day.period}: ${day.newUsers} new, ${day.activeUsers} active`);
      });
    }
    
    // Show sample performance metrics
    if (analyticsData.performanceMetrics.length > 0) {
      console.log('\n⚡ Performance Metrics (Last 5 days):');
      const recentPerf = analyticsData.performanceMetrics.slice(-5);
      recentPerf.forEach(day => {
        console.log(`   ${day.date}: ${day.conversionRate.toFixed(2)}% conversion, ${day.bounceRate.toFixed(1)}% bounce`);
      });
    }
    
    console.log('\n🎉 Real Analytics Data Test Completed Successfully!');
    console.log(`📅 Last Updated: ${analyticsData.lastUpdated}`);
    
  } catch (error) {
    console.error('❌ Error testing real analytics data:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testRealAnalytics().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
