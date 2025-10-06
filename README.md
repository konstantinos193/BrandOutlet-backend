# ResellAPI - Backend Analytics Service

A comprehensive Node.js backend service for tracking user preferences, page analytics, and marketing insights for the Jordan Resell platform.

## 🚀 Features

### User Preferences Tracking
- **Gender Selection**: Track male/female preferences
- **Clothing Sizes**: Monitor size distribution (XS-XXL)
- **Shoe Sizes**: Track shoe size preferences (US 6-15)
- **Marketing Insights**: Generate size recommendations and trends

### Page Analytics
- **Real-time Tracking**: Monitor page views and user behavior
- **Geolocation Data**: Country and city-level analytics
- **Device Analytics**: Track devices, browsers, and operating systems
- **Session Management**: Unique session tracking with UUID

### Admin Dashboard
- **Comprehensive Analytics**: Gender distribution, size preferences
- **Geographic Insights**: Top countries, cities, and regions
- **Device Statistics**: Popular devices and browsers
- **Export Functionality**: CSV export for data analysis

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi schema validation
- **Geolocation**: geoip-lite for IP-based location
- **Logging**: Morgan for HTTP request logging

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/konstantinos193/resellapi.git
   cd resellapi
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables in `.env`:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

## 🔧 API Endpoints

### User Preferences
- `POST /api/user-preferences` - Save user preferences
- `GET /api/user-preferences/analytics` - Get preferences analytics

### Page Tracking
- `POST /api/page-tracking/view` - Track page view
- `POST /api/page-tracking/exit` - Track page exit
- `GET /api/page-tracking/analytics` - Get page analytics

### General Analytics
- `GET /api/analytics` - Get comprehensive analytics data

## 📊 Analytics Data Structure

### User Preferences Analytics
```json
{
  "totalUsers": 150,
  "genderDistribution": {
    "male": 65,
    "female": 85
  },
  "clothingSizeDistribution": {
    "XS": 5,
    "S": 25,
    "M": 45,
    "L": 35,
    "XL": 25,
    "XXL": 15
  },
  "shoeSizeDistribution": {
    "6": 8,
    "7": 12,
    "8": 18,
    "9": 22,
    "10": 28,
    "11": 20,
    "12": 15,
    "13": 10,
    "14": 5,
    "15": 2
  }
}
```

### Page Analytics
```json
{
  "totalPageViews": 1250,
  "uniqueSessions": 150,
  "topPages": [
    { "path": "/", "views": 450 },
    { "path": "/products", "views": 320 },
    { "path": "/about", "views": 180 }
  ],
  "topCountries": [
    { "country": "United States", "views": 450 },
    { "country": "Canada", "views": 180 }
  ],
  "topDevices": [
    { "device": "Mobile", "views": 750 },
    { "device": "Desktop", "views": 500 }
  ]
}
```

## 🔒 Security Features

- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents API abuse with configurable limits
- **Helmet**: Security headers for Express.js
- **Input Validation**: Joi schema validation for all endpoints
- **Error Handling**: Comprehensive error handling and logging

## 🌍 Geolocation Features

- **IP-based Location**: Automatic country and city detection
- **Device Detection**: User agent parsing for device/browser info
- **Privacy Conscious**: No personal data collection, only aggregated analytics

## 📈 Marketing Insights

### Size Recommendations
- **Popular Sizes**: Track most selected sizes by gender
- **Size Trends**: Monitor size preference changes over time
- **Inventory Planning**: Data-driven inventory decisions

### Geographic Analytics
- **Market Penetration**: Identify key markets and regions
- **Localization**: Understand regional preferences
- **Expansion Planning**: Data for market expansion decisions

## 🚀 Deployment

### Environment Variables
```env
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

### Production Considerations
- Use a reverse proxy (nginx) for production
- Implement proper logging and monitoring
- Set up database persistence (currently in-memory)
- Configure proper CORS origins
- Set up SSL/TLS certificates

## 📝 Development

### Project Structure
```
resellapi/
├── api/
│   ├── analytics.js          # General analytics endpoints
│   ├── pageTracking.js       # Page tracking endpoints
│   └── userPreferences.js    # User preferences endpoints
├── config/
│   └── database.js           # Database configuration
├── utils/
│   └── geolocation.js        # Geolocation utilities
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

### Adding New Features
1. Create new API endpoints in the `api/` directory
2. Add validation schemas using Joi
3. Update the main server.js to include new routes
4. Add comprehensive error handling
5. Update this README with new endpoint documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email konstantinos193@users.noreply.github.com or create an issue in the repository.

---

**Built with ❤️ for the Jordan Resell platform**