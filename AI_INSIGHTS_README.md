# AI Insights System - Real Data Integration

## Overview

The AI Insights system has been completely rebuilt to use **real data** from your database instead of mock/placeholder data. The system now provides actionable business insights based on actual product, inventory, traffic, and user data.

## 🚀 What's New

### ✅ Real Data Sources
- **Products Collection**: Real product data, verification rates, pricing
- **Variants Collection**: Actual inventory levels, stock distribution, pricing
- **Page Tracking**: Real traffic data, user sessions, geographic data
- **SEO Metrics**: Actual performance data, Core Web Vitals
- **User Preferences**: Real user demographic and preference data

### ✅ AI Integration
- **OpenAI GPT-3.5**: Primary AI for generating insights
- **Hugging Face**: Alternative AI service
- **Rule-Based Fallback**: Intelligent fallback when AI is unavailable

### ✅ Data Aggregation
- **Multi-Source Analysis**: Combines data from all collections
- **Real-Time Metrics**: Live data from database
- **Historical Analysis**: Trend analysis and growth patterns
- **Performance Monitoring**: SEO and page performance insights

## 🔧 Setup Instructions

### 1. Environment Configuration

Add these to your `.env` file:

```bash
# AI Configuration (Optional - system works without AI)
OPENAI_API_KEY=your-openai-api-key-here
HUGGINGFACE_API_KEY=your-huggingface-api-key-here
```

### 2. API Endpoints

#### Get Insights (Real Data + AI)
```bash
GET /api/insights?focus=all&useRealData=true&useAI=true
```

#### Get Insights (Real Data Only)
```bash
GET /api/insights?focus=sales&useRealData=true&useAI=false
```

#### Get Insights (Mock Data - Fallback)
```bash
GET /api/insights?focus=all&useRealData=false
```

### 3. Focus Areas

- `all` - All insights (default)
- `sales` - Sales and revenue focused
- `users` - User behavior and demographics
- `performance` - Site performance and SEO
- `inventory` - Stock and inventory management
- `marketing` - Marketing and geographic insights

## 📊 Data Sources

### Products Data
- Total products count
- Active vs inactive products
- Verification rates
- Price distribution
- Category and brand analysis
- Recent additions

### Inventory Data
- Stock levels and distribution
- Out-of-stock items
- Low stock alerts
- Size and color preferences
- Condition distribution
- Total inventory value

### Traffic Data
- Page views (today, yesterday, weekly)
- Unique sessions
- Growth rates
- Top pages and countries
- Device usage patterns
- Geographic distribution

### SEO Data
- Core Web Vitals (LCP, FID, CLS, etc.)
- Page load times
- Search queries
- Internal link clicks
- Performance metrics

### User Preferences
- Gender distribution
- Size preferences
- Regional preferences
- Demographics analysis

## 🤖 AI Features

### OpenAI Integration
- Uses GPT-3.5-turbo for intelligent analysis
- Generates contextual business insights
- Provides specific recommendations
- Analyzes patterns and trends

### Hugging Face Integration
- Alternative AI service
- Uses DialoGPT-medium model
- Fallback when OpenAI is unavailable

### Rule-Based Intelligence
- Smart fallback system
- Pattern recognition
- Threshold-based alerts
- Data-driven recommendations

## 📈 Insight Types

### High Priority Insights
- Low verification rates
- High out-of-stock rates
- Significant traffic declines
- Critical performance issues

### Medium Priority Insights
- Low conversion rates
- Mobile performance issues
- Geographic opportunities
- Content performance

### Low Priority Insights
- Inventory value analysis
- User demographics
- Brand portfolio analysis
- Growth opportunities

## 🔄 Caching System

- **5-minute cache** for real data insights
- **Separate cache keys** for AI vs rule-based
- **Automatic cache invalidation**
- **Performance optimization**

## 🛠️ Configuration Options

### API Parameters
- `focus`: Insight focus area
- `useRealData`: Use real data (true/false)
- `useAI`: Use AI enhancement (true/false)

### Environment Variables
- `OPENAI_API_KEY`: OpenAI API key
- `HUGGINGFACE_API_KEY`: Hugging Face API key
- `DATABASE_URL`: MongoDB connection
- `DATABASE_NAME`: Database name

## 📱 Frontend Integration

The frontend automatically:
- Uses real data by default
- Shows data source indicator
- Displays confidence scores
- Handles AI vs rule-based insights
- Provides error fallbacks

## 🚨 Error Handling

- **AI Service Failures**: Falls back to rule-based insights
- **Database Errors**: Returns cached data or error message
- **API Timeouts**: Graceful degradation
- **Missing Data**: Intelligent defaults

## 📊 Sample Insights

### Real Data Examples
```json
{
  "title": "Low Product Verification Rate",
  "content": "Only 23.5% of products are verified. This significantly impacts customer trust and conversion rates.",
  "priority": "high",
  "confidence": 95,
  "actionable": true,
  "category": "verification",
  "metrics": {
    "currentRate": "23.5%",
    "target": "80%",
    "impact": "High"
  }
}
```

### AI-Enhanced Examples
```json
{
  "title": "Inventory Optimization Opportunity",
  "content": "Your top-selling size (M) represents 35% of variants but only 20% of stock. Consider rebalancing inventory to match demand patterns.",
  "priority": "medium",
  "confidence": 88,
  "actionable": true,
  "category": "inventory"
}
```

## 🔧 Troubleshooting

### No Insights Generated
1. Check database connection
2. Verify collections have data
3. Check API logs for errors
4. Try rule-based mode first

### AI Not Working
1. Verify API keys are set
2. Check API key validity
3. Monitor rate limits
4. System will fallback automatically

### Low Confidence Scores
1. Ensure sufficient data in database
2. Check data quality and completeness
3. Verify recent data updates
4. Consider data collection improvements

## 🎯 Next Steps

1. **Add API Keys**: Set up OpenAI or Hugging Face API keys
2. **Seed Data**: Ensure database has sufficient data
3. **Monitor Performance**: Watch for insights quality
4. **Customize Rules**: Adjust thresholds for your business
5. **Expand Data Sources**: Add more collections as needed

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Test with different focus areas
4. Try rule-based mode first
5. Check database connectivity

The system is designed to be robust and will always provide some form of insights, even if AI services are unavailable.
