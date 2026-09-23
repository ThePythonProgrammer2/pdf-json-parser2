// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const applySecurity = require('./security');
const errorHandler = require('./middleware/errorHandler');
const { parsePdfToJson } = require('./parser');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Security & Core Middleware
applySecurity(app);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Serve Static Frontend Files
app.use(express.static(path.join(__dirname, '../public')));

// 3. Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4. Global Error Handler
app.use(errorHandler);

// 5. Single Listener Execution
if (require.main === module || process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Server successfully listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Error] Port ${PORT} is already in use. Ensure no duplicate listen calls exist.`);
    } else {
      console.error('[Error] Server encountered an unexpected issue:', err);
    }
  });
}

module.exports = app;
