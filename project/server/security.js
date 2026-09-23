// server/security.js

/**
 * Applies essential security middleware to the Express app.
 * Keeps configuration minimal to prevent blocking file uploads or frontend scripts.
 * @param {import('express').Application} app 
 */
function applySecurity(app) {
  // Hide Express signature in response headers
  app.disable('x-powered-by');

  // Prevent MIME-type sniffing
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

module.exports = applySecurity;
