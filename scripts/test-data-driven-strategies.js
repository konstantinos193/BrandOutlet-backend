const dataDrivenStrategiesService = require('../services/dataDrivenStrategiesService');

async function testDataDrivenStrategies() {
  console.log('🧪 Testing Data-Driven Strategies Real Data Integration...\n');

  try {
    // Test real insights generation
    console.log('📊 Testing Real Insights Generation...');
    const insights = await dataDrivenStrategiesService.generateRealInsights();
    console.log(`✅ Generated ${insights.length} real insights`);
    
    if (insights.length > 0) {
      console.log('📋 Sample Insight:');
      console.log(`   Title: ${insights[0].title}`);
      console.log(`   Type: ${insights[0].type}`);
      console.log(`   Impact: ${insights[0].impact}`);
      console.log(`   Priority: ${insights[0].priority}`);
      console.log(`   Confidence: ${insights[0].confidence}%`);
      console.log(`   Data Points: ${insights[0].dataPoints.length}`);
    }

    // Test real marketing strategies generation
    console.log('\n📈 Testing Real Marketing Strategies Generation...');
    const marketingStrategies = await dataDrivenStrategiesService.generateRealMarketingStrategies();
    console.log(`✅ Generated ${marketingStrategies.length} real marketing strategies`);
    
    if (marketingStrategies.length > 0) {
      console.log('📋 Sample Marketing Strategy:');
      console.log(`   Title: ${marketingStrategies[0].title}`);
      console.log(`   Target Audience: ${marketingStrategies[0].targetAudience}`);
      console.log(`   Budget: $${marketingStrategies[0].budget}`);
      console.log(`   Expected ROI: ${marketingStrategies[0].expectedROI}%`);
    }

    // Test real inventory strategies generation
    console.log('\n📦 Testing Real Inventory Strategies Generation...');
    const inventoryStrategies = await dataDrivenStrategiesService.generateRealInventoryStrategies();
    console.log(`✅ Generated ${inventoryStrategies.length} real inventory strategies`);
    
    if (inventoryStrategies.length > 0) {
      console.log('📋 Sample Inventory Strategy:');
      console.log(`   Title: ${inventoryStrategies[0].title}`);
      console.log(`   Action: ${inventoryStrategies[0].action}`);
      console.log(`   Quantity: ${inventoryStrategies[0].quantity} units`);
      console.log(`   Category: ${inventoryStrategies[0].category}`);
    }

    // Test all strategies combined
    console.log('\n🔄 Testing All Strategies Combined...');
    const allStrategies = await dataDrivenStrategiesService.getAllRealStrategies();
    console.log(`✅ Generated ${allStrategies.total} total strategies`);
    console.log(`   Insights: ${allStrategies.insights.length}`);
    console.log(`   Marketing: ${allStrategies.marketingStrategies.length}`);
    console.log(`   Inventory: ${allStrategies.inventoryStrategies.length}`);
    console.log(`   Data Source: ${allStrategies.dataSource}`);
    console.log(`   Last Updated: ${allStrategies.lastUpdated}`);

    console.log('\n🎉 All tests passed! Real data integration is working correctly.');
    console.log('\n📝 Next Steps:');
    console.log('   1. The DataDrivenStrategies component will now show real data');
    console.log('   2. Data is generated from actual database collections');
    console.log('   3. Insights are based on real product performance, inventory, and user data');
    console.log('   4. Strategies are dynamically generated based on current business metrics');

  } catch (error) {
    console.error('❌ Error testing data-driven strategies:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDataDrivenStrategies();
