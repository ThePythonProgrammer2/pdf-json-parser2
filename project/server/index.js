const express = require('express');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const { hashBuffer, parseDocument, buildAiPrompt } = require('./parser');
const { resolveApiKey, buildProviderRequest, safeFetch } = require('./keyResolver');

// Path configurations synchronized with your flat file architecture
const { rapidApiTransactionLogger } = require('./rapidapilogger');
const { sendError, ERROR_CODES } = require('./middleware/errorHandler');

// Import your unified security engine directly
const { upload, validateRapidAPISecret, isValidPdfBuffer } = require('./security');

const app = express();
const PORT = process.env.PORT || 3000;

// --- NATIVE HARDENING: Disable framework footprint headers ---
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

// 1. GLOBAL LOGGING LAYER: Evaluates incoming proxy transaction context
app.use(rapidApiTransactionLogger);

// 2. PUBLIC ASSET ELEMENT STORAGE: Positioned above security block so webpage loads safely
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use(express.static(publicDir));

// 3. GLOBAL ROUTE GUARD: Enforces rate limits and RapidAPI payload secret verification
app.use(validateRapidAPISecret);

// --- Secure Application Routes ---

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

      // --- INTERNAL SECURITY: Block spoofed file extensions via header byte checks ---
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
        clearTimeout(timeoutId); // Garbage collection: clear the active timer immediately
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

      // --- STEP 1: Attempt Free Native Extraction (Heuristic Regex Parser) ---
      let result = parseDocument(rawText);

      // --- STEP 2: HYBRID AI FALLBACK ENGINE LAYER ---
      // If native regex returns an uncertain validation threshold, query our cloud model
      const needsAiFallback = result.document_type === 'unknown' || 
                              result.confidence_score < 0.70 || 
                              (result.document_type === 'invoice' && result.extracted_items.length === 0);

      if (needsAiFallback && resolvedKey.key) {
        console.log(`[AI Fallback] Processing structure via upstream ${resolvedKey.provider} engine...`);
        
        // Build prompt layout matching your system configurations
        const promptString = buildAiPrompt(rawText);
        const providerConfig = buildProviderRequest(resolvedKey, promptString);
        
        // Execute the out-of-band query safely
        const aiResponse = await safeFetch(providerConfig.url, providerConfig.headers, providerConfig.body);
        
        if (aiResponse.ok && aiResponse.data) {
          try {
            let rawJson = aiResponse.data;
            
            // Clean out markdown backticks if model accidentally returns them
            if (aiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text) {
              const textContent = aiResponse.data.candidates[0].content.parts[0].text;
              const cleanJsonText = textContent.replace(/```json|```/g, '').trim();
              rawJson = JSON.parse(cleanJsonText);
            } else if (aiResponse.data.choices?.[0]?.message?.content) { // OpenRouter mapping hook
              const textContent = aiResponse.data.choices[0].message.content;
              const cleanJsonText = textContent.replace(/```json|```/g, '').trim();
              rawJson = JSON.parse(cleanJsonText);
            }

            // Adopt high-confidence structured properties directly
            if (rawJson && typeof rawJson === 'object' && rawJson.document_type) {
              result = {
                ...rawJson,
                ai_assisted: true
              };
            }
          } catch (jsonExtractionErr) {
            console.error('[AI Fallback Error] Failed to parse engine model object:', jsonExtractionErr.message);
          }
        } else {
          console.error('[AI Fallback Error] Upstream provider failed:', aiResponse.error);
        }
      }

      // Save to cache and return response
      cacheSet(fileHash, result);
      return res.json({ ...result, cached: false });

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
