// server/index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const applySecurity = require('./security');
const errorHandler = require('./errorHandler');
const { parsePdfToJson } = require('./parser');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Apply Security Headers & Middleware
applySecurity(app);

// 2. Enable CORS & Body Parsing
app.use(cors());
app.use(express.json());

// 3. Serve Static Frontend
app.use(express.static(path.join(__dirname, '../public')));

// 4. Configure Multer Upload Memory Limits
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

/**
 * Primary PDF Parsing Endpoint
 */
app.post('/api/parse', upload.single('pdf'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file received. Please upload a valid PDF document.' 
      });
    }

    const parsedData = await parsePdfToJson(req.file.buffer);

    return res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    next(error);
  }
});

// Fallback route for SPA single-page frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Centralized Error Handler
app.use(errorHandler);

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server successfully running on port ${PORT}`);
});
