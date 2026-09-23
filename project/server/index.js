const express = require('express');
const cors = require('cors');
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

// Boot listening environment
app.listen(PORT, () => {
  console.log(`🚀 Stable parser engine active on http://localhost:${PORT}`);
});
