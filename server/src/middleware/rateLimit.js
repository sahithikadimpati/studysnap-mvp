const rateLimit = require('express-rate-limit');
const { hasCredits, consumeCredit } = require('../services/credits');

/**
 * IP-based rate limiting: 20 requests per minute per IP
 */
const ipRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again after a minute.'
  },
  handler: (req, res, next, options) => {
    res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
    res.status(options.statusCode).send(options.message);
  }
});

/**
 * Credit-based daily rate limiting: 50 requests per day per authenticated user.
 * Note: Since auth is not yet fully wired up, we only enforce this if req.user or req.userId is present.
 */
function creditRateLimiter(req, res, next) {
  const userId = req.userId || (req.user && req.user.id);
  
  if (!userId) {
    // If no authenticated user (e.g. anonymous requests during P1 testing), bypass credit limit
    return next();
  }

  // Check if user has daily credits left
  if (!hasCredits(userId)) {
    // Calculate seconds until next midnight (approximate reset time)
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const retryAfterSeconds = Math.ceil((midnight - now) / 1000);

    res.setHeader('Retry-After', retryAfterSeconds);
    return res.status(429).json({
      status: 429,
      message: 'You have consumed all your daily credits. Credits reset every 24 hours.'
    });
  }

  // Consume 1 credit
  consumeCredit(userId);
  next();
}

module.exports = {
  ipRateLimiter,
  creditRateLimiter
};
