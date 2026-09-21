const express = require('express');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const { hashBuffer, parseDocument } = require('./parser');
const { resolveApiKey } = require('./keyResolver');

// FIXED PATHS: Matches case sensitivity and flat layout structuring perfectly
const { rapidApiTransactionLogger } = require('./rapidapilogger');
const { sendError, ERROR_CODES } = require('./middleware/errorHandler');

// Import your unified security engine directly
const { upload, validateRapidAPISecret, isValidPdfBuffer } = require('./security');

const app = express();
const PORT = process.env.PORT || 3000;

// Native express tightening: removes framework trace variables
app.disable('x-powered-by');

// Cache handling...
const parseCache = new Map();
const MAX_CACHE_SIZE = 100;
function cacheSet(hash, data) {
  if (parseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = parseCache.keys().next().value;
    parseCache.delete(firstKey);
  }
  parseCache.set(hash, data);
}

// 1. GLOBAL LOGGING LAYER: Evaluates incoming proxy attributes
app.use(rapidApiTransactionLogger);

// 2. PUBLIC ASSET ELEMENT STORAGE: Positioned above security block so webpage can load safely
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// 3. GLOBAL ROUTE GUARD: Automatically enforces Rate Limits and RapidAPI Proxy secrets across your whole API pathing
app.use(validateRapidAPISecret);

// --- Secure Application Routes ---
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', cacheSize: parseCache.size });
});

app.get('/api/v1/key-status', (req, res) => {
  const resolved = resolveApiKey(req);
  res.json({ provider: resolved.provider, configured: !!resolved.key });
});

// Endpoint route utilizing your security imports
app.post('/api/v1/parse-document', (req, res) => {
  const resolvedKey = resolveApiKey(req);

  upload.single('document')(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 413, 'File too large. Maximum allowed size is 5MB.', ERROR_CODES.FILE_TOO_LARGE);
        }
        return sendError(res, 400, err.message || 'File upload error.', ERROR_CODES.VALIDATION_ERROR);
      }

      if (!req.file) {
        return sendError(res, 400, 'No file uploaded. Please upload a PDF under the "document" field.', ERROR_CODES.VALIDATION_ERROR);
      }

      // Check the true underlying magic bytes extracted via your engine export
      if (!isValidPdfBuffer(req.file.buffer)) {
        return sendError(res, 400, 'Malicious or invalid file contents. The uploaded file is structurally not a valid PDF.', ERROR_CODES.VALIDATION_ERROR);
      }

      const buffer = req.file.buffer;
      const fileHash = hashBuffer(buffer);

      if (parseCache.has(fileHash)) {
        return res.json({ ...parseCache.get(fileHash), cached: true });
      }

      let pdfData;
      let timeoutId;
      try {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('PARSING_TIMEOUT')), 10000);
        });

        pdfData = await Promise.race([pdfParse(new Uint8Array(buffer)), timeoutPromise]);
      } catch (parseErr) {
        if (parseErr.message === 'PARSING_TIMEOUT') {
          return sendError(res, 408, 'Processing timeout exceeded while reading the document structure.', ERROR_CODES.INTERNAL_ERROR);
        }
        return sendError(res, 422, 'Failed to read PDF. The file may be corrupted or password-protected.', ERROR_CODES.UNPROCESSABLE_CONTENT);
      } finally {
        clearTimeout(timeoutId);
      }

      const rawText = (pdfData && pdfData.text) ? pdfData.text : '';

      if (!rawText.trim()) {
        const emptyResult = {
          document_type: 'unknown',
          confidence_score: 0.0,
          primary_entity: null,
          date: null,
          financials: { total_amount: null, currency: null, tax_amount: null },
          extracted_items: [],
          raw_summary: 'No readable text could be extracted from this PDF. The document may be a scanned image without OCR text.',
        };
        cacheSet(fileHash, emptyResult);
        return res.json(emptyResult);
      }

      const structured = parseDocument(rawText);
      cacheSet(fileHash, structured);
      return res.json({ ...structured, cached: false });

    } catch (unexpectedErr) {
      console.error('Internal error during document parsing:', unexpectedErr);
      return sendError(res, 500, 'An unexpected error occurred while processing the document.', ERROR_CODES.INTERNAL_ERROR);
    }
  });
});

app.use((req, res) => {
  sendError(res, 404, 'The requested endpoint was not found.', ERROR_CODES.VALIDATION_ERROR);
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('Unhandled server error:', err);
  sendError(res, 500, 'An unexpected server error occurred.', ERROR_CODES.INTERNAL_ERROR);
});

module.exports = app;
