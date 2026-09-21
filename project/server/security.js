const multer = require('multer');
const { sendError, ERROR_CODES } = require('./middleware/errorHandler');

// --- INTERNAL DEFENSE: In-memory sliding window rate limiter ---
const rateLimitMap = new Map();
const LIMIT_WINDOW_MS = 60000; // 1 minute tracking window
const MAX_REQUESTS_PER_WINDOW = 30; // Max allowed requests per minute per IP

/**
 * Checks if a given IP address has exceeded the API velocity cap.
 * @param {string} clientIp 
 * @returns {boolean}
 */
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

/**
 * Verifies that the buffer contains the official PDF binary standard header.
 * Blocks malicious script or payload spoofing pretending to be a PDF extension.
 * @param {Buffer} buffer 
 * @returns {boolean}
 */
function isValidPdfBuffer(buffer) {
  if (!buffer || buffer.length < 4) return false;
  // Verify the magic numbers match the official binary standard '%PDF'
  return buffer.toString('utf8', 0, 4) === '%PDF';
}

// 1. FRONTEND DEFENSE: Set up memory storage and enforce the strict 5MB limit
const upload = multer({
  storage: multer.memoryStorage(), // ZERO RETENTION: Keeps files in RAM, never writes to disk
  limits: { fileSize: 5 * 1024 * 1024 }, // Blocks anything over 5MB
  fileFilter: (req, file, cb) => {
    // Primary structural check before binary processing
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// 2. GATEWAY SECURITY: Middleware to validate the RapidAPI Proxy Secret & Velocity
const validateRapidAPISecret = (req, res, next) => {
  const currentUrl = req.originalUrl || '';

  // A. ALLOW LOCAL FRONTEND: Allow requests coming directly from your own hosted index.html page
  const referer = req.headers['referer'] || '';
  const host = req.headers['host'] || '';
  const isInternalRequest = referer && host && referer.includes(host);

  // If the request originates from your own website UI dashboard view, allow it to pass natively
  if (currentUrl === '/' || currentUrl.startsWith('/?') || isInternalRequest) {
    return next();
  }

  // B. INTERNAL VELOCITY PROTECTION
  if (isRateLimited(req.ip)) {
    return sendError(
      res,
      429,
      'Too many requests. Please slow down your execution rate.',
      ERROR_CODES.RATE_LIMITED
    );
  }

  // C. PROXY GATEWAY VALIDATION (For paying marketplace developers)
  const incomingSecret = req.headers['x-rapidapi-proxy-secret'];
  const trustedProxySecret = process.env.RAPIDAPI_PROXY_SECRET || 'YOUR_RAPIDAPI_PROXY_SECRET_HERE';

  if (!incomingSecret || incomingSecret !== trustedProxySecret) {
    return sendError(
      res, 
      401, 
      'Unauthorized access. Requests must be routed through the official RapidAPI Gateway.', 
      ERROR_CODES.INTERNAL_ERROR
    );
  }
  
  next(); // Everything matches perfectly, proceed safely
};

module.exports = {
  upload,
  validateRapidAPISecret,
  isValidPdfBuffer
};
