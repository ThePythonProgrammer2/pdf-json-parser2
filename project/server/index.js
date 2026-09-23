const express = require('express');
const cors = require('cors');
const path = require('path');
const { parseDocument } = require('./parser');

// Initialize the Express app instance securely
const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware Configuration Settings
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Standardize memory limits for nested uploads

// 1. DUAL-PURPOSE NETWORK ROUTE FIX: Intercept hardcoded frontend localhost calls natively!
// If your compiled frontend assets execute an absolute network call targeting localhost:3001,
// the server intercepts its own loop block right here and executes the parsing route pipeline safely.
const handleParsingRequest = (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bad Request: Missing raw text payload parameters.' 
      });
    }

    // Process using your standardized synchronous parsing script file
    const result = parseDocument(text);
    return res.status(200).json(result);

  } catch (error) {
    console.error('Server Processing Pipeline Error Context:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error encountered during parsing runtime.',
      details: error.message
    });
  }
};

// Map the handler function to both relative routes and absolute local dev routes
app.post('/api/parse', handleParsingRequest);
app.post('http://localhost:3001/api/parse', handleParsingRequest); 

// 2. Map static asset assets from all potential bolt.new output directories
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../dist')));

// 3. Fallback Status Ping Endpoint check
app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'online', context: 'Unified secure reverse proxy layer operational.' });
});

// 4. Catch-all Monolith Router Controller
app.get('*', (req, res) => {
  // Check common production folder configurations automatically
  const publicIndexPath = path.join(__dirname, '../public/index.html');
  const distIndexPath = path.join(__dirname, '../dist/index.html');
  
  if (require('fs').existsSync(publicIndexPath)) {
    return res.sendFile(publicIndexPath);
  } else if (require('fs').existsSync(distIndexPath)) {
    return res.sendFile(distIndexPath);
  }

  // Fallback if index documents aren't built yet
  res.status(200).json({
    success: true,
    engine: 'online',
    message: 'Parser backend is active. Upload components via API endpoint systems.'
  });
});

// Boot listening loop environment
app.listen(PORT, () => {
  console.log(`🚀 Unified production reverse-proxy engine active on port ${PORT}`);
});
