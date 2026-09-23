const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests, please try again later.' }
});

function applySecurity(app) {
  app.use(helmet());
  app.use(limiter);
}

module.exports = applySecurity;
