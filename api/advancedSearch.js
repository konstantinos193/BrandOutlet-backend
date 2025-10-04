const express = require('express');
const router = express.Router();

// Mock data for demonstration - in production, this would connect to Elasticsearch/Algolia
const mockProducts = [
  {
    id: '1',
    name: 'Nike Air Jordan 1 Retro High',
    brand: 'Nike',
    category: 'Sneakers',
    price: 180,
    status: 'approved',
    condition: 'New',
    featured: true,
    images: ['/api/placeholder/300/300?text=Nike+Jordan+1'],
    description: 'Classic Air Jordan 1 in Chicago colorway',
    submittedAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    seller: {
      id: 'seller1',
      name: 'John Doe',
      email: 'john@example.com'
    },
    views: 150,
    likes: 25
  },
  {
    id: '2',
    name: 'Supreme Box Logo Hoodie',
    brand: 'Supreme',
    category: 'Clothing',
    price: 450,
    status: 'pending',
    condition: 'Like New',
    featured: false,
    images: ['/api/placeholder/300/300?text=Supreme+Hoodie'],
    description: 'Rare Supreme Box Logo hoodie from FW19',
    submittedAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    seller: {
      id: 'seller2',
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    views: 89,
    likes: 12
  },
  // Add more mock products...
];

// Search suggestions endpoint
router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const query = q.toLowerCase();
    const suggestions = [];

    // Brand suggestions
    const brands = [...new Set(mockProducts.map(p => p.brand))];
    brands.forEach(brand => {
      if (brand.toLowerCase().includes(query)) {
        suggestions.push({
          id: `brand-${brand}`,
          text: brand,
          type: 'brand',
          count: mockProducts.filter(p => p.brand === brand).length
        });
      }
    });

    // Category suggestions
    const categories = [...new Set(mockProducts.map(p => p.category))];
    categories.forEach(category => {
      if (category.toLowerCase().includes(query)) {
        suggestions.push({
          id: `category-${category}`,
          text: category,
          type: 'category',
          count: mockProducts.filter(p => p.category === category).length
        });
      }
    });

    // Product name suggestions
    mockProducts.forEach(product => {
      if (product.name.toLowerCase().includes(query)) {
        suggestions.push({
          id: `product-${product.id}`,
          text: product.name,
          type: 'product',
          count: 1
        });
      }
    });

    // Seller suggestions
    const sellers = [...new Set(mockProducts.map(p => p.seller.name))];
    sellers.forEach(seller => {
      if (seller.toLowerCase().includes(query)) {
        suggestions.push({
          id: `seller-${seller}`,
          text: seller,
          type: 'seller',
          count: mockProducts.filter(p => p.seller.name === seller).length
        });
      }
    });

    // Sort by relevance and limit results
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.text.toLowerCase() === query;
        const bExact = b.text.toLowerCase() === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by count
        return b.count - a.count;
      })
      .slice(0, parseInt(limit));

    res.json({ suggestions: sortedSuggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Advanced search endpoint
router.get('/products', async (req, res) => {
  try {
    const {
      q = '',
      brands = '',
      categories = '',
      minPrice = 0,
      maxPrice = 10000,
      status = '',
      conditions = '',
      sellers = '',
      featured,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;

    let filteredProducts = [...mockProducts];

    // Text search
    if (q) {
      const query = q.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.seller.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    // Brand filter
    if (brands) {
      const brandList = brands.split(',').map(b => b.trim());
      filteredProducts = filteredProducts.filter(product =>
        brandList.includes(product.brand)
      );
    }

    // Category filter
    if (categories) {
      const categoryList = categories.split(',').map(c => c.trim());
      filteredProducts = filteredProducts.filter(product =>
        categoryList.includes(product.category)
      );
    }

    // Price range filter
    const min = parseInt(minPrice);
    const max = parseInt(maxPrice);
    filteredProducts = filteredProducts.filter(product =>
      product.price >= min && product.price <= max
    );

    // Status filter
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      filteredProducts = filteredProducts.filter(product =>
        statusList.includes(product.status)
      );
    }

    // Condition filter
    if (conditions) {
      const conditionList = conditions.split(',').map(c => c.trim());
      filteredProducts = filteredProducts.filter(product =>
        conditionList.includes(product.condition)
      );
    }

    // Seller filter
    if (sellers) {
      const sellerList = sellers.split(',').map(s => s.trim());
      filteredProducts = filteredProducts.filter(product =>
        sellerList.includes(product.seller.name)
      );
    }

    // Featured filter
    if (featured !== undefined) {
      const isFeatured = featured === 'true';
      filteredProducts = filteredProducts.filter(product =>
        product.featured === isFeatured
      );
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredProducts = filteredProducts.filter(product =>
        new Date(product.submittedAt) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredProducts = filteredProducts.filter(product =>
        new Date(product.submittedAt) <= toDate
      );
    }

    // Calculate search score for relevance sorting
    if (sortBy === 'relevance' && q) {
      filteredProducts.forEach(product => {
        let score = 0;
        const query = q.toLowerCase();
        
        // Exact name match gets highest score
        if (product.name.toLowerCase() === query) score += 100;
        else if (product.name.toLowerCase().includes(query)) score += 50;
        
        // Brand match
        if (product.brand.toLowerCase().includes(query)) score += 30;
        
        // Category match
        if (product.category.toLowerCase().includes(query)) score += 20;
        
        // Description match
        if (product.description.toLowerCase().includes(query)) score += 10;
        
        product.searchScore = score;
      });
    }

    // Sort products
    filteredProducts.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'relevance':
          aValue = a.searchScore || 0;
          bValue = b.searchScore || 0;
          break;
        case 'submittedAt':
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'brand':
          aValue = a.brand.toLowerCase();
          bValue = b.brand.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Calculate facets
    const facets = {
      brands: getFacetCounts(filteredProducts, 'brand'),
      categories: getFacetCounts(filteredProducts, 'category'),
      statuses: getFacetCounts(filteredProducts, 'status'),
      conditions: getFacetCounts(filteredProducts, 'condition'),
      sellers: getFacetCounts(filteredProducts, 'seller', 'name'),
      priceRanges: getPriceRanges(filteredProducts)
    };

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Generate suggestions for current query
    const suggestions = generateSuggestions(q, filteredProducts);

    const response = {
      products: paginatedProducts,
      total: filteredProducts.length,
      facets,
      suggestions,
      searchTime: Math.random() * 100 + 50, // Mock search time
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredProducts.length / parseInt(limit)),
        hasNext: endIndex < filteredProducts.length,
        hasPrev: startIndex > 0
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get facets endpoint
router.get('/facets', async (req, res) => {
  try {
    // This would typically use the same filtering logic as the main search
    // but only return facet counts
    const facets = {
      brands: getFacetCounts(mockProducts, 'brand'),
      categories: getFacetCounts(mockProducts, 'category'),
      statuses: getFacetCounts(mockProducts, 'status'),
      conditions: getFacetCounts(mockProducts, 'condition'),
      sellers: getFacetCounts(mockProducts, 'seller', 'name'),
      priceRanges: getPriceRanges(mockProducts)
    };

    res.json({ facets });
  } catch (error) {
    console.error('Error fetching facets:', error);
    res.status(500).json({ error: 'Failed to fetch facets' });
  }
});

// Export endpoint
router.get('/export', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    // This would use the same filtering logic as the main search
    // but return all results in the requested format
    
    let data, contentType, filename;
    
    switch (format) {
      case 'csv':
        data = generateCSV(mockProducts);
        contentType = 'text/csv';
        filename = 'search-results.csv';
        break;
      case 'xlsx':
        data = generateXLSX(mockProducts);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = 'search-results.xlsx';
        break;
      case 'json':
        data = JSON.stringify(mockProducts, null, 2);
        contentType = 'application/json';
        filename = 'search-results.json';
        break;
      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Helper functions
function getFacetCounts(products, field, subField = null) {
  const counts = {};
  
  products.forEach(product => {
    const value = subField ? product[field][subField] : product[field];
    counts[value] = (counts[value] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function getPriceRanges(products) {
  const ranges = [
    { min: 0, max: 100, count: 0 },
    { min: 100, max: 500, count: 0 },
    { min: 500, max: 1000, count: 0 },
    { min: 1000, max: 5000, count: 0 },
    { min: 5000, max: 10000, count: 0 }
  ];

  products.forEach(product => {
    ranges.forEach(range => {
      if (product.price >= range.min && product.price < range.max) {
        range.count++;
      }
    });
  });

  return ranges.filter(range => range.count > 0);
}

function generateSuggestions(query, products) {
  if (!query || query.length < 2) return [];

  const suggestions = [];
  const queryLower = query.toLowerCase();

  // Get unique values for suggestions
  const brands = [...new Set(products.map(p => p.brand))];
  const categories = [...new Set(products.map(p => p.category))];
  const sellers = [...new Set(products.map(p => p.seller.name))];

  brands.forEach(brand => {
    if (brand.toLowerCase().includes(queryLower)) {
      suggestions.push({
        id: `brand-${brand}`,
        text: brand,
        type: 'brand',
        count: products.filter(p => p.brand === brand).length
      });
    }
  });

  categories.forEach(category => {
    if (category.toLowerCase().includes(queryLower)) {
      suggestions.push({
        id: `category-${category}`,
        text: category,
        type: 'category',
        count: products.filter(p => p.category === category).length
      });
    }
  });

  sellers.forEach(seller => {
    if (seller.toLowerCase().includes(queryLower)) {
      suggestions.push({
        id: `seller-${seller}`,
        text: seller,
        type: 'seller',
        count: products.filter(p => p.seller.name === seller).length
      });
    }
  });

  return suggestions.slice(0, 10);
}

function generateCSV(products) {
  const headers = ['ID', 'Name', 'Brand', 'Category', 'Price', 'Status', 'Condition', 'Featured', 'Seller', 'Submitted At'];
  const rows = products.map(product => [
    product.id,
    product.name,
    product.brand,
    product.category,
    product.price,
    product.status,
    product.condition,
    product.featured ? 'Yes' : 'No',
    product.seller.name,
    product.submittedAt.toISOString()
  ]);

  return [headers, ...rows].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
}

function generateXLSX(products) {
  // In a real implementation, you would use a library like 'xlsx'
  // For now, return CSV as placeholder
  return generateCSV(products);
}

module.exports = router;
