/**
 * RapidAPI Marketplace compliance middleware.
 *
 * Intercepts every incoming request and logs the RapidAPI transaction
 * headers (x-rapidapi-user, x-rapidapi-subscription) so marketplace
 * transaction volumes can be audited from the server terminal.
 *
 * Also attaches a lightweight transaction record to req for downstream use.
 */

/**
 * Masks a subscription string for terminal display, showing only
 * the first and last 2 characters of the tier segment.
 * @param {string} sub
 * @returns {string}
 */
function maskSubscription(sub) {
  if (!sub || typeof sub !== 'string') return 'N/A';
  if (sub.length <= 6) return sub;
  // subscription often looks like "basic-tier-uuid-abc123"
  // show first 6 + last 4 for auditability without leaking full ID
  return `${sub.slice(0, 6)}...${sub.slice(-4)}`;
}

/**
 * Express middleware that logs RapidAPI transaction headers.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} next
 */
function rapidApiTransactionLogger(req, res, next) {
  const rapidApiUser = req.headers['x-rapidapi-user'] || null;
  const rapidApiSubscription = req.headers['x-rapidapi-subscription'] || null;
  const rapidApiProxy = req.headers['x-rapidapi-proxy'] || null;
  
  // Extract the true downstream client IP routed through the proxy cluster
  const realClientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;

  // Attach transaction metadata to req for downstream handlers and rate-limit tracking
  req.rapidApiTransaction = {
    user: rapidApiUser,
    subscription: rapidApiSubscription,
    proxy: rapidApiProxy,
    clientIp: realClientIp,
    timestamp: new Date().toISOString(),
  };

  // Only log when this looks like a genuine RapidAPI marketplace request
  if (rapidApiUser || rapidApiSubscription) {
    const maskedSub = maskSubscription(rapidApiSubscription);
    console.log(
      `[RapidAPI] ${new Date().toISOString()} | ` +
      `user=${rapidApiUser || 'unknown'} | ` +
      `subscription=${maskedSub} | ` +
      `client_ip=${realClientIp} | ` +
      `${req.method} ${req.path}`
    );
  }

  next();
}

module.exports = { rapidApiTransactionLogger, maskSubscription };
