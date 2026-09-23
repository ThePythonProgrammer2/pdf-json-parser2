const express = require('express');
const cors = require('cors');
const path = require('path'); // Added for managing static folder paths cleanly
const { parseDocument } = require('./parser');

// Initialize the Express app instance securely (Fixes "app is not defined")
const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware Configuration Settings
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allows processing deep text documents safely

// 1. ONE-SIZE-FITS-ALL: Tell Express where static web files live if built locally
app.use(express.static(path.join(__dirname, '../public')));

// 2. FIXED: Catch browser home requests directly to fix the "Cannot GET /" error
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    message: 'Parser backend engine is running securely.',
    endpoints: {
      parse: '/api/parse (POST)'
    },
    timestamp: new Date().toISOString()
  });
});

// Core Document Parsing Route Entry Point
app.post('/api/parse', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bad Request: Missing raw text payload parameters.' 
      });
    }

    // Process the text layout synchronously through your local parsing script
    const result = parseDocument(text);

    // Return a clean single object format to match your bolt.new frontend card view contracts
    return res.status(200).json(result);

  } catch (error) {
    console.error('Server Processing Pipeline Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error encountered during parsing.',
      details: error.message
    });
  }
});

// 3. ONE-SIZE-FITS-ALL: Serve the React index file if a browser reloads a front-end route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
    if (err) {
      // If the static html files aren't built or uploaded yet, fail safely with clean JSON
      res.status(404).json({
        success: false,
        error: 'Route path not found, or frontend build directory is missing.'
      });
    }
  });
});

// Boot listening environment
app.listen(PORT, () => {
  console.log(`🚀 Stable parser engine active on http://localhost:${PORT}`);
});
