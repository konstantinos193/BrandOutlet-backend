const path = require('path');
const fs = require('fs');

// HTML response middleware
const htmlResponse = (req, res, next) => {
  // Check if the request wants HTML response
  const wantsHtml = req.query.format === 'html' || 
                   req.headers.accept?.includes('text/html') ||
                   req.path.includes('/api-response');

  if (wantsHtml) {
    // Store original res.json method
    const originalJson = res.json.bind(res);
    
    // Override res.json to serve HTML instead
    res.json = function(data) {
      // Read the HTML template
      const htmlPath = path.join(__dirname, 'views', 'api-response.html');
      
      try {
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // Inject the response data into the HTML
        const responseData = JSON.stringify(data);
        html = html.replace(
          'x-data="apiViewer()"',
          `x-data="apiViewer()" x-init="response = ${responseData}; loading = false; lastFetch = new Date('${new Date().toISOString()}')"`
        );
        
        // Set content type to HTML
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        console.error('Error serving HTML response:', error);
        // Fallback to JSON if HTML fails
        originalJson(data);
      }
    };
  }
  
  next();
};

module.exports = htmlResponse;
