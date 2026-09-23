// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const applySecurity = require('./security');
const errorHandler = require('./middleware/errorHandler');
const { parsePdfToJson } = require('./parser');

const app = express();
const PORT = process.env.PORT || 10000;

// Configure Multer in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// 1. Core Security & CORS Middleware (MUST COME FIRST)
applySecurity(app);
app.use(cors());

// 2. Logging Middleware for Debugging
app.use((req, res, next) => {
  if (req.path === '/api/parse') {
    console.log(`[Incoming Request] ${req.method} ${req.path} - Content-Type: ${req.headers['content-type']}`);
  }
  next();
});

// 3. Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../public')));

// 4. JSON / URL Body Parsers (Excludes multipart/form-data streams to prevent corruption)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 6. PDF Upload & Parse Route
app.post('/api/parse', (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    // Handle Multer specific upload errors
    if (err) {
      console.error('[Multer Error]:', err.message);
      return res.status(400).json({
        error: true,
        message: `File upload error: ${err.message}`
      });
    }

    try {
      if (!req.file || !req.file.buffer) {
        console.error('[Upload Failed]: No file payload found in req.file');
        return res.status(400).json({
          error: true,
          message: 'No file received. Ensure you are uploading a valid PDF under key "file".'
        });
      }

      console.log(`[Processing File]: ${req.file.originalname} (${req.file.size} bytes)`);

      // Execute PDF Parser logic
      const parsedData = await parsePdfToJson(req.file.buffer);

      console.log('[Parse Success]: Returning JSON output to client.');
      return res.status(200).json({
        success: true,
        fileName: req.file.originalname,
        data: parsedData
      });

    } catch (parseError) {
      console.error('[Parsing Pipeline Error]:', parseError);
      return res.status(500).json({
        error: true,
        message: parseError.message || 'Error occurred while parsing the PDF.'
      });
    }
  });
});

// 7. Global Error Handler
app.use(errorHandler);

// 8. Server Listener Guard
if (require.main === module || process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server successfully running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[EADDRINUSE Error] Port ${PORT} is bound. Ensure no duplicate listen calls exist.`);
    } else {
      console.error('[Server Error]:', err);
    }
  });
}

module.exports = app;
