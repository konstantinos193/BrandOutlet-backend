const { parseUserAgent } = require('./utils/geolocation');

// Test cases for device and browser detection
const testCases = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Firefox on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  
  // Safari on iPhone
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
  
  // Chrome on Android
  'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  
  // Safari on iPad
  'Mozilla/5.0 (iPad; CPU OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1.2 Mobile/15E148 Safari/604.1',
  
  // Opera on Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
  
  // Internet Explorer
  'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko'
];

console.log('🧪 Testing Device and Browser Detection\n');
console.log('=' .repeat(80));

testCases.forEach((userAgent, index) => {
  console.log(`\nTest Case ${index + 1}:`);
  console.log(`User Agent: ${userAgent}`);
  
  const result = parseUserAgent(userAgent);
  
  console.log(`Browser: ${result.browser} ${result.browserVersion}`);
  console.log(`OS: ${result.os} ${result.osVersion}`);
  console.log(`Device: ${result.device}`);
  console.log(`Mobile: ${result.isMobile}, Tablet: ${result.isTablet}, Desktop: ${result.isDesktop}`);
  console.log('-'.repeat(60));
});

console.log('\n✅ Device and Browser Detection Test Complete!');
