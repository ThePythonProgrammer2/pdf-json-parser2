const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { parseDocument } = require('./parser');

// Initialize the Express app instance securely
const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware Configuration Settings
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configure Multer to intercept raw file memory buffers safely
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Enforces the front-end 5MB file restriction limit
});

// 1. Tell Express where static web files live
app.use(express.static(path.join(__dirname, '../public')));

// 2. FIXED ENDPOINT & TYPE: Matches the frontend '/api/v1/parse-document' route exactly
app.post('/api/v1/parse-document', upload.single('document'), async (req, res) => {
  try {
    // Structural guard check: Ensure an actual file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bad Request: No file uploaded under field key context "document".' 
      });
    }

    // A. Parse the raw binary PDF file buffer into unstructured string text
    const pdfData = await pdfParse(req.file.buffer);
    const extractedRawText = pdfData.text;

    if (!extractedRawText || extractedRawText.trim() === "") {
      return res.status(422).json({
        success: false,
        error: 'Unprocessable Entity: PDF file read successfully but no text content could be extracted.'
      });
    }

    // B. Run the text layout through your local parsing compiler pipeline logic script
    const result = parseDocument(extractedRawText);

    // C. Return the structural data directly to match the front-end display expectations
    return res.status(200).json(result);

  } catch (error) {
    console.error('Server PDF Processing Failure Engine Log:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error: Parsing engine encountered an extraction failure.',
      details: error.message
    });
  }
});

// 3. Status Landing Route check to eliminate browser "Cannot GET /" crash alerts
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 4. Catch-all fallback routing logic mapping assets cleanly
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Boot listening loop environment
app.listen(PORT, () => {
  console.log(`🚀 Production pipeline aligned and listening smoothly on port ${PORT}`);
});
