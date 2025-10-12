const { connectDB } = require('../config/database');
const cacheService = require('./cacheService');

class SeasonalAnalysisService {
  constructor() {
    this.db = null;
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async initialize() {
    if (!this.db) {
      this.db = await connectDB();
    }
  }

  // Get cached data or generate new data using Redis
  async getCachedData(key, generator, ttl = this.cacheTimeout) {
    return await cacheService.cacheWithTTL(key, generator, ttl);
  }

  // Generate seasonal trends data with forecasting
  async generateSeasonalTrends(options = {}) {
    await this.initialize();
    
    const {
      period = '12m',
      forecastPeriod = 30,
      showConfidence = true,
      category = 'all'
    } = options;

    const cacheKey = `seasonal-trends-${period}-${forecastPeriod}-${category}`;
    return this.getCachedData(cacheKey, async () => {
      // Generate historical data
      const historicalData = this.generateHistoricalData(period, category);
      
      // Calculate seasonal components
      const seasonalAnalysis = this.calculateSeasonalComponents(historicalData);
      
      // Generate forecast data
      const forecastData = this.generateForecastData(historicalData, forecastPeriod, seasonalAnalysis);
      
      // Calculate confidence intervals
      const confidenceData = showConfidence ? 
        this.calculateConfidenceIntervals(forecastData, historicalData) : null;
      
      // Calculate volatility metrics
      const volatility = this.calculateVolatility(historicalData);
      
      // Generate insights
      const insights = this.generateSeasonalInsights(seasonalAnalysis, forecastData, volatility);
      
      return {
        historical: historicalData,
        forecast: forecastData,
        confidence: confidenceData,
        seasonalAnalysis,
        volatility,
        insights,
        metadata: {
          period,
          forecastPeriod,
          category,
          generatedAt: new Date().toISOString(),
          dataPoints: historicalData.length + forecastData.length
        }
      };
    });
  }

  // Generate historical data based on period
  generateHistoricalData(period, category) {
    const data = [];
    const now = new Date();
    const months = period === '6m' ? 6 : period === '12m' ? 12 : 24;
    
    for (let i = months; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = this.generateMonthlyValue(date, category);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        quarter: Math.ceil((date.getMonth() + 1) / 3)
      });
    }
    
    return data;
  }

  // Generate monthly value with seasonal patterns
  generateMonthlyValue(date, category) {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Base value varies by category
    const baseValues = {
      'all': 10000,
      'sneakers': 15000,
      'clothing': 8000,
      'accessories': 5000,
      'bags': 12000
    };
    
    const baseValue = baseValues[category] || baseValues['all'];
    
    // Seasonal factors (holiday boost in Nov/Dec, summer dip in Jul/Aug)
    const seasonalFactors = [
      0.8,  // Jan - post-holiday dip
      0.7,  // Feb - winter low
      0.9,  // Mar - spring recovery
      1.0,  // Apr - stable
      1.1,  // May - spring growth
      1.2,  // Jun - summer start
      0.9,  // Jul - summer dip
      0.8,  // Aug - vacation season
      1.0,  // Sep - back to school
      1.1,  // Oct - fall growth
      1.4,  // Nov - holiday prep
      1.6   // Dec - holiday peak
    ];
    
    // Year-over-year growth (simulate 5-15% growth)
    const yearlyGrowth = 1 + (year - 2020) * 0.08;
    
    // Random variation (±10%)
    const randomFactor = 0.9 + Math.random() * 0.2;
    
    // Weekend factor (simulate lower weekend sales)
    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
    
    return baseValue * seasonalFactors[month] * yearlyGrowth * randomFactor * weekendFactor;
  }

  // Calculate seasonal components using simplified decomposition
  calculateSeasonalComponents(data) {
    if (data.length < 12) {
      return {
        trend: 0,
        seasonal: [],
        irregular: [],
        seasonalStrength: 0
      };
    }
    
    // Calculate moving average for trend
    const windowSize = Math.min(12, Math.floor(data.length / 2));
    const trend = this.calculateMovingAverage(data.map(d => d.value), windowSize);
    
    // Calculate seasonal indices
    const seasonalIndices = new Array(12).fill(0);
    const seasonalCounts = new Array(12).fill(0);
    
    data.forEach((point, index) => {
      const month = point.month - 1;
      const detrended = point.value - (trend[index] || point.value);
      seasonalIndices[month] += detrended;
      seasonalCounts[month]++;
    });
    
    // Average seasonal indices
    for (let i = 0; i < 12; i++) {
      if (seasonalCounts[i] > 0) {
        seasonalIndices[i] /= seasonalCounts[i];
      }
    }
    
    // Calculate seasonal strength
    const seasonalVariance = this.calculateVariance(seasonalIndices);
    const totalVariance = this.calculateVariance(data.map(d => d.value));
    const seasonalStrength = totalVariance > 0 ? seasonalVariance / totalVariance : 0;
    
    return {
      trend: trend[trend.length - 1] || 0,
      seasonal: seasonalIndices,
      irregular: data.map((point, index) => 
        point.value - (trend[index] || point.value) - seasonalIndices[point.month - 1]
      ),
      seasonalStrength: Math.min(1, seasonalStrength)
    };
  }

  // Generate forecast data
  generateForecastData(historicalData, forecastPeriod, seasonalAnalysis) {
    const forecast = [];
    const lastValue = historicalData[historicalData.length - 1].value;
    const trend = seasonalAnalysis.trend;
    const seasonal = seasonalAnalysis.seasonal;
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const month = forecastDate.getMonth();
      const seasonalFactor = seasonal[month] || 0;
      
      // Simple linear trend projection
      const trendProjection = trend * (i / 30); // Monthly trend
      
      // Add some randomness for realism
      const randomFactor = 0.9 + Math.random() * 0.2;
      
      const forecastValue = Math.max(0, (lastValue + trendProjection + seasonalFactor) * randomFactor);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        value: Math.round(forecastValue),
        month: month + 1,
        year: forecastDate.getFullYear(),
        quarter: Math.ceil((month + 1) / 3),
        isForecast: true
      });
    }
    
    return forecast;
  }

  // Calculate confidence intervals for forecast
  calculateConfidenceIntervals(forecastData, historicalData) {
    const historicalValues = historicalData.map(d => d.value);
    const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
    const variance = this.calculateVariance(historicalValues);
    const stdDev = Math.sqrt(variance);
    
    return forecastData.map((point, index) => {
      // Confidence decreases with forecast distance
      const confidenceFactor = Math.max(0.5, 1 - (index / forecastData.length) * 0.8);
      const margin = stdDev * confidenceFactor * 1.96; // 95% confidence
      
      return {
        date: point.date,
        lower: Math.max(0, Math.round(point.value - margin)),
        upper: Math.round(point.value + margin),
        confidence: confidenceFactor
      };
    });
  }

  // Calculate volatility metrics
  calculateVolatility(data) {
    if (data.length < 2) return { value: 0, level: 'low' };
    
    const values = data.map(d => d.value);
    const returns = [];
    
    for (let i = 1; i < values.length; i++) {
      const returnValue = (values[i] - values[i - 1]) / values[i - 1];
      returns.push(returnValue);
    }
    
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100; // As percentage
    
    let level = 'low';
    if (volatility > 20) level = 'high';
    else if (volatility > 10) level = 'medium';
    
    return {
      value: Math.round(volatility * 100) / 100,
      level,
      description: this.getVolatilityDescription(level)
    };
  }

  // Generate seasonal insights
  generateSeasonalInsights(seasonalAnalysis, forecastData, volatility) {
    const insights = [];
    
    // Peak season insight
    const peakMonth = seasonalAnalysis.seasonal.indexOf(Math.max(...seasonalAnalysis.seasonal));
    const peakMonthName = new Date(2024, peakMonth, 1).toLocaleString('default', { month: 'long' });
    
    insights.push({
      type: 'peak_season',
      title: `Peak Season: ${peakMonthName}`,
      description: `${peakMonthName} typically shows the highest sales performance. Consider increasing inventory and marketing efforts during this period.`,
      priority: 'high',
      impact: 'high',
      actionable: true
    });
    
    // Low season insight
    const lowMonth = seasonalAnalysis.seasonal.indexOf(Math.min(...seasonalAnalysis.seasonal));
    const lowMonthName = new Date(2024, lowMonth, 1).toLocaleString('default', { month: 'long' });
    
    insights.push({
      type: 'low_season',
      title: `Low Season: ${lowMonthName}`,
      description: `${lowMonthName} typically shows lower sales. Consider promotional campaigns or inventory clearance during this period.`,
      priority: 'medium',
      impact: 'medium',
      actionable: true
    });
    
    // Volatility insight
    if (volatility.level === 'high') {
      insights.push({
        type: 'volatility',
        title: 'High Sales Volatility Detected',
        description: `Sales show high volatility (${volatility.value}%). Consider implementing more stable pricing and inventory strategies.`,
        priority: 'high',
        impact: 'high',
        actionable: true
      });
    }
    
    // Forecast trend insight
    const firstForecast = forecastData[0]?.value || 0;
    const lastForecast = forecastData[forecastData.length - 1]?.value || 0;
    const forecastTrend = lastForecast > firstForecast ? 'increasing' : 'decreasing';
    
    insights.push({
      type: 'forecast_trend',
      title: `Forecast Trend: ${forecastTrend.charAt(0).toUpperCase() + forecastTrend.slice(1)}`,
      description: `Based on seasonal patterns, sales are forecasted to ${forecastTrend} over the next ${forecastData.length} days.`,
      priority: 'medium',
      impact: 'medium',
      actionable: true
    });
    
    return insights;
  }

  // Helper methods
  calculateMovingAverage(data, windowSize) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const end = i + 1;
      const window = data.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      result.push(average);
    }
    return result;
  }

  calculateVariance(data) {
    if (data.length < 2) return 0;
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  }

  getVolatilityDescription(level) {
    const descriptions = {
      low: 'Stable sales with minimal fluctuations',
      medium: 'Moderate sales fluctuations within normal range',
      high: 'High sales volatility requiring attention'
    };
    return descriptions[level] || descriptions.low;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new SeasonalAnalysisService();
