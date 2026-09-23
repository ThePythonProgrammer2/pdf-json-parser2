const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Added to read and sanitize frontend assets dynamically
const { parseDocument } = require('./parser');

// Initialize the Express app instance securely (Fixes "app is not defined")
const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware Configuration Settings
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allows processing deep text documents safely

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

// 1. Serve static companion files (like CSS or images) normally
app.use(express.static(path.join(__dirname, '../public'), { index: false }));

// 2. ONE-SIZE-FITS-ALL CATCH: Intercept html deliveries and auto-correct frontend endpoint strings on the fly
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  
  fs.readFile(indexPath, 'utf8', (err, htmlContent) => {
    if (err) {
      // If the static html files aren't built or uploaded yet, fail safely with clean JSON
      return res.status(404).json({
        success: false,
        error: 'Route path not found, or frontend build directory is missing.'
      });
    }

    // MASTER FIX: Automatically scrubs any hardcoded local development URLs out of your frontend HTML/JS 
    // before it arrives in the user's browser, forcing it to route to Render relatively.
    const stabilizedHtml = htmlContent.replace(/http:\/\/localhost:3001/g, '');
    
    res.send(stabilizedHtml);
  });
});

// Boot listening environment
app.listen(PORT, () => {
  console.log(`🚀 Stable parser engine active on http://localhost:${PORT}`);
});
