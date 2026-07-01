/**
 * Request Logging Middleware for StudySnap.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  // Wait for request to finish to log status code and response time
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - IP: ${ip}`);
  });

  next();
}

module.exports = {
  requestLogger
};
