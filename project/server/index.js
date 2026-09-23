const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parsePdfToJson } = require('./parser');
const applySecurity = require('./security');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure File Upload via Multer (In-memory storage)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/i)) {
      return cb(new Error('Only PDF files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
applySecurity(app);

// API Endpoints
app.post('/api/parse', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'Please upload a PDF file.' });
    }

    const result = await parsePdfToJson(req.file.buffer);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// Error Handling Middleware
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
