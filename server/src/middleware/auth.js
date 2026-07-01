const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'studysnap-super-secret-jwt-key';

/**
 * Middleware to authenticate requests using JWT and validating session against database
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: 'Access token is missing. Please sign in.'
    });
  }

  try {
    // 1. Verify the JWT token signature and decode it
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Validate session against the SQLite database sessions table
    const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
    
    if (!session) {
      return res.status(401).json({
        status: 401,
        message: 'Session is invalid or has been logged out.'
      });
    }

    // 3. Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    if (now > expiresAt) {
      // Clean up expired session
      db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
      return res.status(401).json({
        status: 401,
        message: 'Your session has expired. Please sign in again.'
      });
    }

    // 4. Attach user details to the request object
    req.userId = session.user_id;
    req.sessionId = session.id;
    req.token = token;

    next();
  } catch (error) {
    console.error('JWT Authentication Error:', error);
    return res.status(403).json({
      status: 403,
      message: 'Invalid or tampered access token.'
    });
  }
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
