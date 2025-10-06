const { connectDB } = require('../config/database');

// Simple Linear Regression class for forecasting
class SimpleLinearRegression {
  constructor(xValues, yValues) {
    this.xValues = xValues;
    this.yValues = yValues;
    this.slope = this.calculateSlope();
    this.intercept = this.calculateIntercept();
  }

  calculateSlope() {
    const n = this.xValues.length;
    const sumX = this.xValues.reduce((sum, x) => sum + x, 0);
    const sumY = this.yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = this.xValues.reduce((sum, x, i) => sum + x * this.yValues[i], 0);
    const sumXX = this.xValues.reduce((sum, x) => sum + x * x, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  calculateIntercept() {
    const n = this.xValues.length;
    const sumX = this.xValues.reduce((sum, x) => sum + x, 0);
    const sumY = this.yValues.reduce((sum, y) => sum + y, 0);
    
    return (sumY - this.slope * sumX) / n;
  }

  predict(x) {
    return this.slope * x + this.intercept;
  }
}

class ForecastingService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    if (!this.db) {
      this.db = await connectDB();
    }
  }

  // Calculate seasonal component
  calculateSeasonalComponent(dateStr, value) {
    const date = new Date(dateStr);
    const month = date.getMonth();
    const dayOfWeek = date.getDay();
    
    // Seasonal patterns based on month
    const monthlyFactor = [0.8, 0.7, 0.9, 1.1, 1.2, 1.3, 1.1, 1.0, 0.9, 1.1, 1.4, 1.6][month];
    const weeklyFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0;
    
    return value * monthlyFactor * weeklyFactor;
  }

  // Calculate confidence interval
  calculateConfidence(index, totalLength) {
    const distance = Math.abs(index - totalLength + 1);
    return Math.max(0.5, 1 - (distance / totalLength) * 0.8);
  }

  // Calculate volatility
  calculateVolatility(values) {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance) / mean * 100;
  }

  // Generate peak alerts
  generatePeakAlerts(data, threshold = 1.5) {
    if (!data || data.length < 3) return [];

    const alerts = [];
    const values = data.map(item => item.actual || item.predicted || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    for (let i = 1; i < data.length - 1; i++) {
      const current = values[i];
      const previous = values[i - 1];
      const next = values[i + 1];
      
      // Peak detection: current value is significantly higher than neighbors
      if (current > previous * threshold && current > next * threshold && current > mean + stdDev) {
        alerts.push({
          date: data[i].date,
          value: current,
          type: 'peak',
          severity: current > mean + 2 * stdDev ? 'high' : 'medium',
          message: `Peak detected: ${current.toLocaleString()} (${((current / mean - 1) * 100).toFixed(1)}% above average)`
        });
      }
      
      // Trough detection: current value is significantly lower than neighbors
      if (current < previous / threshold && current < next / threshold && current < mean - stdDev) {
        alerts.push({
          date: data[i].date,
          value: current,
          type: 'trough',
          severity: current < mean - 2 * stdDev ? 'high' : 'medium',
          message: `Trough detected: ${current.toLocaleString()} (${((1 - current / mean) * 100).toFixed(1)}% below average)`
        });
      }
    }
    
    return alerts;
  }

  // Generate comprehensive forecasting data
  async generateForecastData(historicalData, forecastPeriod = 30) {
    await this.initialize();
    
    if (!historicalData || historicalData.length < 2) {
      return {
        forecastData: historicalData || [],
        peakAlerts: [],
        volatility: 0,
        trend: 'stable',
        confidence: 0
      };
    }

    // Sort data by date
    const sortedData = [...historicalData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const xValues = sortedData.map((item, index) => index);
    const yValues = sortedData.map((item) => item.actual || item.value || 0);
    
    // Create linear regression model
    const regression = new SimpleLinearRegression(xValues, yValues);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(yValues);
    
    // Determine trend
    const trend = regression.slope > 0.1 ? 'increasing' : regression.slope < -0.1 ? 'decreasing' : 'stable';
    
    // Generate predictions for historical data
    const historicalPredictions = sortedData.map((item, index) => {
      const predicted = regression.predict(index);
      const seasonal = this.calculateSeasonalComponent(item.date, item.actual || item.value || 0);
      const confidence = this.calculateConfidence(index, sortedData.length);
      
      return {
        ...item,
        predicted: Math.max(0, predicted),
        seasonal: seasonal,
        trend: predicted,
        confidence: confidence
      };
    });

    // Generate future predictions
    const futurePredictions = [];
    const lastDate = new Date(sortedData[sortedData.length - 1].date);
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      
      const futureIndex = sortedData.length + i - 1;
      const predicted = regression.predict(futureIndex);
      const seasonal = this.calculateSeasonalComponent(futureDate.toISOString().split('T')[0], predicted);
      const confidence = this.calculateConfidence(futureIndex, sortedData.length);
      
      futurePredictions.push({
        date: futureDate.toISOString().split('T')[0],
        actual: null,
        predicted: Math.max(0, predicted),
        seasonal: seasonal,
        trend: predicted,
        confidence: confidence,
        isForecast: true
      });
    }

    const forecastData = [...historicalPredictions, ...futurePredictions];
    const peakAlerts = this.generatePeakAlerts(forecastData);
    
    return {
      forecastData,
      peakAlerts,
      volatility,
      trend,
      confidence: Math.max(0, Math.min(1, 1 - (volatility / 100))),
      regressionStats: {
        slope: regression.slope,
        intercept: regression.intercept,
        rSquared: this.calculateRSquared(yValues, historicalPredictions.map(p => p.predicted))
      }
    };
  }

  // Calculate R-squared for regression quality
  calculateRSquared(actual, predicted) {
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    const ssTot = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    
    return 1 - (ssRes / ssTot);
  }

  // Generate seasonal trends with advanced analysis
  async generateSeasonalTrendsWithForecast(days = 365, forecastDays = 30) {
    await this.initialize();
    
    // Generate historical seasonal data
    const historicalData = this.generateSeasonalHistoricalData(days);
    
    // Generate forecast
    const forecastResult = await this.generateForecastData(historicalData, forecastDays);
    
    return {
      ...forecastResult,
      seasonalAnalysis: this.analyzeSeasonalPatterns(historicalData),
      recommendations: this.generateSeasonalRecommendations(forecastResult)
    };
  }

  // Generate historical seasonal data
  generateSeasonalHistoricalData(days) {
    const data = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Base trend with some growth
      const baseValue = 1000 + (i * 2);
      
      // Seasonal patterns
      const month = date.getMonth();
      const dayOfWeek = date.getDay();
      
      // Monthly seasonal factors
      const monthlyFactors = [0.8, 0.7, 0.9, 1.1, 1.2, 1.3, 1.1, 1.0, 0.9, 1.1, 1.4, 1.6];
      const monthlyFactor = monthlyFactors[month];
      
      // Weekly patterns (weekends lower)
      const weeklyFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0;
      
      // Holiday boosts
      let holidayFactor = 1.0;
      if (month === 10 && date.getDate() >= 20) holidayFactor = 1.5; // Black Friday
      if (month === 11) holidayFactor = 1.8; // December
      if (month === 0 && date.getDate() <= 5) holidayFactor = 1.3; // New Year
      if (month === 1 && date.getDate() >= 10 && date.getDate() <= 18) holidayFactor = 1.2; // Valentine's
      if (month === 4 && date.getDate() >= 10 && date.getDate() <= 20) holidayFactor = 1.1; // Mother's Day
      
      // Random noise
      const noise = (Math.random() - 0.5) * 0.2;
      
      const actualValue = Math.round(baseValue * monthlyFactor * weeklyFactor * holidayFactor * (1 + noise));
      
      data.push({
        date: date.toISOString().split('T')[0],
        actual: actualValue
      });
    }
    
    return data;
  }

  // Analyze seasonal patterns
  analyzeSeasonalPatterns(data) {
    const monthlyTotals = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);
    
    data.forEach(item => {
      const month = new Date(item.date).getMonth();
      monthlyTotals[month] += item.actual;
      monthlyCounts[month]++;
    });
    
    const monthlyAverages = monthlyTotals.map((total, index) => 
      monthlyCounts[index] > 0 ? total / monthlyCounts[index] : 0
    );
    
    const overallAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;
    
    return {
      monthlyAverages,
      overallAverage,
      seasonalFactors: monthlyAverages.map(avg => avg / overallAverage),
      peakMonth: monthlyAverages.indexOf(Math.max(...monthlyAverages)),
      lowMonth: monthlyAverages.indexOf(Math.min(...monthlyAverages))
    };
  }

  // Generate seasonal recommendations
  generateSeasonalRecommendations(forecastResult) {
    const recommendations = [];
    
    if (forecastResult.trend === 'increasing') {
      recommendations.push({
        type: 'opportunity',
        title: 'Growth Trend Detected',
        description: 'Data shows an upward trend. Consider increasing inventory and marketing efforts.',
        priority: 'high'
      });
    } else if (forecastResult.trend === 'decreasing') {
      recommendations.push({
        type: 'warning',
        title: 'Declining Trend',
        description: 'Data shows a downward trend. Consider reviewing strategy and reducing costs.',
        priority: 'high'
      });
    }
    
    if (forecastResult.volatility > 50) {
      recommendations.push({
        type: 'warning',
        title: 'High Volatility',
        description: 'Data shows high volatility. Consider implementing risk management strategies.',
        priority: 'medium'
      });
    }
    
    if (forecastResult.peakAlerts.length > 0) {
      const highPeaks = forecastResult.peakAlerts.filter(alert => alert.severity === 'high');
      if (highPeaks.length > 0) {
        recommendations.push({
          type: 'opportunity',
          title: 'Peak Opportunities',
          description: `${highPeaks.length} high-value peaks detected. Consider capitalizing on these periods.`,
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }
}

module.exports = new ForecastingService();
