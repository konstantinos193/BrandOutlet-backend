const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// Helper function to get payment transactions
const getPaymentTransactions = async () => {
  try {
    // Mock data for now - replace with actual database queries
    const mockPayments = [
      {
        id: '1',
        orderId: '1',
        amount: 172.00,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'stripe',
        transactionId: 'pi_1234567890abcdef',
        processedAt: new Date('2024-01-15T10:35:00Z'),
        fees: 5.16,
        netAmount: 166.84
      },
      {
        id: '2',
        orderId: '2',
        amount: 206.40,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'paypal',
        transactionId: 'PAYPAL-1234567890',
        processedAt: new Date('2024-01-14T14:25:00Z'),
        fees: 6.19,
        netAmount: 200.21
      },
      {
        id: '3',
        orderId: '3',
        amount: 447.00,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'stripe',
        transactionId: 'pi_0987654321fedcba',
        processedAt: new Date('2024-01-10T16:50:00Z'),
        fees: 13.41,
        netAmount: 433.59
      },
      {
        id: '4',
        orderId: '4',
        amount: 89.99,
        currency: 'USD',
        status: 'failed',
        paymentMethod: 'stripe',
        transactionId: 'pi_failed123456789',
        processedAt: new Date('2024-01-12T09:15:00Z'),
        fees: 0,
        netAmount: 0
      },
      {
        id: '5',
        orderId: '5',
        amount: 250.00,
        currency: 'USD',
        status: 'refunded',
        paymentMethod: 'stripe',
        transactionId: 'pi_refunded123456',
        processedAt: new Date('2024-01-08T11:20:00Z'),
        fees: 7.50,
        netAmount: 242.50
      }
    ];

    return mockPayments;
  } catch (error) {
    console.error('Error fetching payments:', error);
    throw error;
  }
};

// Get all payment transactions
router.get('/', async (req, res) => {
  try {
    const payments = await getPaymentTransactions();
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payments = await getPaymentTransactions();
    const payment = payments.find(p => p.id === req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({ payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

// Process payment refund
router.post('/:id/refund', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid refund amount' });
    }
    
    // In a real implementation, process the refund with the payment provider
    console.log(`Processing refund for payment ${req.params.id}: $${amount} - ${reason}`);
    
    res.json({ 
      success: true, 
      message: 'Refund processed successfully',
      refundId: `ref_${Date.now()}`
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Get payment reconciliation data
router.get('/reconciliation/summary', async (req, res) => {
  try {
    const payments = await getPaymentTransactions();
    
    const summary = {
      totalTransactions: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalFees: payments.reduce((sum, p) => sum + p.fees, 0),
      totalNetAmount: payments.reduce((sum, p) => sum + p.netAmount, 0),
      byStatus: payments.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
      byPaymentMethod: payments.reduce((acc, p) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
        return acc;
      }, {})
    };
    
    res.json({ summary });
  } catch (error) {
    console.error('Error fetching reconciliation summary:', error);
    res.status(500).json({ error: 'Failed to fetch reconciliation summary' });
  }
});

// Export payment data
router.post('/export', async (req, res) => {
  try {
    const { format, dateRange } = req.body;
    const validFormats = ['csv', 'excel', 'pdf'];
    
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: 'Invalid export format' });
    }
    
    const payments = await getPaymentTransactions();
    
    // Filter by date range if provided
    let filteredPayments = payments;
    if (dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filteredPayments = payments.filter(p => new Date(p.processedAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filteredPayments = payments.filter(p => new Date(p.processedAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filteredPayments = payments.filter(p => new Date(p.processedAt) >= filterDate);
          break;
      }
    }
    
    const exportData = {
      payments: filteredPayments.map(payment => ({
        transactionId: payment.transactionId,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        fees: payment.fees,
        netAmount: payment.netAmount,
        processedAt: payment.processedAt
      }))
    };
    
    if (format === 'csv') {
      // Generate CSV
      const csvContent = [
        'Transaction ID,Order ID,Amount,Currency,Status,Payment Method,Fees,Net Amount,Processed At',
        ...exportData.payments.map(payment => 
          `${payment.transactionId},${payment.orderId},${payment.amount},${payment.currency},${payment.status},${payment.paymentMethod},${payment.fees},${payment.netAmount},${payment.processedAt}`
        ).join('\n')
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
      res.send(csvContent);
    } else if (format === 'pdf') {
      // Mock PDF generation
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.pdf');
      res.send('PDF content would be generated here');
    } else {
      // Mock Excel generation
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.xlsx');
      res.send('Excel content would be generated here');
    }
  } catch (error) {
    console.error('Error exporting payments:', error);
    res.status(500).json({ error: 'Failed to export payments' });
  }
});

module.exports = router;
