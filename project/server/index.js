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

// Configure Multer for File Uploads (In-Memory Buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'), false);
    }
  }
});

// 1. Core & Security Middleware
applySecurity(app);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../public')));

// 3. Healthcheck Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4. PDF Upload & Parsing Endpoint
app.post('/api/parse', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No PDF file uploaded. Please send a file under the "file" field.'
      });
    }

    // Call parser function with uploaded file buffer
    const result = await parsePdfToJson(req.file.buffer);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// 5. Global Error Handler
app.use(errorHandler);

// 6. Single Listener Execution Guard
if (require.main === module || process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server successfully running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[EADDRINUSE Error] Port ${PORT} is already bound. Ensure duplicate listen calls are removed.`);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

module.exports = app;
