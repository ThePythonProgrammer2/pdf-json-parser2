// server/middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  console.error('[Server Error Trace]:', err.stack || err.message);

  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: true,
    message: err.message || 'An internal server error occurred while processing the PDF.',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
