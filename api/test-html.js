const express = require('express');
const router = express.Router();

// Test route for HTML response
router.get('/', (req, res) => {
  const testData = {
    success: true,
    message: 'This is a test response with beautiful HTML formatting!',
    timestamp: new Date().toISOString(),
    dataSource: 'test-endpoint',
    data: {
      insights: [
        {
          id: 'test-1',
          title: 'Test Insight 1',
          content: 'This is a test insight to demonstrate the beautiful HTML formatting.',
          priority: 'high',
          confidence: 95,
          actionable: true,
          category: 'test',
          type: 'demo',
          metrics: {
            testMetric: 'testValue',
            anotherMetric: 42
          }
        },
        {
          id: 'test-2',
          title: 'Test Insight 2',
          content: 'Another test insight with different priority and confidence levels.',
          priority: 'medium',
          confidence: 78,
          actionable: true,
          category: 'test',
          type: 'demo',
          metrics: {
            demoMetric: 'demoValue',
            numberMetric: 123
          }
        }
      ],
      totalInsights: 2,
      testInfo: {
        endpoint: '/api/test-html',
        method: 'GET',
        features: [
          'Beautiful HTML formatting',
          'Interactive UI with Alpine.js',
          'Responsive design with Tailwind CSS',
          'Real-time data display',
          'Copy to clipboard functionality'
        ]
      }
    }
  };

  res.json(testData);
});

// Error test route
router.get('/error', (req, res) => {
  const errorData = {
    success: false,
    error: 'Test Error',
    message: 'This is a test error response to demonstrate error handling in HTML format.',
    timestamp: new Date().toISOString(),
    dataSource: 'test-error-endpoint',
    data: {
      errorCode: 'TEST_ERROR_001',
      errorDetails: {
        type: 'ValidationError',
        field: 'testField',
        message: 'This is a simulated validation error'
      }
    }
  };

  res.status(400).json(errorData);
});

module.exports = router;
