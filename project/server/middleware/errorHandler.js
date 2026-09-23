function errorHandler(err, req, res, next) {
  console.error('[Error Handler]:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: true,
    message: err.message || 'An unexpected internal server error occurred.',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
