const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// Helper function to get refund requests
const getRefundRequests = async () => {
  try {
    // Mock data for now - replace with actual database queries
    const mockRefunds = [
      {
        id: '1',
        orderId: '1',
        amount: 172.00,
        reason: 'Customer changed mind',
        status: 'pending',
        requestedAt: new Date('2024-01-16T10:30:00Z'),
        notes: 'Customer requested refund within 24 hours of purchase'
      },
      {
        id: '2',
        orderId: '2',
        amount: 206.40,
        reason: 'Product damaged during shipping',
        status: 'approved',
        requestedAt: new Date('2024-01-17T14:20:00Z'),
        processedAt: new Date('2024-01-17T15:45:00Z'),
        processedBy: 'admin@brandoutlet.com',
        notes: 'Approved due to shipping damage. Customer provided photos.'
      },
      {
        id: '3',
        orderId: '3',
        amount: 100.00,
        reason: 'Partial refund - size issue',
        status: 'processed',
        requestedAt: new Date('2024-01-18T09:15:00Z'),
        processedAt: new Date('2024-01-18T10:30:00Z'),
        processedBy: 'admin@brandoutlet.com',
        notes: 'Partial refund approved for size discrepancy'
      },
      {
        id: '4',
        orderId: '4',
        amount: 89.99,
        reason: 'Item not as described',
        status: 'rejected',
        requestedAt: new Date('2024-01-19T11:45:00Z'),
        processedAt: new Date('2024-01-19T13:20:00Z'),
        processedBy: 'admin@brandoutlet.com',
        notes: 'Rejected - customer did not provide sufficient evidence'
      },
      {
        id: '5',
        orderId: '5',
        amount: 250.00,
        reason: 'Customer not satisfied',
        status: 'pending',
        requestedAt: new Date('2024-01-20T16:30:00Z'),
        notes: 'Customer claims product quality is not as expected'
      }
    ];

    return mockRefunds;
  } catch (error) {
    console.error('Error fetching refunds:', error);
    throw error;
  }
};

// Get all refund requests
router.get('/', async (req, res) => {
  try {
    const refunds = await getRefundRequests();
    res.json({ refunds });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

// Get refund by ID
router.get('/:id', async (req, res) => {
  try {
    const refunds = await getRefundRequests();
    const refund = refunds.find(r => r.id === req.params.id);
    
    if (!refund) {
      return res.status(404).json({ error: 'Refund not found' });
    }
    
    res.json({ refund });
  } catch (error) {
    console.error('Error fetching refund:', error);
    res.status(500).json({ error: 'Failed to fetch refund' });
  }
});

// Process refund (approve/reject)
router.put('/:id', async (req, res) => {
  try {
    const { action, notes } = req.body;
    const validActions = ['approve', 'reject'];
    
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approve or reject' });
    }
    
    // In a real implementation, update the database and process the refund
    console.log(`Processing refund ${req.params.id}: ${action} - ${notes || 'No notes'}`);
    
    res.json({ 
      success: true, 
      message: `Refund ${action}d successfully`,
      processedAt: new Date().toISOString(),
      processedBy: 'admin@brandoutlet.com'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// Create new refund request
router.post('/', async (req, res) => {
  try {
    const { orderId, amount, reason, notes } = req.body;
    
    if (!orderId || !amount || !reason) {
      return res.status(400).json({ error: 'Missing required fields: orderId, amount, reason' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid refund amount' });
    }
    
    // In a real implementation, create the refund request in the database
    const refundId = `ref_${Date.now()}`;
    console.log(`Creating refund request ${refundId} for order ${orderId}: $${amount} - ${reason}`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Refund request created successfully',
      refundId,
      refund: {
        id: refundId,
        orderId,
        amount,
        reason,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        notes
      }
    });
  } catch (error) {
    console.error('Error creating refund request:', error);
    res.status(500).json({ error: 'Failed to create refund request' });
  }
});

// Get refund statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const refunds = await getRefundRequests();
    
    const summary = {
      totalRefunds: refunds.length,
      totalAmount: refunds.reduce((sum, r) => sum + r.amount, 0),
      pendingAmount: refunds
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.amount, 0),
      approvedAmount: refunds
        .filter(r => r.status === 'approved' || r.status === 'processed')
        .reduce((sum, r) => sum + r.amount, 0),
      rejectedAmount: refunds
        .filter(r => r.status === 'rejected')
        .reduce((sum, r) => sum + r.amount, 0),
      byStatus: refunds.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {}),
      byReason: refunds.reduce((acc, r) => {
        acc[r.reason] = (acc[r.reason] || 0) + 1;
        return acc;
      }, {}),
      averageProcessingTime: calculateAverageProcessingTime(refunds)
    };
    
    res.json({ summary });
  } catch (error) {
    console.error('Error fetching refund statistics:', error);
    res.status(500).json({ error: 'Failed to fetch refund statistics' });
  }
});

// Helper function to calculate average processing time
const calculateAverageProcessingTime = (refunds) => {
  const processedRefunds = refunds.filter(r => r.processedAt);
  
  if (processedRefunds.length === 0) return 0;
  
  const totalTime = processedRefunds.reduce((sum, r) => {
    const requested = new Date(r.requestedAt);
    const processed = new Date(r.processedAt);
    return sum + (processed - requested);
  }, 0);
  
  return Math.round(totalTime / processedRefunds.length / (1000 * 60 * 60)); // Hours
};

// Export refund data
router.post('/export', async (req, res) => {
  try {
    const { format, status, dateRange } = req.body;
    const validFormats = ['csv', 'excel', 'pdf'];
    
    if (!validFormats.includes(format)) {
      return res.status(400).json({ error: 'Invalid export format' });
    }
    
    let refunds = await getRefundRequests();
    
    // Filter by status if provided
    if (status) {
      refunds = refunds.filter(r => r.status === status);
    }
    
    // Filter by date range if provided
    if (dateRange) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          refunds = refunds.filter(r => new Date(r.requestedAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          refunds = refunds.filter(r => new Date(r.requestedAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          refunds = refunds.filter(r => new Date(r.requestedAt) >= filterDate);
          break;
      }
    }
    
    const exportData = {
      refunds: refunds.map(refund => ({
        id: refund.id,
        orderId: refund.orderId,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        requestedAt: refund.requestedAt,
        processedAt: refund.processedAt,
        processedBy: refund.processedBy,
        notes: refund.notes
      }))
    };
    
    if (format === 'csv') {
      // Generate CSV
      const csvContent = [
        'Refund ID,Order ID,Amount,Reason,Status,Requested At,Processed At,Processed By,Notes',
        ...exportData.refunds.map(refund => 
          `${refund.id},${refund.orderId},${refund.amount},"${refund.reason}",${refund.status},${refund.requestedAt},${refund.processedAt || ''},${refund.processedBy || ''},"${refund.notes || ''}"`
        ).join('\n')
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=refunds.csv');
      res.send(csvContent);
    } else if (format === 'pdf') {
      // Mock PDF generation
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=refunds.pdf');
      res.send('PDF content would be generated here');
    } else {
      // Mock Excel generation
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=refunds.xlsx');
      res.send('Excel content would be generated here');
    }
  } catch (error) {
    console.error('Error exporting refunds:', error);
    res.status(500).json({ error: 'Failed to export refunds' });
  }
});

module.exports = router;
