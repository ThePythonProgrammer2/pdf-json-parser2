// server/index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { parsePdfToJson } = require('./parser');

const app = express();
const PORT = process.env.PORT || 10000;

// Enable CORS & JSON payload parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files from /public directory
app.use(express.static(path.join(__dirname, '../public')));

// Configure Multer for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limits
});

/**
 * Primary PDF Parsing Endpoint
 * Matches frontend fetch field: 'pdf'
 */
app.post('/api/parse', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file received. Please upload a valid PDF document.' 
      });
    }

    // Process PDF buffer through Document AI spatial parser
    const parsedData = await parsePdfToJson(req.file.buffer);

    return res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('API Parse Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'An internal error occurred while parsing the document.'
    });
  }
});

// Fallback route to serve main frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server successfully running on port ${PORT}`);
});
