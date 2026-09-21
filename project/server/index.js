const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const { hashBuffer, parseDocument } = require('./parser');
const { resolveApiKey } = require('./keyResolver');
const { rapidApiTransactionLogger } = require('./middleware/rapidApiLogger');
const { sendError, ERROR_CODES } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// --- NATIVE HARDENING: Disable footprinting headers ---
app.disable('x-powered-by');

// --- In-memory cache keyed by file content hash ---
const parseCache = new Map();
const MAX_CACHE_SIZE = 100;

/**
 * Adds a result to the cache, evicting the oldest entry if at capacity.
 * @param {string} hash
 * @param {Object} data
 */
function cacheSet(hash, data) {
  if (parseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = parseCache.keys().next().value;
    parseCache.delete(firstKey);
  }
  parseCache.set(hash, data);
}

// --- INTERNAL SECURITY: In-memory sliding window rate limiter ---
const rateLimitMap = new Map();
const LIMIT_WINDOW_MS = 60000; // 1 minute tracking window
const MAX_REQUESTS_PER_WINDOW = 30; // Max allowed requests per minute per IP

function isRateLimited(clientIp) {
  const now = Date.now();
  const userData = rateLimitMap.get(clientIp);

  if (!userData) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + LIMIT_WINDOW_MS });
    return false;
  }

  if (now > userData.resetTime) {
    // Window expired; clear out data and restart tracking natively
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + LIMIT_WINDOW_MS });
    return false;
  }

  userData.count += 1;
  return userData.count > MAX_REQUESTS_PER_WINDOW;
}

// --- INTERNAL SECURITY: Verify genuine PDF byte signatures ---
function isValidPdfBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  // Verify the magic numbers match the official binary standard '%PDF'
  return buffer.toString('utf8', 0, 4) === '%PDF';
}

// --- Multer config: in-memory storage, 5MB limit, PDFs only ---
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// --- RapidAPI transaction logging middleware (applied to all routes) ---
app.use(rapidApiTransactionLogger);

// --- RapidAPI Gateway Security Proxy & Rate Limit Check ---
app.use((req, res, next) => {
  // Exclude static assets or public roots from processing guards
  if (req.path === '/' || !req.path.startsWith('/api/')) {
    return next();
  }

  // 1. Internal Rate Limiter Check (Aligned with your exact ERROR_CODES definition)
  if (isRateLimited(req.ip)) {
    return sendError(
      res,
      429,
      'Too many requests. Please slow down your execution rate.',
      ERROR_CODES.RATE_LIMITED
    );
  }

  // 2. Proxy Gateway Validation Check
  const proxySecretReceived = req.headers['x-rapidapi-proxy-secret'];
  const trustedProxySecret = process.env.RAPIDAPI_PROXY_SECRET || 'YOUR_RAPIDAPI_PROXY_SECRET_HERE';

  if (!proxySecretReceived || proxySecretReceived !== trustedProxySecret) {
    return sendError(
      res, 
      401, 
      'Unauthorized access. Requests must be routed through the official RapidAPI Gateway.', 
      ERROR_CODES.INTERNAL_ERROR // Fallback classification for security blocks
    );
  }
  
  next();
});

// --- Serve static frontend ---
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// --- Health check ---
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', cacheSize: parseCache.size });
});

// --- API key status endpoint (for marketplace consumers) ---
app.get('/api/v1/key-status', (req, res) => {
  const resolved = resolveApiKey(req);
  res.json({
    provider: resolved.provider,
    configured: !!resolved.key,
  });
});

// --- Main parsing endpoint ---
app.post('/api/v1/parse-document', (req, res) => {
  const resolvedKey = resolveApiKey(req);

  upload.single('document')(req, res, async (err) => {
    try {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(
            res, 413,
            'File too large. Maximum allowed size is 5MB.',
            ERROR_CODES.FILE_TOO_LARGE,
          );
        }
        return sendError(res, 400, err.message || 'File upload error.', ERROR_CODES.VALIDATION_ERROR);
      }

      if (!req.file) {
        return sendError(
          res, 400,
          'No file uploaded. Please upload a PDF under the "document" field.',
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      // --- INTERNAL SECURITY: Block spoofed MIME extensions via header byte checks ---
      if (!isValidPdfBuffer(req.file.buffer)) {
        return sendError(
          res, 400,
          'Malicious or invalid file contents. The uploaded file is structurally not a valid PDF.',
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const buffer = req.file.buffer;
      const fileHash = hashBuffer(buffer);

      // --- Check cache ---
      if (parseCache.has(fileHash)) {
        const cached = parseCache.get(fileHash);
        return res.json({ ...cached, cached: true });
      }

      // --- Parse PDF with Active Timeout Management ---
      let pdfData;
      let timeoutId;
      try {
        const TIMEOUT_CEILING_MS = 10000; // Stop execution if parsing stalls out past 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('PARSING_TIMEOUT')), TIMEOUT_CEILING_MS);
        });

        pdfData = await Promise.race([
          pdfParse(new Uint8Array(buffer)),
          timeoutPromise
        ]);
      } catch (parseErr) {
        if (parseErr.message === 'PARSING_TIMEOUT') {
          return sendError(
            res, 408,
            'Processing timeout exceeded while reading the document structure.',
            ERROR_CODES.INTERNAL_ERROR
          );
        }
        return sendError(
          res, 422,
          'Failed to read PDF. The file may be corrupted or password-protected.',
          ERROR_CODES.UNPROCESSABLE_CONTENT,
        );
      } finally {
        // Garbage collection: clear the active timer immediately to conserve memory
        clearTimeout(timeoutId);
      }

      const rawText = (pdfData && pdfData.text) ? pdfData.text : '';

      if (!rawText.trim()) {
        const emptyResult = {
          document_type: 'unknown',
          confidence_score: 0.0,
          primary_entity: null,
          date: null,
          financials: {
            total_amount: null,
            currency: null,
            tax_amount: null,
          },
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
      return sendError(
        res, 500,
        'An unexpected error occurred while processing the document.',
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
  });
});

// --- 404 handler for unknown routes ---
app.use((req, res) => {
  sendError(res, 404, 'The requested endpoint was not found.', ERROR_CODES.VALIDATION_ERROR);
});

// --- Global error handler — must be LAST middleware (after all routes) ---
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('Unhandled server error:', err);
  sendError(res, 500, 'An unexpected server error occurred.', ERROR_CODES.INTERNAL_ERROR);
});

module.exports = app;
