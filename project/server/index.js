// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const applySecurity = require('./security');
const errorHandler = require('./middleware/errorHandler');
const { parsePdfToJson } = require('./parser');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Core & Security Middleware
applySecurity(app);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve Static Assets
app.use(express.static(path.join(__dirname, '../public')));

// 3. Healthcheck Endpoint (For Render monitoring)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4. Global Error Handling
app.use(errorHandler);

// 5. Single Listener Execution Guard
// Prevents EADDRINUSE when file is imported by test modules or other entry points
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
